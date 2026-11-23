import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
	DEFAULT_OPEN_TRACKERS,
	DEFAULT_CLICK_TRACKERS,
	WEBMAILS,
	CLICK_HEURISTICS_CONFIG,
} from '../tracker-data.js';
import { UNWRAP_CASES, LINK_EVAL_CASES, EMAIL_BATCH_CASES } from './click-heuristics-cases.js';
import { redactUrlTokens } from '../url-redact.js';

const require = createRequire(import.meta.url);
const H = require('../click-heuristics.js');

describe('tracker-data.js integrity', () => {
	it('exports non-empty open trackers, click trackers, webmails, and heuristics config', () => {
		assert.ok(DEFAULT_OPEN_TRACKERS.length > 0);
		assert.ok(DEFAULT_CLICK_TRACKERS.length > 0);
		assert.ok(WEBMAILS.length > 0);
		assert.ok(CLICK_HEURISTICS_CONFIG.espClickPatterns.length > 0);
		assert.ok(CLICK_HEURISTICS_CONFIG.urlWrappers.length > 0);
	});

	it('compiles every regex in CLICK_HEURISTICS_CONFIG and DEFAULT_CLICK_TRACKERS without error', () => {
		for (const item of DEFAULT_CLICK_TRACKERS) {
			if (item.regex) assert.doesNotThrow(() => new RegExp(item.regex));
		}
		for (const p of CLICK_HEURISTICS_CONFIG.espClickPatterns) {
			assert.doesNotThrow(() => new RegExp(p.pattern, p.flags || ''));
		}
		for (const w of CLICK_HEURISTICS_CONFIG.urlWrappers) {
			if (w.hostPattern) assert.doesNotThrow(() => new RegExp(w.hostPattern, w.hostFlags || ''));
			if (w.pathPattern) assert.doesNotThrow(() => new RegExp(w.pathPattern, w.pathFlags || ''));
			if (w.hrefPattern) assert.doesNotThrow(() => new RegExp(w.hrefPattern, w.hrefFlags || ''));
		}
	});
});

describe('click-heuristics.js', () => {
	before(() => {
		// Simulate Chrome sendMessage JSON serialization round-trip
		const cloned = JSON.parse(JSON.stringify(CLICK_HEURISTICS_CONFIG));
		H.setConfig(cloned);
	});

	describe('unwrapUrl()', () => {
		for (const tc of UNWRAP_CASES) {
			it(tc.label, () => {
				assert.equal(H.unwrapUrl(tc.input), tc.expected);
			});
		}
	});

	describe('evaluateLink()', () => {
		for (const tc of LINK_EVAL_CASES) {
			it(tc.label, () => {
				const hosts = new Set(tc.openTrackerHosts || []);
				const res = H.evaluateLink({ href: tc.href, textContent: tc.text }, hosts);
				const got = res ? res.reason : null;
				assert.equal(got, tc.expectedReason);
			});
		}
	});

	describe('analyzeEmailLinks()', () => {
		for (const tc of EMAIL_BATCH_CASES) {
			it(tc.label, () => {
				const res = H.analyzeEmailLinks(tc.links);
				assert.equal(res.findings.length, tc.expectedFindingsCount);
				assert.equal(res.links.length, tc.expectedLinksCount);
				if (tc.expectedReason) {
					assert.ok(res.findings.every((f) => f.reason === tc.expectedReason));
				}
			});
		}
	});
});

describe('url-redact.js', () => {
	it('redacts hex, base64, UUID, and email tokens while preserving URL structure and UTMs', () => {
		const url =
			'https://links.example.com/u/click?_t=0123456789abcdef0123456789abcdef&_e=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789==&user=alice@example.com&utm_medium=email';
		assert.equal(
			redactUrlTokens(url),
			'https://links.example.com/u/click?_t=<hex:32>&_e=<b64:38>&user=<email>&utm_medium=email'
		);
	});

	it('preserves embedded destination hosts while redacting SES UUID/signature segments', () => {
		const url =
			'https://comm.example.com/CL0/https:%2F%2Fstatus.example.com%2F/1/0000000000000000-11111111-2222-3333-4444-555555555555-000000/AbCdEfGhIjKlMnOpQrStUvWxYz012345=100';
		assert.equal(
			redactUrlTokens(url),
			'https://comm.example.com/CL0/https%3A%2F%2Fstatus.example.com%2F/1/<uuid:60>/<b64:36>'
		);
	});

	it('preserves normal hyphenated blog slugs', () => {
		const url = 'https://blog.example.com/2026/how-to-improve-your-email-deliverability-in-2026';
		assert.equal(redactUrlTokens(url), url);
	});

	it('redacts short hex, URNs, order IDs, and uppercase alphanumeric IDs', () => {
		const url =
			'https://www.example.com/gp/r.html?C=1ABCD2EFGH34I&M=urn:rtn:msg:000000000000000000000000&e=12ab34cd56&orderId=111-2222222-3333333';
		assert.equal(
			redactUrlTokens(url),
			'https://www.example.com/gp/r.html?C=<id:13>&M=<urn:36>&e=<hex:10>&orderId=<id:19>'
		);
	});

	it('redacts slash-delimited opaque query keys and colon-delimited compound tokens', () => {
		const slashKeyUrl =
			'https://e.email.example.com/click?EYWxpY2UxQGV4YW1wbGUuY29t/CeyJtaWQiOiIxMjM0NTY3ODkwIn0/s0000000000=';
		const redactedSlash = redactUrlTokens(slashKeyUrl);
		assert.ok(!redactedSlash.includes('EYWxpY2Ux'), `Expected base64 email segment redacted, got ${redactedSlash}`);
		assert.ok(!redactedSlash.includes('CeyJtaWQi'), `Expected base64 JSON segment redacted, got ${redactedSlash}`);
		assert.equal(redactedSlash, 'https://e.email.example.com/click?<b64:25>/<b64:28>/s0000000000=');

		const colonTokenUrl =
			'https://scholar.example.com/scholar_url?url=https%3A%2F%2Fexample.org%2Fpaper&hist=ABCDef123456:00001111222233334444:DummySigToken0123456789abcde';
		assert.equal(
			redactUrlTokens(colonTokenUrl),
			'https://scholar.example.com/scholar_url?url=https://example.org/paper&hist=<token:62>'
		);
	});
});
