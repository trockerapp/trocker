// Privacy-preserving URL token redactor for sharing suspicious tracker logs.
// Preserves hostname, path structure, query param names, and embedded destination hosts,
// while replacing recipient-identifying hashes/tokens/emails with <type:len> placeholders.

const UUID_LIKE_REGEX = /^[0-9a-f]{8,}(?:-[0-9a-f]{4,}){2,}$/i;
const HEX_REGEX = /^[0-9a-f]+$/i;

function isHyphenatedSlug(str) {
	const hyphens = (str.match(/-/g) || []).length;
	const digits = (str.match(/\d/g) || []).length;
	const mixedCase = /[A-Z]/.test(str) && /[a-z]/.test(str);
	return hyphens >= 3 && !mixedCase && digits < 5;
}

function redactToken(val, minOpaqueLen) {
	if (!val) return val;
	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return '<email>';
	if (/^urn:/i.test(val)) return `<urn:${val.length}>`;
	if (/^\d{2,}-\d{4,}-\d{4,}$/.test(val)) return `<id:${val.length}>`;
	if (UUID_LIKE_REGEX.test(val)) return `<uuid:${val.length}>`;
	if (val.length >= 8 && HEX_REGEX.test(val) && /[a-f]/i.test(val) && /\d/.test(val)) return `<hex:${val.length}>`;
	if (val.length >= 12 && HEX_REGEX.test(val)) return `<hex:${val.length}>`;
	if (/^aHR0c(?:Dov|HM6)[A-Za-z0-9_+=-]*$/.test(val)) return `<b64-url:${val.length}>`;
	if (val.length >= 10 && /^[A-Z0-9]+$/.test(val) && /[A-Z]/.test(val) && /\d/.test(val)) return `<id:${val.length}>`;
	if (
		val.length >= minOpaqueLen &&
		/^[A-Za-z0-9_~.%+=-]+$/.test(val) &&
		/[A-Za-z]/.test(val) &&
		/\d/.test(val) &&
		!isHyphenatedSlug(val)
	) {
		return `<b64:${val.length}>`;
	}
	if (
		val.length >= minOpaqueLen &&
		val.includes(':') &&
		/^[A-Za-z0-9_~.%+=:-]+$/.test(val) &&
		/[A-Za-z]/.test(val) &&
		/\d/.test(val)
	) {
		return `<token:${val.length}>`;
	}
	return val;
}

function redactPathSegments(str, minOpaqueLen, depth) {
	return str
		.split('/')
		.map((seg) => {
			if (!seg) return '';
			let decoded = seg;
			try {
				decoded = decodeURIComponent(seg);
			} catch (e) {}
			if (/^https?:\/\//i.test(decoded)) {
				return encodeURIComponent(redactUrlTokens(decoded, depth + 1));
			}
			return redactToken(seg, minOpaqueLen);
		})
		.join('/');
}

export function redactUrlTokens(rawUrl, depth = 0) {
	if (!rawUrl || typeof rawUrl !== 'string' || depth > 2) return rawUrl;
	let urlObj;
	try {
		urlObj = new URL(rawUrl);
	} catch (e) {
		return rawUrl;
	}

	const redactedPath = redactPathSegments(urlObj.pathname, 16, depth);

	const params = [];
	for (const [key, val] of urlObj.searchParams.entries()) {
		const outKey = key.includes('/') ? redactPathSegments(key, 12, depth) : redactToken(key, 20);
		let outVal;
		if (/^https?:\/\//i.test(val)) {
			outVal = redactUrlTokens(val, depth + 1);
		} else if (key.toLowerCase().startsWith('utm_')) {
			outVal = redactToken(val, 32);
		} else {
			outVal = redactToken(val, 20);
		}
		params.push(`${outKey}=${outVal}`);
	}

	const queryStr = params.length > 0 ? '?' + params.join('&') : '';
	return `${urlObj.protocol}//${urlObj.host}${redactedPath}${queryStr}`;
}
