// Synthetic test cases for heuristic click-tracker detection and URL wrapper unwrapping.
// Shared by Node tests (click-heuristics.test.mjs) and the browser test page (test1.js).

const DUMMY_B64 =
	'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-aBcDeFgHiJkLmNoPqRsTuVwXyZ9876543210_-MnOpQrStUvWxYz0123456789==';
const DUMMY_HEX = '0123456789abcdef0123456789abcdef';

export const UNWRAP_CASES = [
	{
		label: 'Outlook SafeLinks',
		input: 'https://nam01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com%2Ffoo&data=1',
		expected: 'https://example.com/foo',
	},
	{
		label: 'Google /url?q=',
		input: 'https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fbar&sa=D',
		expected: 'https://example.com/bar',
	},
	{
		label: 'Proofpoint URL Defense v3',
		input: 'https://urldefense.com/v3/__https://example.edu/about__;!!DummyOrg!DummySig$',
		expected: 'https://example.edu/about',
	},
	{
		label: 'Proofpoint URL Defense v3 (single-slash protocol)',
		input: 'https://urldefense.com/v3/__https:/example.edu/about__;!!DummyOrg!DummySig$',
		expected: 'https://example.edu/about',
	},
	{
		label: 'Proofpoint URL Defense v3 (* and **B token substitution)',
		// "IWZvbw" = base64url("!foo"): "*" -> "!", "**B" (len 3) -> "foo"
		input: 'https://urldefense.com/v3/__https://example.edu/a*b/**B__;IWZvbw!DummyOrg!DummySig$',
		expected: 'https://example.edu/a!b/foo',
	},
	{
		label: 'Proofpoint URL Defense v2',
		input: 'https://urldefense.proofpoint.com/v2/url?u=https-3A__example.org_p-3Fa-3D1&d=x',
		expected: 'https://example.org/p?a=1',
	},
	{
		label: 'Proofpoint URL Defense v1',
		input: 'https://urldefense.proofpoint.com/v1/url?u=https%3A%2F%2Fexample.org%2Fp&k=1',
		expected: 'https://example.org/p',
	},
	{
		label: 'Nested Google -> Proofpoint v3',
		input:
			'https://www.google.com/url?q=' +
			encodeURIComponent('https://urldefense.com/v3/__https://example.edu/nested__;!!DummyOrg!DummySig$'),
		expected: 'https://example.edu/nested',
	},
];

export const LINK_EVAL_CASES = [
	// Positive detections
	{
		label: 'SendGrid custom CNAME',
		href: 'https://url999.example.com/ls/click?upn=' + DUMMY_B64,
		text: 'Read more',
		expectedReason: 'esp-path:sendgrid',
	},
	{
		label: 'Iterable custom CNAME',
		href: 'https://links.example.com/u/click?_t=' + DUMMY_HEX + '&_e=' + encodeURIComponent(DUMMY_B64),
		text: 'Open',
		expectedReason: 'esp-path:iterable',
	},
	{
		label: 'HubSpot custom CNAME',
		href: 'https://email.example.io/e3t/Ctc/dummyToken123',
		text: 'View',
		expectedReason: 'esp-path:hubspot',
	},
	{
		label: 'Amazon SES (/CL0/https:%2F%2F)',
		href: 'https://comm.example.com/CL0/https:%2F%2Fstatus.example.com%2F/1/00000000-0000-0000-0000-000000000000/dummySig123456=100',
		text: 'Status',
		expectedReason: 'esp-path:ses',
	},
	{
		label: 'Postmark (/L0/https:)',
		href: 'https://click.example.com/L0/https:%2F%2Fshop.example.com%2Fitem',
		text: 'Shop',
		expectedReason: 'esp-path:postmark',
	},
	{
		label: 'Customer.io (/e/c/)',
		href: 'https://e.example.com/e/c/eyJlbWFpbF9pZCI6IjAwMDAwMCJ9',
		text: 'Open',
		expectedReason: 'esp-path:customerio',
	},
	{
		label: 'Substack (/redirect/2/)',
		href: 'https://news.example.com/redirect/2/eyJlIjoxMjM0NTY3ODkwMTIzNDU2Nzg5MH0',
		text: 'Read',
		expectedReason: 'esp-path:substack',
	},
	{
		label: 'Substack (/redirect/<uuid>?j=)',
		href: 'https://news.example.com/redirect/11111111-2222-3333-4444-555555555555?j=dummyToken',
		text: 'Read',
		expectedReason: 'esp-path:substack',
	},
	{
		label: 'SparkPost (/f/a/<b64-with-tilde>/)',
		href: 'https://connect.example.com/f/a/AbCdEfGhIjKlMnOpQrSt12~~/AAIJ8RA~/' + DUMMY_B64,
		text: 'View',
		expectedReason: 'esp-path:sparkpost',
	},
	{
		label: 'Brevo (/mk/cl/)',
		href: 'https://abc.r.a.d.example-send.com/mk/cl/f/sh/' + DUMMY_HEX + '/dummySlug123',
		text: 'Open',
		expectedReason: 'esp-path:brevo',
	},
	{
		label: 'Mailgun (/c/<b64>)',
		href: 'https://mg.mail.example.com/c/' + DUMMY_B64,
		text: 'Open',
		expectedReason: 'esp-path:mailgun',
	},
	{
		label: 'Beehiiv (/ss/c/)',
		href: 'https://link.mail.example.com/ss/c/u001.' + DUMMY_B64 + '/4vt/dummy/h01',
		text: 'Article',
		expectedReason: 'esp-path:beehiiv',
	},
	{
		label: 'Beehiiv (/<hex>/hclick)',
		href: 'https://email.example.com/' + DUMMY_HEX + 'abcd1234/hclick',
		text: 'Status',
		expectedReason: 'esp-path:beehiiv',
	},
	{
		label: 'Mailchimp short link (?c2id=<hex32>)',
		href: 'https://us.example-manage.com/AbCdEfGh123?e=12ab34cd56&c2id=' + DUMMY_HEX,
		text: 'Read',
		expectedReason: 'esp-path:mailchimp-short',
	},
	{
		label: 'Generic path-embedded URL',
		href: 'https://custom.example.com/r/https%3A%2F%2Fdest.example.org%2Fpage',
		text: 'Go',
		expectedReason: 'path-embedded-url',
	},
	{
		label: 'Open-tracker host correlation',
		href: 'https://tracker.example.com/e/123',
		text: 'Check',
		openTrackerHosts: ['tracker.example.com'],
		expectedReason: 'open-tracker-host',
	},
	{
		label: 'Visible URL vs href mismatch',
		href: 'https://trk.other.example/abc',
		text: 'https://example.org/article',
		expectedReason: 'text-url-mismatch',
	},
	{
		label: 'Embedded URL in arbitrary query param',
		href: 'https://go.example.com/x?target_link=https%3A%2F%2Fexample.org%2Fpage',
		text: 'Visit',
		expectedReason: 'embedded-url-param:target_link',
	},
	{
		label: 'Embedded Base64 URL in query param',
		href: 'https://go.example.com/x?d=aHR0cHM6Ly9leGFtcGxlLm9yZy9wYWdl',
		text: 'Visit',
		expectedReason: 'embedded-url-param:d',
	},
	{
		label: 'Tracking subdomain + opaque token',
		href: 'https://click.example.com/c/A1b2C3d4E5f6G7h8I9j0K1l2M3',
		text: 'Shop',
		expectedReason: 'subdomain-token',
	},
	{
		label: 'Click path + high-entropy param on bare domain',
		href: 'https://example.com/click?payload=' + encodeURIComponent(DUMMY_B64),
		text: 'Claim',
		expectedReason: 'click-path+entropy',
	},
	{
		label: 'High-entropy terse param on bare domain',
		href: 'https://example.com/offer?_e=' + encodeURIComponent(DUMMY_B64),
		text: 'Offer',
		expectedReason: 'high-entropy-params',
	},
	{
		label: 'Proofpoint v3 wrapping tracker -> flags inner tracker',
		href: 'https://urldefense.com/v3/__https://links.example.com/u/click?_t=' + DUMMY_HEX + '__;!!DummyOrg!DummySig$',
		text: 'Link',
		expectedReason: 'esp-path:iterable',
	},

	// Negative cases (must NOT be flagged)
	{
		label: 'Normal hyphenated blog slug',
		href: 'https://blog.example.com/2026/how-to-improve-your-email-deliverability-in-2026',
		text: 'Read post',
		expectedReason: null,
	},
	{
		label: 'Proofpoint v3 wrapping benign URL',
		href: 'https://urldefense.com/v3/__https://example.edu/about__;!!DummyOrg!DummySig$',
		text: 'About',
		expectedReason: null,
	},
	{
		label: 'Future Proofpoint v4 (unrecognized gateway version fails gracefully)',
		href: 'https://urldefense.com/v4/opaque?payload=' + encodeURIComponent(DUMMY_B64),
		text: 'External link',
		expectedReason: null,
	},
	{
		label: 'Future Google /url with unknown param (fails gracefully)',
		href: 'https://www.google.com/url?new_dest=https%3A%2F%2Fexample.com%2Fpage&usg=' + DUMMY_HEX,
		text: 'External link',
		expectedReason: null,
	},
	{
		label: 'Future Outlook SafeLinks without url param (fails gracefully)',
		href: 'https://nam01.safelinks.protection.outlook.us/?token=' + encodeURIComponent(DUMMY_B64),
		text: 'External link',
		expectedReason: null,
	},
	{
		label: 'Opaque Mimecast security gateway link (skipped)',
		href: 'https://url.us.m.mimecastprotect.com/s/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789',
		text: 'Document',
		expectedReason: null,
	},
	{
		label: 'Twitter share button',
		href: 'https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com',
		text: 'Tweet',
		expectedReason: null,
	},
	{
		label: 'Google Alerts share button',
		href: 'https://www.google.com/alerts/share?hl=en&gl=US&ru=https%3A%2F%2Fexample.com%2Farticle&ss=fb',
		text: 'Share on Facebook',
		expectedReason: null,
	},
	{
		label: 'Google Alerts feedback button',
		href: 'https://www.google.com/alerts/feedback?ffu=https%3A%2F%2Fexample.com%2Farticle&source=alertsmail',
		text: 'Flag as irrelevant',
		expectedReason: null,
	},
	{
		label: 'OAuth callback with redirect_uri',
		href: 'https://app.example.com/oauth/callback?code=' + encodeURIComponent(DUMMY_B64) + '&redirect_uri=https%3A%2F%2Fapp.example.com',
		text: 'Continue',
		expectedReason: null,
	},
	{
		label: 'Password reset link',
		href: 'https://app.example.com/reset?_t=' + encodeURIComponent(DUMMY_B64),
		text: 'Reset password',
		expectedReason: null,
	},
	{
		label: 'AWS S3 presigned URL',
		href: 'https://mybucket.s3.amazonaws.com/report.pdf?X-Amz-Signature=' + DUMMY_HEX + DUMMY_HEX,
		text: 'Download PDF',
		expectedReason: null,
	},
	{
		label: 'Matching visible URL and href',
		href: 'https://github.com/trockerapp/trocker/issues/42',
		text: 'https://github.com/trockerapp/trocker/issues/42',
		expectedReason: null,
	},
	{
		label: 'Webmail own UI link',
		href: 'https://mail.google.com/mail/u/0/#inbox',
		text: 'Inbox',
		expectedReason: null,
	},
	{
		label: 'mailto link',
		href: 'mailto:test@example.com',
		text: 'Email us',
		expectedReason: null,
	},
];

export const EMAIL_BATCH_CASES = [
	{
		label: 'Cross-link host homogenization flags custom opaque host',
		links: [
			{ href: 'https://custom.example.org/z/A1b2C3d4E5f6G7h8I9j0K1l2M3', textContent: 'Home' },
			{ href: 'https://custom.example.org/z/Z9y8X7w6V5u4T3s2R1q0P9o8N7', textContent: 'About' },
			{ href: 'https://custom.example.org/z/M1n2B3v4C5x6Z7a8S9d0F1g2H3', textContent: 'Privacy' },
			{ href: 'https://custom.example.org/z/Q1w2E3r4T5y6U7i8O9p0A1s2D3', textContent: 'Unsubscribe' },
		],
		expectedFindingsCount: 4,
		expectedLinksCount: 4,
		expectedReason: 'repeated-opaque-host',
	},
	{
		label: 'Excluded homogenization host (github.com commit SHAs) is ignored',
		links: [
			{ href: 'https://github.com/org/repo/commit/0123456789abcdef0123456789abcdef01234567', textContent: 'Commit 1' },
			{ href: 'https://github.com/org/repo/commit/1123456789abcdef0123456789abcdef01234567', textContent: 'Commit 2' },
			{ href: 'https://github.com/org/repo/commit/2123456789abcdef0123456789abcdef01234567', textContent: 'Commit 3' },
			{ href: 'https://github.com/org/repo/commit/3123456789abcdef0123456789abcdef01234567', textContent: 'Commit 4' },
		],
		expectedFindingsCount: 0,
		expectedLinksCount: 0,
		expectedReason: null,
	},
	{
		label: 'Duplicate tracker URLs deduped in findings but both links highlighted',
		links: [
			{
				href: 'https://comm.example.com/CL0/https:%2F%2Fstatus.example.com%2F/1/00000000-0000-0000-0000-000000000000/dummySig=1',
				textContent: 'Link 1',
			},
			{
				href: 'https://comm.example.com/CL0/https:%2F%2Fstatus.example.com%2F/1/00000000-0000-0000-0000-000000000000/dummySig=1',
				textContent: 'Link 2',
			},
		],
		expectedFindingsCount: 1,
		expectedLinksCount: 2,
		expectedReason: 'esp-path:ses',
	},
];
