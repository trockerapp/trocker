import { loadVariable, saveVariable, updateBrowserActionButton, updateDeclarativeNetRequestRules } from './tools.js';
import { getOpenTrackerList, getClickTrackerList } from './lists.js';

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
	await saveVariable('anyPage', document.getElementById('anyPageOpt').checked);
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

	document.getElementById('anyPageOpt').checked = await loadVariable('anyPage');
	document.getElementById('anyPageOpt').onchange = saveOptions;

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
	document.getElementById('tabsPermission').onchange = changeOptionalPermission;

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

		// Extra stats
		if (!document.getElementById('suspDomains')) {
			document.getElementById('allowedClickTrackers').parentElement.innerHTML +=
				'<li><span class="stat_name">Suspicious Domains: </span><span class="stat_value" id="suspDomains">Nothing in the log!</span>';
		}
		// Susp Domain List
		let suspDomainsObj = await loadVariable('suspDomains');
		//document.getElementById("suspDomains").innerHTML = Object.keys(suspDomainsObj).length+'<br />';
		let listHTML = '<div><ol>';
		for (let key in suspDomainsObj) {
			//listHTML += '<li><input type="checkbox" id="removeDomain" src="'+key+'">'+key+' -> '+suspDomainsObj[key].loads+'<br /><ul>';
			listHTML += '<li>' + key + ' -> ' + suspDomainsObj[key].loads + ' times<br /><ul>';
			for (let i = 0; i < suspDomainsObj[key].sampleUrls.length; i++)
				listHTML += '<li>' + suspDomainsObj[key].sampleUrls[i] + '</li>';
			listHTML += '</ul></li>';
		}
		listHTML += '</ol></div>';
		document.getElementById('suspDomains').innerHTML = listHTML;
		//document.getElementById('removeDomain').onchange = removeSuspDomain;
	} else {
		let a = document.getElementsByClassName('advancedItem');
		for (let a0 of a) a0.classList.add('hidden');
		// Extra stats
		let node = document.getElementById('suspDomains');
		if (node) node.parentElement.removeChild(node);
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
	chrome.permissions.contains(
		{
			permissions: ['tabs'],
			origins: [],
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
			document.getElementById('tabsPermission').checked = hasPermission;
			updatePermissionWarnings();
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
	if (document.getElementById('allUrlsPermission').checked && document.getElementById('tabsPermission').checked) {
		document.getElementById('anyPageWarning').innerText = '(All required permission are granted)';
		document.getElementById('anyPageWarning').className = '';
	} else {
		if (document.getElementById('anyPageOpt').checked) {
			document.getElementById('anyPageWarning').innerText =
				'(Some required permission are missing (grant from below)!)';
			document.getElementById('anyPageWarning').className = 'warningMsg';
		} else {
			document.getElementById('anyPageWarning').innerText = '';
			document.getElementById('anyPageWarning').className = '';
		}
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
	} else if (event.target.id === 'tabsPermission') {
		permissions = ['tabs'];
		origins = [];
		permissionName = 'tabs';
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

async function removeSuspDomain(key) {
	suspDomainsObj = await loadVariable('suspDomains');
	//delete thisIsObject[key];
	await saveVariable('suspDomains', suspDomainsObj);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
