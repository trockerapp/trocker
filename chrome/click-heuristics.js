// Modular heuristic click-tracker detection for Trocker.
// Configuration lives in chrome/tracker-data.js (CLICK_HEURISTICS_CONFIG) and is passed via setConfig().
// Loaded before trocker.js as a content script (attaches to globalThis.TrockerClickHeuristics)
// and also supports CommonJS require() for unit testing in Node.
(function (root) {
	'use strict';

	const MULTI_PART_TLDS = new Set([
		'co.uk',
		'org.uk',
		'ac.uk',
		'com.au',
		'net.au',
		'co.jp',
		'com.br',
		'co.nz',
		'co.in',
	]);

	const PATH_EMBEDDED_URL_REGEX = /\/https?(?::|%3A)(?:\/\/|%2F%2F)/i;

	const DEFAULT_THRESHOLDS = {
		pathTokenMinLen: 24,
		queryTokenMinLen: 32,
		hexBlobMinLen: 32,
		hexBlobMinEntropy: 3.3,
		base64BlobMinLen: 40,
		base64BlobMinEntropy: 4.4,
		highEntropyParamMinLen: 80,
		highEntropyParamMinEntropy: 4.6,
		homogenizationMinLinks: 4,
		homogenizationMinDistinctTexts: 3,
		homogenizationMinOpaqueRatio: 0.8,
	};

	const V3_RUN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

	function decodeUrlSafeBase64Utf8(b64) {
		if (!b64) return '';
		const std = b64.replace(/-/g, '+').replace(/_/g, '/');
		const padded = std + '='.repeat((4 - (std.length % 4)) % 4);
		const bin = atob(padded);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
	}

	function decodeProofpointV3(rawUrlPart, match) {
		if (!rawUrlPart) return null;
		// Fix single-slash protocol normalization (e.g. "https:/example.com" -> "https://example.com")
		let url = rawUrlPart.replace(/^(https?):\/([^/])/i, '$1://$2');
		try {
			url = decodeURIComponent(url);
		} catch (e) {}

		const encBytes = match && match[2] ? match[2] : '';
		if (!encBytes || url.indexOf('*') === -1) return url;

		let decBytes = '';
		try {
			decBytes = decodeUrlSafeBase64Utf8(encBytes);
		} catch (e) {
			return url;
		}
		let cursor = 0;
		return url.replace(/\*(\*.)?/g, (token) => {
			if (token === '*') {
				return decBytes[cursor++] || '';
			}
			if (token.startsWith('**') && token.length === 3) {
				const idx = V3_RUN_ALPHABET.indexOf(token[2]);
				const len = idx >= 0 ? idx + 2 : 0;
				const slice = decBytes.slice(cursor, cursor + len);
				cursor += len;
				return slice;
			}
			return token;
		});
	}

	const WRAPPER_DECODERS = {
		'proofpoint-v2': (val) => decodeURIComponent(val.replace(/-/g, '%').replace(/_/g, '/')),
		'proofpoint-v3': decodeProofpointV3,
	};

	let config = compileConfig({});
	let lastConfigKey = '';

	function compileRegex(pattern, flags = '') {
		if (!pattern) return null;
		if (pattern instanceof RegExp) return pattern;
		try {
			return new RegExp(pattern, flags);
		} catch (e) {
			console.warn('[Trocker] Invalid heuristic regex:', pattern, e);
			return null;
		}
	}

	function compileAlternation(list, prefix, suffix, flags = 'i') {
		if (!Array.isArray(list) || list.length === 0) return null;
		return new RegExp(prefix + '(?:' + list.join('|') + ')' + suffix, flags);
	}

	function compileUrlWrappers(list) {
		if (!Array.isArray(list)) return [];
		const compiled = [];
		for (const entry of list) {
			if (!entry || !entry.name) continue;
			compiled.push({
				name: entry.name,
				hostRegex: entry.hostRegex || compileRegex(entry.hostPattern, entry.hostFlags || ''),
				pathRegex: entry.pathRegex || compileRegex(entry.pathPattern, entry.pathFlags || ''),
				hrefRegex: entry.hrefRegex || compileRegex(entry.hrefPattern, entry.hrefFlags || ''),
				paramNames: Array.isArray(entry.paramNames) ? entry.paramNames : null,
				decode:
					typeof entry.decode === 'function'
						? entry.decode
						: entry.decoder && WRAPPER_DECODERS[entry.decoder]
							? WRAPPER_DECODERS[entry.decoder]
							: null,
			});
		}
		return compiled;
	}

	function compileConfig(raw) {
		const src = raw && typeof raw === 'object' ? raw : {};
		const espClickPatterns = [];
		if (Array.isArray(src.espClickPatterns)) {
			for (const entry of src.espClickPatterns) {
				if (!entry || !entry.name) continue;
				const regex = entry.regex instanceof RegExp ? entry.regex : compileRegex(entry.pattern, entry.flags || '');
				if (regex) {
					espClickPatterns.push({ reason: 'esp-path:' + entry.name, regex });
				}
			}
		}

		return {
			urlWrappers: compileUrlWrappers(src.urlWrappers),
			espClickPatterns,
			trackingSubdomainRegex: compileAlternation(src.trackingSubdomains, '^', '\\.'),
			clickPathRegex: compileAlternation(src.clickPathSegments, '(?:^|\\/)', '(?:\\/|$)'),
			authPathRegex: compileAlternation(src.authPathSegments, '\\/', '\\b'),
			sharePathRegex: compileAlternation(src.sharePathPatterns, '\\/', '\\b'),
			securityGatewayHostRegex: compileAlternation(src.securityGatewayHostPatterns, '', '', 'i'),
			webmailOwnHosts: new Set((src.webmailOwnHosts || []).map((h) => h.toLowerCase())),
			nonTrackerUrlParams: new Set((src.nonTrackerUrlParams || []).map((p) => p.toLowerCase())),
			nonTrackerEntropyParams: new Set((src.nonTrackerEntropyParams || []).map((p) => p.toLowerCase())),
			excludedHomogenizationHosts: new Set((src.excludedHomogenizationHosts || []).map((h) => h.toLowerCase())),
			thresholds: Object.assign({}, DEFAULT_THRESHOLDS, src.thresholds || {}),
		};
	}

	function setConfig(rawConfig) {
		let key = '';
		try {
			key = JSON.stringify(rawConfig);
		} catch (e) {}
		if (key && key === lastConfigKey) return;
		lastConfigKey = key;
		config = compileConfig(rawConfig);
	}

	// --- URL & Entropy Utilities ---

	function tryUnwrapWithRule(parsed, rule) {
		const host = parsed.hostname.toLowerCase();
		if (rule.hostRegex && !rule.hostRegex.test(host)) return null;
		if (rule.pathRegex && !rule.pathRegex.test(parsed.pathname)) return null;

		let candidate = null;
		let regexMatch = null;
		if (rule.hrefRegex) {
			regexMatch = parsed.href.match(rule.hrefRegex);
			if (regexMatch && regexMatch[1]) candidate = regexMatch[1];
		} else if (Array.isArray(rule.paramNames)) {
			for (const param of rule.paramNames) {
				const val = parsed.searchParams.get(param);
				if (val) {
					candidate = val;
					break;
				}
			}
		}
		if (!candidate) return null;

		if (typeof rule.decode === 'function') {
			try {
				candidate = rule.decode(candidate, regexMatch);
			} catch (e) {
				return null;
			}
		}
		return /^https?:\/\//i.test(candidate) ? candidate : null;
	}

	function unwrapUrl(rawUrl) {
		if (!rawUrl || typeof rawUrl !== 'string') return '';
		let current = rawUrl;
		for (let depth = 0; depth < 3; depth++) {
			let parsed;
			try {
				parsed = new URL(current);
			} catch (e) {
				break;
			}
			let unwrapped = null;
			for (const rule of config.urlWrappers) {
				unwrapped = tryUnwrapWithRule(parsed, rule);
				if (unwrapped) break;
			}
			if (!unwrapped || unwrapped === current) break;
			current = unwrapped;
		}
		return current;
	}

	function getRegistrableDomain(hostname) {
		const parts = hostname.toLowerCase().split('.').filter(Boolean);
		if (parts.length <= 2) return parts.join('.');
		const lastTwo = parts.slice(-2).join('.');
		return MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3 ? parts.slice(-3).join('.') : lastTwo;
	}

	function shannonEntropy(str) {
		if (!str) return 0;
		const counts = Object.create(null);
		for (let i = 0; i < str.length; i++) {
			const ch = str[i];
			counts[ch] = (counts[ch] || 0) + 1;
		}
		let entropy = 0;
		const len = str.length;
		for (const ch in counts) {
			const p = counts[ch] / len;
			entropy -= p * Math.log2(p);
		}
		return entropy;
	}

	function looksLikeOpaqueToken(str, minLen) {
		if (!str || str.length < minLen) return false;
		if (!/^[A-Za-z0-9_~.%+=-]+$/.test(str)) return false;
		if (!/[A-Za-z]/.test(str) || !/\d/.test(str)) return false;

		// Exclude normal hyphenated article slugs like "how-to-do-x-in-2026"
		const hyphenCount = (str.match(/-/g) || []).length;
		const digitCount = (str.match(/\d/g) || []).length;
		const hasMixedCase = /[A-Z]/.test(str) && /[a-z]/.test(str);
		if (hyphenCount >= 3 && !hasMixedCase && digitCount < 5) return false;
		return true;
	}

	function looksLikeHighEntropyBlob(str) {
		const t = config.thresholds;
		if (!looksLikeOpaqueToken(str, Math.min(t.hexBlobMinLen, t.base64BlobMinLen))) return false;
		const ent = shannonEntropy(str);
		if (str.length >= t.hexBlobMinLen && /^[0-9a-f]+$/i.test(str) && ent >= t.hexBlobMinEntropy) return true;
		return str.length >= t.base64BlobMinLen && ent >= t.base64BlobMinEntropy;
	}

	function hasOpaqueToken(urlObj) {
		const t = config.thresholds;
		const segments = urlObj.pathname.split('/').filter(Boolean);
		if (segments.some((seg) => looksLikeOpaqueToken(seg, t.pathTokenMinLen))) return true;

		for (const [rawKey, val] of urlObj.searchParams.entries()) {
			if (config.nonTrackerEntropyParams.has(rawKey.toLowerCase())) continue;
			if (looksLikeOpaqueToken(val, t.queryTokenMinLen)) return true;
		}
		return false;
	}

	function analyzeEntropyParams(urlObj) {
		let maxBlobLen = 0;
		let maxBlobEntropy = 0;
		let opaqueParamCount = 0;
		let shortKeyHighEntropy = false;
		let hasEmailUtm = false;

		for (const [rawKey, val] of urlObj.searchParams.entries()) {
			const key = rawKey.toLowerCase();
			if (key === 'utm_medium' && /email|newsletter/i.test(val)) {
				hasEmailUtm = true;
				continue;
			}
			if (key.startsWith('utm_') || config.nonTrackerEntropyParams.has(key)) continue;

			if (looksLikeHighEntropyBlob(val)) {
				opaqueParamCount++;
				const ent = shannonEntropy(val);
				if (val.length > maxBlobLen) {
					maxBlobLen = val.length;
					maxBlobEntropy = ent;
				}
				if (/^_?[a-z0-9]{1,3}$/i.test(key)) {
					shortKeyHighEntropy = true;
				}
			}
		}

		return { maxBlobLen, maxBlobEntropy, opaqueParamCount, shortKeyHighEntropy, hasEmailUtm };
	}

	// --- Per-Link Heuristic Rules ---
	// Each rule takes a parsed link context and returns a reason string or null.

	function matchEspPath(ctx) {
		for (const pattern of config.espClickPatterns) {
			if (pattern.regex.test(ctx.pathAndQuery)) return pattern.reason;
		}
		return null;
	}

	function matchPathEmbeddedUrl(ctx) {
		return PATH_EMBEDDED_URL_REGEX.test(ctx.pathname) ? 'path-embedded-url' : null;
	}

	function matchOpenTrackerHost(ctx) {
		if (!ctx.openTrackerHosts || !ctx.openTrackerHosts.has(ctx.host)) return null;
		return ctx.pathname !== '/' || ctx.urlObj.search !== '' ? 'open-tracker-host' : null;
	}

	function matchVisibleUrlMismatch(ctx) {
		const visibleText = (ctx.link.textContent || '').trim();
		if (!/^(?:https?:\/\/|www\.)[^\s]+$/i.test(visibleText)) return null;
		try {
			const textUrl = new URL(/^https?:\/\//i.test(visibleText) ? visibleText : 'https://' + visibleText);
			const textDomain = getRegistrableDomain(textUrl.hostname);
			const hrefDomain = getRegistrableDomain(ctx.host);
			if (textDomain && hrefDomain && textDomain !== hrefDomain) {
				return 'text-url-mismatch';
			}
		} catch (e) {}
		return null;
	}

	function matchEmbeddedUrlParam(ctx) {
		if (ctx.isAuthPath || (config.sharePathRegex && config.sharePathRegex.test(ctx.pathname))) return null;
		for (const [rawKey, val] of ctx.urlObj.searchParams.entries()) {
			const key = rawKey.toLowerCase();
			if (config.nonTrackerUrlParams.has(key)) continue;
			if (/^https?:\/\//i.test(val) || /^aHR0c(?:Dov|HM6)/.test(val)) {
				return 'embedded-url-param:' + key;
			}
		}
		return null;
	}

	function matchTrackingSubdomainToken(ctx) {
		return config.trackingSubdomainRegex &&
			config.trackingSubdomainRegex.test(ctx.host) &&
			hasOpaqueToken(ctx.urlObj)
			? 'subdomain-token'
			: null;
	}

	function matchClickPathEntropy(ctx) {
		if (ctx.isAuthPath || !config.clickPathRegex || !config.clickPathRegex.test(ctx.pathname)) return null;
		const hasPathBlob = ctx.pathname
			.split('/')
			.filter(Boolean)
			.some((seg) => looksLikeHighEntropyBlob(seg));
		return ctx.getEntropyInfo().opaqueParamCount > 0 || hasPathBlob ? 'click-path+entropy' : null;
	}

	function matchHighEntropyParams(ctx) {
		if (ctx.isAuthPath) return null;
		const t = config.thresholds;
		const info = ctx.getEntropyInfo();
		if (info.maxBlobLen < t.highEntropyParamMinLen || info.maxBlobEntropy < t.highEntropyParamMinEntropy) {
			return null;
		}
		if (info.shortKeyHighEntropy || info.opaqueParamCount >= 2 || info.hasEmailUtm) {
			return 'high-entropy-params';
		}
		return null;
	}

	const LINK_RULES = [
		matchEspPath,
		matchPathEmbeddedUrl,
		matchOpenTrackerHost,
		matchVisibleUrlMismatch,
		matchEmbeddedUrlParam,
		matchTrackingSubdomainToken,
		matchClickPathEntropy,
		matchHighEntropyParams,
	];

	function isKnownWrapperEndpoint(urlObj, host) {
		if (config.securityGatewayHostRegex && config.securityGatewayHostRegex.test(host)) return true;
		for (const rule of config.urlWrappers) {
			if (rule.hostRegex && !rule.hostRegex.test(host)) continue;
			if (rule.pathRegex && !rule.pathRegex.test(urlObj.pathname)) continue;
			// Only treat as a fallback wrapper endpoint when both host and path (or a dedicated gateway host) match
			if (rule.pathRegex) return true;
		}
		return false;
	}

	function buildLinkContext(link, openTrackerHosts) {
		const rawHref = link && link.href ? link.href : '';
		if (!rawHref || !/^https?:\/\//i.test(rawHref)) return null;

		const urlStr = unwrapUrl(rawHref);
		let urlObj;
		try {
			urlObj = new URL(urlStr);
		} catch (e) {
			return null;
		}
		const host = urlObj.hostname.toLowerCase();
		if (!host || config.webmailOwnHosts.has(host)) return null;
		if (isKnownWrapperEndpoint(urlObj, host)) return null;

		let cachedEntropyInfo = null;
		return {
			link,
			urlStr,
			urlObj,
			host,
			pathname: urlObj.pathname,
			pathAndQuery: urlObj.pathname + urlObj.search,
			isAuthPath: config.authPathRegex ? config.authPathRegex.test(urlObj.pathname) : false,
			openTrackerHosts,
			getEntropyInfo() {
				if (!cachedEntropyInfo) cachedEntropyInfo = analyzeEntropyParams(urlObj);
				return cachedEntropyInfo;
			},
		};
	}

	function evaluateLink(link, openTrackerHosts) {
		const ctx = buildLinkContext(link, openTrackerHosts);
		if (!ctx) return null;

		for (const rule of LINK_RULES) {
			const reason = rule(ctx);
			if (reason) return { url: ctx.urlStr, reason };
		}
		return null;
	}

	// --- Email-Level Analysis (Per-Link + Cross-Link Host Homogenization) ---

	function analyzeEmailLinks(links, { isKnownClickTracker, openTrackerHosts } = {}) {
		const findings = [];
		const matchedLinks = [];
		const flaggedUrls = new Set();
		const hostGroups = new Map();

		function recordMatch(link, url, reason) {
			matchedLinks.push({ link, reason });
			if (!flaggedUrls.has(url)) {
				flaggedUrls.add(url);
				findings.push({ url, type: 'click', reason });
			}
		}

		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			const rawHref = link && link.href ? link.href : '';
			if (!rawHref || !/^https?:\/\//i.test(rawHref)) continue;

			const unwrapped = unwrapUrl(rawHref);
			if (isKnownClickTracker && (isKnownClickTracker(rawHref) || isKnownClickTracker(unwrapped))) {
				continue;
			}

			const hit = evaluateLink(link, openTrackerHosts);
			if (hit) {
				recordMatch(link, hit.url, hit.reason);
				continue;
			}

			const ctx = buildLinkContext(link, openTrackerHosts);
			if (!ctx || config.excludedHomogenizationHosts.has(ctx.host)) continue;

			if (!hostGroups.has(ctx.host)) {
				hostGroups.set(ctx.host, { items: [], texts: new Set(), opaqueCount: 0 });
			}
			const group = hostGroups.get(ctx.host);
			group.items.push({ link, url: ctx.urlStr });
			const txt = (link.textContent || '').trim().toLowerCase();
			if (txt) group.texts.add(txt);
			if (hasOpaqueToken(ctx.urlObj)) group.opaqueCount++;
		}

		const t = config.thresholds;
		for (const group of hostGroups.values()) {
			const isHomogenized =
				group.items.length >= t.homogenizationMinLinks &&
				group.texts.size >= t.homogenizationMinDistinctTexts &&
				group.opaqueCount >= t.homogenizationMinDistinctTexts &&
				group.opaqueCount / group.items.length >= t.homogenizationMinOpaqueRatio;
			if (!isHomogenized) continue;

			for (const item of group.items) {
				recordMatch(item.link, item.url, 'repeated-opaque-host');
			}
		}

		return { findings, links: matchedLinks };
	}

	const api = {
		setConfig,
		unwrapUrl,
		shannonEntropy,
		evaluateLink,
		analyzeEmailLinks,
	};

	root.TrockerClickHeuristics = api;
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	}
})(typeof globalThis !== 'undefined' ? globalThis : this);
