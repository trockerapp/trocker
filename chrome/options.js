import { loadVariable, saveVariable, updateBrowserActionButton, updateDeclarativeNetRequestRules } from './tools.js';
import { getOpenTrackerList, getClickTrackerList } from './lists.js';
import { redactUrlTokens } from './url-redact.js';

let updatingSettings = false;

chrome.storage.onChanged.addListener((changes, namespace) => {
	if (!updatingSettings) {
		restoreOptions();
	}
});

// Saves options to localStorage.
async function saveOptions() {
	updatingSettings = true;
	await saveVariable('trockerEnable', document.getElementById('trockerEnableOpt').checked);
	await saveVariable('showTrackerCount', document.getElementById('showTrackerCountOpt').checked);
	await saveVariable('exposeLinks', document.getElementById('exposeLinksOpt').checked);
	let timeoutVal = parseInt(document.getElementById('bypassTimeoutOpt').value);
	if (timeoutVal < 1) {
		timeoutVal = 1;
	}
	await saveVariable('linkBypassTimeout', timeoutVal);
	await saveVariable(
		'verbose',
		document.getElementById('verboseOpt').checked && document.getElementById('advancedOpt').checked
	);
	await saveVariable(
		'debug',
		document.getElementById('debugOpt').checked && document.getElementById('advancedOpt').checked
	);

	updatePermissionWarnings();
	await updateBrowserActionButton();
	await updateDeclarativeNetRequestRules();

	let oldOpt1 = await loadVariable('useCustomLists');
	await saveVariable('useCustomLists', document.getElementById('useCustomListsOpt').checked);
	if (!oldOpt1 && oldOpt1 != (await loadVariable('useCustomLists'))) {
		if ((await loadVariable('customOpenTrackers')) === '') {
			saveCustomLists({
				target: {
					id: 'customOpenTrackersSave',
					value: JSON.stringify(await getOpenTrackerList(true), null, 2),
				},
			});
		}
		if ((await loadVariable('customClickTrackers')) === '') {
			saveCustomLists({
				target: {
					id: 'customClickTrackersSave',
					value: JSON.stringify(await getClickTrackerList(true), null, 2),
				},
			});
		}
	}

	let oldOpt = await loadVariable('advanced');
	await saveVariable('advanced', document.getElementById('advancedOpt').checked);

	if (oldOpt1 != (await loadVariable('useCustomLists'))) location.reload();
	if (oldOpt != (await loadVariable('advanced'))) location.reload();

	// Update status to let user know options were saved.
	updateStatus('Options were saved!');
	updatingSettings = false;
}

async function restoreDefaultLists(event) {
	event.stopPropagation();
	event.preventDefault();
	if (event.target.id == 'customOpenTrackersRestore' || event.target.id == 'customClickTrackersRestore') {
		let optName = event.target.id.replace('Restore', '');
		let list;
		if (optName == 'customOpenTrackers') {
			list = await getOpenTrackerList(true);
		} else if (optName == 'customClickTrackers') {
			list = await getClickTrackerList(true);
		}
		document.getElementById(optName + 'Text').value = JSON.stringify(list, null, 2);
		updateStatus('Default list was restored. Now it can be saved.', 'successMsg', 5000, optName + 'Status');
	}
	return false;
}

async function saveCustomLists(event) {
	event.stopPropagation();
	event.preventDefault();
	if (event.target.id == 'customOpenTrackersSave' || event.target.id == 'customClickTrackersSave') {
		let optName = event.target.id.replace('Save', '');
		try {
			let valueElem = document.getElementById(optName + 'Text');
			let jsonText = valueElem.value;
			// Sanitize json
			jsonText = JSON.stringify(JSON.parse(jsonText), null, 2);
			await saveVariable(optName, jsonText);
			valueElem.value = await loadVariable(optName);
			updateStatus('New list has been saved.', 'successMsg', 5000, optName + 'Status');
		} catch (error) {
			updateStatus(
				'New list could not be saved because JSON format had errors.',
				'warningMsg',
				5000,
				optName + 'Status'
			);
		}
	}
	return false;
}

function updateStatus(innerText, className = '', timeOutMs = 1000, statusElemId = 'status') {
	let status = document.getElementById(statusElemId);
	status.innerText = innerText;
	status.className = className;
	status.style.opacity = 100;
	setTimeout(() => {
		status.style.opacity = 0;
	}, timeOutMs);
}

// Restores select box state to saved value from cache.
async function restoreOptions() {
	updatingSettings = true;
	document.getElementById('trockerEnableOpt').checked = await loadVariable('trockerEnable');

	// Check if we need to force disable due to missing permissions
	chrome.permissions.contains(
		{
			permissions: [],
			origins: ['<all_urls>'],
		},
		async (result) => {
			if (!result && document.getElementById('trockerEnableOpt').checked) {
				document.getElementById('trockerEnableOpt').checked = false;
				await saveOptions();
				updateStatus('Trocker disabled due to missing permissions.', 'warningMsg');
			}
		}
	);

	document.getElementById('trockerEnableOpt').onchange = handleEnableToggle;

	document.getElementById('showTrackerCountOpt').checked = await loadVariable('showTrackerCount');
	document.getElementById('showTrackerCountOpt').onchange = saveOptions;

	document.getElementById('exposeLinksOpt').checked = await loadVariable('exposeLinks');
	document.getElementById('exposeLinksOpt').onchange = saveOptions;

	document.getElementById('bypassTimeoutOpt').value = await loadVariable('linkBypassTimeout');
	document.getElementById('bypassTimeoutOpt').onchange = saveOptions;

	document.getElementById('useCustomListsOpt').checked = await loadVariable('useCustomLists');
	document.getElementById('useCustomListsOpt').onchange = saveOptions;

	document.getElementById('customOpenTrackersText').value = await loadVariable('customOpenTrackers');
	document.getElementById('customOpenTrackersSave').onclick = saveCustomLists;
	document.getElementById('customOpenTrackersRestore').onclick = restoreDefaultLists;
	document.getElementById('customClickTrackersText').value = await loadVariable('customClickTrackers');
	document.getElementById('customClickTrackersSave').onclick = saveCustomLists;
	document.getElementById('customClickTrackersRestore').onclick = restoreDefaultLists;

	document.getElementById('verboseOpt').checked = await loadVariable('verbose');
	document.getElementById('verboseOpt').onchange = saveOptions;

	document.getElementById('debugOpt').checked = await loadVariable('debug');
	document.getElementById('debugOpt').onchange = saveOptions;

	document.getElementById('advancedOpt').checked = await loadVariable('advanced');
	document.getElementById('advancedOpt').onchange = saveOptions;

	restoreOptionalPermissions();

	// Handle requests to change optional permissions
	// document.getElementById("allUrlsPermission1").onchange = changeOptionalPermission;
	document.getElementById('allUrlsPermission').onchange = changeOptionalPermission;

	// Showing some stats
	// Open Tracker Stats
	let allOpenTrackerBlocks = 0;
	let allOpenTrackerAllows = 0;
	let statsObj = await loadVariable('openTrackerStats');
	for (let key in statsObj) {
		if (statsObj.hasOwnProperty(key)) {
			let val = statsObj[key];
			if (!isNaN(val['blocked'])) allOpenTrackerBlocks = allOpenTrackerBlocks + val['blocked'];
			if (!isNaN(val['allowed'])) allOpenTrackerAllows = allOpenTrackerAllows + val['allowed'];
		}
	}
	document.getElementById('blockedOpenTrackers').innerHTML = allOpenTrackerBlocks;
	document.getElementById('allowedOpenTrackers').innerHTML = allOpenTrackerAllows;
	// Click Tracker Stats
	let allExposedTrackedLinks = 0;
	let allClickTrackerBypasses = 0;
	let allClickTrackerAllows = 0;
	statsObj = await loadVariable('clickTrackerStats');
	for (let key in statsObj) {
		if (statsObj.hasOwnProperty(key)) {
			let val = statsObj[key];
			if (!isNaN(val['exposed'])) allExposedTrackedLinks = allExposedTrackedLinks + val['exposed'];
			if (!isNaN(val['bypassed'])) allClickTrackerBypasses = allClickTrackerBypasses + val['bypassed'];
			if (!isNaN(val['allowed'])) allClickTrackerAllows = allClickTrackerAllows + val['allowed'];
		}
	}
	document.getElementById('exposedClickTrackers').innerHTML = allExposedTrackedLinks;
	document.getElementById('bypassedClickTrackers').innerHTML = allClickTrackerBypasses;
	document.getElementById('allowedClickTrackers').innerHTML = allClickTrackerAllows;
	// Stats start date
	document.getElementById('statsSinceDate').innerHTML =
		'(Since ' + new Date(await loadVariable('statsSinceDate')).toLocaleDateString() + ')';

	document.getElementById('version').innerHTML = chrome.runtime.getManifest().version;

	if (await loadVariable('advanced')) {
		let a = document.getElementsByClassName('advancedItem');
		for (let a0 of a) a0.classList.remove('hidden');

		a = document.getElementsByClassName('customLists');
		if (await loadVariable('useCustomLists')) {
			for (let a0 of a) a0.classList.remove('hidden');
		} else {
			for (let a0 of a) a0.classList.add('hidden');
		}

		// Suspicious Domains log
		const filterSelect = document.getElementById('suspDomainsFilter');
		if (filterSelect) {
			filterSelect.onchange = renderSuspDomains;
		}
		const saveBtn = document.getElementById('saveSuspDomainsBtn');
		if (saveBtn) {
			saveBtn.onclick = saveSuspDomainsMarkdown;
		}
		const clearBtn = document.getElementById('clearSuspDomainsBtn');
		if (clearBtn) {
			clearBtn.onclick = clearSuspDomains;
		}
		await renderSuspDomains();
	} else {
		let a = document.getElementsByClassName('advancedItem');
		for (let a0 of a) a0.classList.add('hidden');
	}

	if (allOpenTrackerBlocks + allClickTrackerBypasses > 100) {
		let tweetmsg =
			'.@trockerapp has blocked ' +
			(allOpenTrackerBlocks + allClickTrackerBypasses) +
			" trackers in my emails! It's free and opensource! Get it from https://trockerapp.github.io";
		document.getElementById('spreadtheword').innerHTML =
			'So Trocker has blocked ' +
			(allOpenTrackerBlocks + allClickTrackerBypasses) +
			' trackers in your emails. <a href="https://twitter.com/intent/tweet?text=' +
			tweetmsg +
			'">Tweet this to spread the word!</a>';
	}

	updatingSettings = false;
}

async function handleEnableToggle(event) {
	if (document.getElementById('trockerEnableOpt').checked) {
		// User is trying to enable
		// We request permission directly to preserve user gesture.
		// If already granted, it returns true without prompting.
		chrome.permissions.request(
			{
				permissions: [],
				origins: ['<all_urls>'],
			},
			async (granted) => {
				if (granted) {
					updateStatus('Permission granted. Trocker enabled.', 'successMsg');
					saveOptions();
					restoreOptionalPermissions();
				} else {
					document.getElementById('trockerEnableOpt').checked = false;
					await saveOptions();
					updateStatus('Permission required to enable Trocker!', 'warningMsg', 5000);
				}
			}
		);
	} else {
		// User is disabling, just save
		saveOptions();
	}
}

function restoreOptionalPermissions() {
	// Optional permissions check
	chrome.permissions.contains(
		{
			permissions: [],
			origins: ['<all_urls>'],
		},
		(result) => {
			let hasPermission;
			if (result) {
				// The extension has the permissions.
				hasPermission = true;
			} else {
				// The extension doesn't have the permissions.
				hasPermission = false;
			}
			// For some reason this is sometimes not as reliable as the one based on chrome.permissions.getAll()
			// document.getElementById("allUrlsPermission1").checked = hasPermission;
			// document.getElementById("allUrlsPermission").checked = hasPermission;
			// updatePermissionWarnings();
		}
	);

	chrome.permissions.getAll((permissions) => {
		// Alternative check for <all_urls>
		let hasAllUrlsPermission = permissions.origins.filter((s) => s == '<all_urls>').length;
		// document.getElementById("allUrlsPermission1").checked = hasAllUrlsPermission;
		document.getElementById('allUrlsPermission').checked = hasAllUrlsPermission;
		updatePermissionWarnings();
	});
}

function updatePermissionWarnings() {
	if (document.getElementById('allUrlsPermission').checked) {
		if (!document.getElementById('advancedOpt').checked) {
			document.getElementById('permissionSection').classList.add('hidden');
		}
	} else {
		document.getElementById('permissionSection').classList.remove('hidden');
	}

	if (document.getElementById('allUrlsPermission').checked) {
		document.getElementById('enablePermissionWarning').innerText = '';
		document.getElementById('enablePermissionWarning').className = '';
	} else {
		document.getElementById('enablePermissionWarning').innerText =
			'(You will be prompted to enable the required <all_urls> permission upon enabling Trocker.)';
		document.getElementById('enablePermissionWarning').className = 'warningMsg';
	}
}

function changeOptionalPermission(event) {
	// Permissions must be requested from inside a user gesture, like a button's
	// click handler.
	let permissions;
	let origins;
	let permissionName;
	if (event.target.id === 'allUrlsPermission' || event.target.id === 'allUrlsPermission1') {
		permissions = [];
		origins = ['<all_urls>'];
		permissionName = '<all_urls>';
	} else {
		// This should not happen
		return;
	}
	console.log(new Date().toLocaleString() + ': The user requested a change in optional permissions.');
	if (event.target.checked) {
		chrome.permissions.request(
			{
				permissions: permissions,
				origins: origins,
			},
			(granted) => {
				// The callback argument will be true if the user granted the permissions.
				if (granted) {
					// doSomething();
					updateStatus('Permission for ' + permissionName + ' was granted.', 'successMsg');
				} else {
					// doSomethingElse();
					console.log(new Date().toLocaleString() + ': Permission was NOT granted by the user.');
					updateStatus('Permission for ' + permissionName + ' was NOT granted!');
				}
				restoreOptionalPermissions();
			}
		);
	} else {
		chrome.permissions.remove(
			{
				permissions: permissions,
				origins: origins,
			},
			async (removed) => {
				if (removed) {
					// The permissions have been removed.
					updateStatus('Permission for ' + permissionName + ' was removed.');
					if (permissionName === '<all_urls>') {
						document.getElementById('trockerEnableOpt').checked = false;
						await saveOptions();
						updateStatus('Trocker disabled because permission was revoked.', 'warningMsg');
					}
				} else {
					// The permissions have not been removed (e.g., you tried to remove
					// required permissions).
					updateStatus('Permission for ' + permissionName + ' could not be removed!');
				}
				restoreOptionalPermissions();
			}
		);
	}
}

const SUSP_OPEN_BADGE_DESC =
	'Times this domain was heuristically flagged as an email open-tracking image (tracking pixel).';
const SUSP_CLICK_BADGE_DESC = 'Times this domain was heuristically flagged as a click-tracking link.';

const SUSP_REASON_DESCRIPTIONS = {
	'tiny-image': 'Image has tracking-pixel dimensions (e.g., 1×1 or hidden tiny image).',
	'susp-path': 'Image URL path matches a suspicious open-tracking pattern.',
	'tiny+susp-path': 'Image has tracking-pixel dimensions and its URL path matches an open-tracking pattern.',
	'path-embedded-url': 'URL contains another http(s):// destination URL embedded inside its path.',
	'open-tracker-host': 'Link shares its host with an open-tracking pixel detected in the same email.',
	'text-url-mismatch': "Link's visible text displays a different domain than its actual destination href.",
	'subdomain-token': 'Tracking-style subdomain (e.g., click.*, links.*, trk.*) paired with an opaque tracking token.',
	'click-path+entropy': 'Click/redirect-style URL path paired with a high-entropy token or opaque query parameter.',
	'high-entropy-params':
		'Query string contains a high-entropy token with a terse key, multiple opaque params, or email UTM tags.',
	'repeated-opaque-host':
		'Multiple links in the same email with different anchor text all route through this host with opaque tokens.',
};

const SUSP_LEGEND_ITEMS = [
	{ badgeClass: 'susp_badge susp_badge_open', label: 'open: N', desc: SUSP_OPEN_BADGE_DESC },
	{ badgeClass: 'susp_badge susp_badge_click', label: 'click: N', desc: SUSP_CLICK_BADGE_DESC },
	{
		badgeClass: 'susp_reason',
		label: 'esp-path:<esp>',
		desc: 'URL matches a known ESP click-tracking path pattern (e.g., SendGrid, HubSpot, SES, Substack) on a custom domain.',
	},
	{
		badgeClass: 'susp_reason',
		label: 'embedded-url-param:<key>',
		desc: 'Query parameter carries an embedded or Base64-encoded destination URL.',
	},
	...Object.entries(SUSP_REASON_DESCRIPTIONS).map(([label, desc]) => ({
		badgeClass: 'susp_reason',
		label,
		desc,
	})),
];

let suspTooltipSeq = 0;

function initSuspTooltips() {
	// Fallback where popover="hint" is unsupported (defaults to "manual"): switch toggletips to "auto" on open
	// so click-opened popovers still light-dismiss and close on Escape.
	const probe = document.createElement('div');
	if ('popover' in probe) {
		probe.popover = 'hint';
		if (probe.popover !== 'hint') {
			document.addEventListener(
				'beforetoggle',
				(event) => {
					const target = event.target;
					if (
						event.newState === 'open' &&
						target instanceof HTMLElement &&
						target.classList.contains('susp_tooltip') &&
						target.getAttribute('popover') === 'hint'
					) {
						target.popover = 'auto';
					}
				},
				true
			);
		}
	}

	// Keep aria-expanded in sync with popover state (toggle does not bubble, so capture phase is required).
	document.addEventListener(
		'toggle',
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || !target.classList.contains('susp_tooltip') || !target.id) return;
			const expanded = event.newState === 'open' ? 'true' : 'false';
			const triggers = document.querySelectorAll(`[popovertarget="${CSS.escape(target.id)}"]`);
			for (const trigger of triggers) {
				trigger.setAttribute('aria-expanded', expanded);
			}
		},
		true
	);

	// Populate the collapsible badge legend from the single source of truth above.
	const legendEl = document.getElementById('suspBadgeLegend');
	if (legendEl) {
		legendEl.textContent = '';
		for (const entry of SUSP_LEGEND_ITEMS) {
			const dt = document.createElement('dt');
			const badge = document.createElement('span');
			badge.className = entry.badgeClass;
			badge.textContent = entry.label;
			dt.appendChild(badge);

			const dd = document.createElement('dd');
			dd.textContent = entry.desc;

			legendEl.appendChild(dt);
			legendEl.appendChild(dd);
		}
	}
}

function describeSuspReason(reason) {
	if (!reason) return '';
	if (SUSP_REASON_DESCRIPTIONS[reason]) return SUSP_REASON_DESCRIPTIONS[reason];
	if (reason.startsWith('esp-path:')) {
		const esp = reason.slice('esp-path:'.length);
		return `URL matches a known ${esp} click-tracking path pattern (often on a custom CNAME domain).`;
	}
	if (reason.startsWith('embedded-url-param:')) {
		const key = reason.slice('embedded-url-param:'.length);
		return `Query parameter "${key}" carries an embedded or Base64-encoded destination URL.`;
	}
	return '';
}

function createBadge(className, text, description = '') {
	if (!description) {
		const span = document.createElement('span');
		span.className = className;
		span.textContent = text;
		return span;
	}

	const tipId = `susp-tip-${suspTooltipSeq++}`;
	const frag = document.createDocumentFragment();

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `${className} susp_badge_btn`;
	btn.textContent = text;
	btn.setAttribute('interestfor', tipId);
	btn.setAttribute('popovertarget', tipId);
	btn.setAttribute('popovertargetaction', 'show');
	btn.setAttribute('aria-expanded', 'false');

	const tip = document.createElement('div');
	tip.id = tipId;
	tip.setAttribute('popover', 'hint');
	tip.setAttribute('role', 'tooltip');
	tip.className = 'susp_tooltip';
	tip.textContent = description;

	frag.appendChild(btn);
	frag.appendChild(tip);
	return frag;
}

function createSuspDomainItem(item) {
	const li = document.createElement('li');
	li.className = 'susp_domain_item';

	const header = document.createElement('div');
	header.className = 'susp_domain_header';

	const domainEl = document.createElement('strong');
	domainEl.textContent = item.domain;
	header.appendChild(domainEl);

	if (item.openLoads > 0) {
		header.appendChild(createBadge('susp_badge susp_badge_open', `open: ${item.openLoads}`, SUSP_OPEN_BADGE_DESC));
	}
	if (item.clickLoads > 0) {
		header.appendChild(
			createBadge('susp_badge susp_badge_click', `click: ${item.clickLoads}`, SUSP_CLICK_BADGE_DESC)
		);
	}
	for (const reason of item.reasons) {
		header.appendChild(createBadge('susp_reason', reason, describeSuspReason(reason)));
	}

	const rmBtn = document.createElement('button');
	rmBtn.type = 'button';
	rmBtn.className = 'susp_remove_btn';
	rmBtn.textContent = '×';
	rmBtn.title = `Remove ${item.domain} from log`;
	rmBtn.onclick = () => removeSuspDomain(item.domain);
	header.appendChild(rmBtn);
	li.appendChild(header);

	if (item.sampleUrls.length > 0) {
		const details = document.createElement('details');
		const summary = document.createElement('summary');
		summary.textContent = `${item.sampleUrls.length} sample URL${item.sampleUrls.length === 1 ? '' : 's'}`;
		details.appendChild(summary);

		const ul = document.createElement('ul');
		ul.className = 'susp_urls';
		for (const sample of item.sampleUrls) {
			const urlLi = document.createElement('li');
			const tagParts = [sample.type, sample.reason].filter(Boolean);
			if (tagParts.length > 0) {
				const typeDesc =
					sample.type === 'open'
						? 'Open tracker'
						: sample.type === 'click'
							? 'Click tracker'
							: '';
				const reasonDesc = describeSuspReason(sample.reason);
				const badgeTitle = [typeDesc, reasonDesc].filter(Boolean).join(': ');
				urlLi.appendChild(createBadge('susp_reason', tagParts.join(' | '), badgeTitle));
				urlLi.appendChild(document.createTextNode(' '));
			}
			urlLi.appendChild(document.createTextNode(sample.url));
			ul.appendChild(urlLi);
		}
		details.appendChild(ul);
		li.appendChild(details);
	}

	return li;
}

async function getFilteredSuspDomains() {
	const filterEl = document.getElementById('suspDomainsFilter');
	const filterVal = filterEl ? filterEl.value : 'all';

	const suspDomainsObj = (await loadVariable('suspDomains')) || {};
	const entries = Object.entries(suspDomainsObj)
		.map(([domain, rec]) => {
			const openLoads = typeof rec.openLoads === 'number' ? rec.openLoads : rec.loads || 0;
			const clickLoads = typeof rec.clickLoads === 'number' ? rec.clickLoads : 0;
			return {
				domain,
				loads: rec.loads || openLoads + clickLoads,
				openLoads,
				clickLoads,
				reasons: Array.isArray(rec.reasons) ? rec.reasons : [],
				sampleUrls: Array.isArray(rec.sampleUrls)
					? rec.sampleUrls.map((s) =>
							typeof s === 'string'
								? { url: s, type: '', reason: '' }
								: { url: s.url || '', type: s.type || '', reason: s.reason || '' }
						)
					: [],
				lastSeen: rec.lastSeen || 0,
			};
		})
		.filter((item) => (filterVal === 'open' ? item.openLoads > 0 : filterVal === 'click' ? item.clickLoads > 0 : true))
		.sort((a, b) => b.lastSeen - a.lastSeen || b.loads - a.loads);

	return { entries, filterVal };
}

function formatSuspDomainsMarkdown(entries, filterVal, redact) {
	const lines = [
		`## Suspicious Domains (filter: ${filterVal}, count: ${entries.length}${redact ? ', tokens redacted' : ''})`,
		'',
	];
	entries.forEach((item, idx) => {
		const counts = [];
		if (item.openLoads > 0) counts.push(`open: ${item.openLoads}`);
		if (item.clickLoads > 0) counts.push(`click: ${item.clickLoads}`);
		const reasonsStr =
			item.reasons.length > 0 ? ` | reasons: ${item.reasons.map((r) => '`' + r + '`').join(', ')}` : '';
		const lastSeenStr = item.lastSeen ? ` | last seen: ${new Date(item.lastSeen).toISOString()}` : '';
		lines.push(
			`${idx + 1}. **${item.domain}** — ${counts.join(', ') || `loads: ${item.loads}`}${reasonsStr}${lastSeenStr}`
		);
		const sampleCounts = new Map();
		for (const sample of item.sampleUrls) {
			const tagParts = [sample.type, sample.reason].filter(Boolean);
			const tag = tagParts.length > 0 ? `\`[${tagParts.join(' | ')}]\` ` : '';
			const displayUrl = redact ? redactUrlTokens(sample.url) : sample.url;
			const line = `${tag}\`${displayUrl}\``;
			sampleCounts.set(line, (sampleCounts.get(line) || 0) + 1);
		}
		for (const [line, count] of sampleCounts.entries()) {
			lines.push(`   - ${line}${count > 1 ? ` (×${count})` : ''}`);
		}
	});
	return lines.join('\n');
}

async function saveSuspDomainsMarkdown(event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	const { entries, filterVal } = await getFilteredSuspDomains();
	if (entries.length === 0) {
		updateStatus('Nothing in the log to save.', 'warningMsg', 2500);
		return;
	}
	const redactEl = document.getElementById('redactSuspTokensOpt');
	const redact = redactEl ? redactEl.checked : true;
	const markdown = formatSuspDomainsMarkdown(entries, filterVal, redact);

	const dateStr = new Date().toISOString().slice(0, 10);
	const filename = `trocker-suspicious-domains-${dateStr}.md`;
	const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 1000);

	updateStatus(
		`Saved ${entries.length} suspicious domain(s) to ${filename}${redact ? ' (redacted)' : ''}.`,
		'successMsg',
		2500
	);
}

async function renderSuspDomains() {
	const container = document.getElementById('suspDomains');
	if (!container) return;

	suspTooltipSeq = 0;
	const { entries } = await getFilteredSuspDomains();

	container.textContent = '';
	if (entries.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'text_disabled';
		empty.textContent = 'Nothing in the log!';
		container.appendChild(empty);
		return;
	}

	const ol = document.createElement('ol');
	ol.className = 'susp_list';
	for (const item of entries) {
		ol.appendChild(createSuspDomainItem(item));
	}
	container.appendChild(ol);
}

async function removeSuspDomain(key) {
	let suspDomainsObj = (await loadVariable('suspDomains')) || {};
	delete suspDomainsObj[key];
	await saveVariable('suspDomains', suspDomainsObj);
	await renderSuspDomains();
}

async function clearSuspDomains(event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	await saveVariable('suspDomains', {});
	await renderSuspDomains();
	updateStatus('Suspicious domains log cleared.');
}

document.addEventListener('DOMContentLoaded', () => {
	initSuspTooltips();
	restoreOptions();
});
