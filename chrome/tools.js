import { getOpenTrackerList, getClickTrackerList } from './lists.js';

const manifest_version = chrome.runtime.getManifest().manifest_version;

async function getRequestRules() {
	let extensionHost = chrome.runtime.id;
	try {
		const url = new URL(chrome.runtime.getURL(''));
		if (url.hostname) {
			extensionHost = url.hostname;
		}
	} catch (e) {}

	let openList = await getOpenTrackerList();
	let openBlockPatterns = [];
	for (let item of openList) {
		openBlockPatterns.push(...item.patterns);
		openBlockPatterns.push(...item.domains);
	}
	let openRules = openBlockPatterns.map((pattern, index) => ({
		id: 1 + index,
		priority: 1,
		action: {
			type: 'block',
		},
		condition: {
			urlFilter: pattern,
			resourceTypes: ['image', 'media'],
		},
	}));

	//    {
	//        "id": 2,
	//        "priority": 5,
	//        "action": { "type": "allow" },
	//        "condition": {"urlFilter": "trfcallwmrk"}
	//    }

	let clickList = await getClickTrackerList();
	let clickBlockRegexPatterns = [];
	let clickBlockPatterns = [];
	for (let item of clickList) {
		if (item.regex) {
			clickBlockRegexPatterns.push(item.regex);
		} else {
			clickBlockPatterns.push(...item.patterns);
			clickBlockPatterns.push(...item.domains);
		}
	}
	let clickRules = clickBlockRegexPatterns.map((pattern, index) => ({
		id: 1 + index + openRules.length,
		priority: 1,
		action: {
			type: 'redirect',
			redirect: {
				// "url": chrome.runtime.getURL("bypasser.html")
				regexSubstitution: chrome.runtime.getURL('bypasser.html') + '#\\1',
			},
		},
		condition: {
			// "urlFilter": pattern,
			regexFilter: pattern,
			excludedInitiatorDomains: [extensionHost], // To allow forwarding after Trocker notice
			resourceTypes: [
				'main_frame',
				// "sub_frame",
				// "stylesheet",
				// "script",
				// "image",
				// "font",
				// "object",
				// "xmlhttprequest",
				// "ping",
				// "csp_report",
				// "media",
				// "websocket",
				// "webtransport",
				// "webbundle",
				// "other"
			],
		},
	}));
	// {
	// 	"id": 2,
	// 	"priority": 1,
	// 	"action": {
	// 	  "type": "redirect",
	// 	  "redirect": {
	// 		"url": "https://developer.chrome.com/docs/extensions/reference/action/"
	// 	  }
	// 	},
	// 	"condition": {
	// 	  "urlFilter": "https://developer.chrome.com/docs/extensions/reference/browserAction/",
	// 	  "resourceTypes": ["main_frame"]
	// 	}
	// }
	let allRules = openRules.concat(clickRules);
	return allRules;
}

export async function updateDeclarativeNetRequestRules() {
	// Get arrays containing new and old rules
	const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
	const oldRuleIds = oldRules.map((rule) => rule.id);
	let trockerEnabled = await loadVariable('trockerEnable');
	const newRules = trockerEnabled ? await getRequestRules() : [];

	// Use the arrays to update the dynamic rules
	await chrome.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: oldRuleIds,
		addRules: newRules,
	});

	const ruleSetIds = ['DNR_bypass_redirects', 'DNR_proxy_rules'];
	await chrome.declarativeNetRequest.updateEnabledRulesets(
		trockerEnabled
			? {
					disableRulesetIds: [],
					enableRulesetIds: ruleSetIds,
				}
			: {
					disableRulesetIds: ruleSetIds,
					enableRulesetIds: [],
				}
	);

	// let TestMatchRequestDetailsList = [{
	// 	initiator: "https://mail.google.com",
	// 	method: "get",
	// 	tabId: 1625521131,
	// 	type: "sub_frame",
	// 	url: "https://t.yesware.com/tl/9753ac6e46810c884c8c008a53991032923afab3/1531a6fa3bb44dcdf7ca6d2b7a8961b2/8ea2a6afa82c6ee10173c22c413e42f6?ytl=http%3A%2F%2Fgoogle.com"
	// }, {
	// 	initiator: "https://mail.google.com",
	// 	method: "get",
	// 	tabId: 1625521131,
	// 	type: "image",
	// 	url: "https://ci3.googleusercontent.com/meips/ADKq_Nbao412LzZzvlfPNFgd8rPBDmVj_DJuXNPAwb-ULpR8DevxlmgPYjHImvcXczX_PR17q8bXH5ReOl3QxG_n3nMK487yuVXOvs4I7Nn3_gIh4vClOHt_z64XkuiL2G8zXt5AmenudfYW4M36iEc9vL-drLmbVkNYf5OoQTvETMXrLvI=s0-d-e1-ft#https://t.yesware.com/t/9753ac6e46810c884c8c008a53991032923afab3/6bdce9bc54a5733f092ddd9aebc7cc85/spacer.gif"
	// }];
	// for (let TestMatchRequestDetails of TestMatchRequestDetailsList){
	// 	chrome.declarativeNetRequest.testMatchOutcome(
	// 		TestMatchRequestDetails,
	// 		(res) => {
	// 			console.log(`Rules matching ${TestMatchRequestDetails.url}`)
	// 			console.log(res)
	// 		},
	// 	);
	// }
}

function setBrowserActions(options) {
	let iconCallback = function () {
		if (chrome.runtime.lastError) {
			return;
		}
		if (options.tabId === undefined) {
			chrome.action.setBadgeText({ text: options.badgeText });
		} else {
			chrome.action.setBadgeText({ text: options.badgeText, tabId: options.tabId });
		}
		chrome.action.setBadgeBackgroundColor({ color: options.color });
	};
	chrome.action.setIcon({ path: options.iconPaths }, iconCallback);
	//chrome.browserAction.setIcon({ tabId: options.tabId, path: options.iconPaths }, iconCallback);
}

export async function updateBrowserActionButton(tabId, trackerCount) {
	let browserActionOptions = {
		tabId: tabId,
	};

	if ((await loadVariable('trockerEnable')) == true) {
		browserActionOptions.iconPaths = 'img/trocker.png';
		browserActionOptions.color = [208, 0, 24, 255];
	} else {
		browserActionOptions.iconPaths = 'img/trockerbw.png';
		browserActionOptions.color = [190, 190, 190, 230];
	}
	browserActionOptions.badgeText = '';
	if (trackerCount > 0) browserActionOptions.badgeText = trackerCount.toString();
	setBrowserActions(browserActionOptions);
}

export async function findOriginalLink(trackedURL) {
	let origLink = '';
	let clickTrackers = await getClickTrackerList();
	for (let i = 0; i < clickTrackers.length; i++) {
		if (multiMatch(trackedURL, clickTrackers[i].domains)) {
			if (clickTrackers[i]['param'] !== undefined) {
				let urlParams = parseUrlParams(trackedURL);
				if (urlParams[clickTrackers[i]['param']] !== undefined) {
					let origLink = urlParams[clickTrackers[i]['param']];
					return origLink;
				}
			}
			break;
		}
	}
	return origLink;
}

// To monitor storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
	for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
		console.log(
			`Storage key "${key}" in namespace "${namespace}" changed.`,
			`Old value was "${oldValue}", new value is "${newValue}".`
		);
	}
});

// Create offscreen document to transition local storage data
// https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/cookbook.offscreen-dom/background.js
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let creating_offscreen = false; // A global promise to avoid concurrency issues
async function sendMessageToOffscreenDocument(type, data) {
	// Create an offscreen document if one doesn't exist yet
	if (!(await hasDocument())) {
		if (creating_offscreen) {
			await creating_offscreen;
		} else {
			creating_offscreen = chrome.offscreen.createDocument({
				url: OFFSCREEN_DOCUMENT_PATH,
				reasons: ['LOCAL_STORAGE'],
				justification: 'Port data over from local storage',
			});
			await creating_offscreen;
			creating_offscreen = null;
		}
	}
	// Now that we have an offscreen document, we can dispatch the
	// message.
	chrome.runtime.sendMessage({
		type: type,
		target: 'offscreen',
		data: data,
	});
	// Note that extensions cannot send messages to content scripts using this method (chrome.runtime.sendMessage).
	// To send messages to content scripts, use tabs.sendMessage.
}

chrome.runtime.onMessage.addListener(handleOffscreenMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleOffscreenMessages(message) {
	// Return early if this message isn't meant for the background script
	if (message.target !== 'background') {
		return;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case 'get-full-local-storage-result':
			handleGetFullLocalStorageResult(message.data);
			// closeOffscreenDocument();
			break;
		case 'get-full-local-storage-result':
			handleGetLocalStorageResult(message.data);
			// closeOffscreenDocument();
			break;
		case 'loadVariable':
		case 'getTrackerLists':
		case 'reportTrackerStats':
			// service worker will reply
			break;
		default:
			console.warn(`Unexpected message type received: '${message.type}'.`);
	}
}

async function handleGetFullLocalStorageResult(data) {
	console.log('Received data from offscreen: ', data);
	data['V3_conversion'] = new Date(); // Store the date for latest import of local storage to avoid redoing it
	return await saveToStorage(data);
}

async function handleGetLocalStorageResult(data) {
	console.log('Received data from offscreen: ', data);
}

async function closeOffscreenDocument() {
	if (!(await hasDocument())) {
		return;
	}
	await chrome.offscreen.closeDocument();
}

async function hasDocument() {
	const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
	try {
		const existingContexts = await chrome.runtime.getContexts({
			contextTypes: ['OFFSCREEN_DOCUMENT'],
			documentUrls: [offscreenUrl],
		});
		if (existingContexts.length > 0) {
			return true;
		}
	} catch (e) {
		console.warn('runtime.getContexts failed:', e);
		return false;
	}

	if (existingContexts.length > 0) {
		return true;
	}
	return false;
}

async function checkStorageTransition() {
	let res = await chrome.storage.local.get(['V3_conversion']);
	if (!res['V3_conversion']) {
		// Commence V3 storage transition

		// Firefox Background Script Migration (No offscreen needed)
		// Detect Firefox by checking if 'browser' is defined and userAgent contains Firefox
		if (typeof browser !== 'undefined' && /Firefox/.test(navigator.userAgent)) {
			console.log('Firefox detected. Attempting direct localStorage migration...');
			try {
				if (typeof localStorage !== 'undefined' && localStorage['dataCache']) {
					let dataCache = JSON.parse(localStorage['dataCache']);
					await handleGetFullLocalStorageResult(dataCache);
					console.log('Direct Firefox migration successful.');
				} else {
					// No legacy data found or localStorage missing
					// Initialize storage to mark conversion as done so we don't check again
					await handleGetFullLocalStorageResult({
						V3_migration_log: 'Firefox_direct_migration_no_data_found',
					});
					console.log('Direct Firefox migration: No local storage data found. Initialized empty.');
				}
			} catch (e) {
				console.error('Direct Firefox migration failed:', e);
			}
			return; // CRITICAL: Return here to avoid falling through to offscreen code which errors in Firefox
		}

		return sendMessageToOffscreenDocument('get-full-local-storage', null);
	} else {
		return;
	}
}

function getStorageForKey(key) {
	if (key == '???') {
		// To sync settings across devices, add their names here
		return 'sync';
	} else {
		return 'local';
	}
}

async function loadFromStorage(objName, namespace = 'auto') {
	if (namespace == 'auto') {
		namespace = getStorageForKey(objName);
	}
	let storageAPI = namespace == 'sync' ? chrome.storage.sync : chrome.storage.local;
	let res = await storageAPI.get([objName]);
	return res[objName];
}

function pick(o, ...props) {
	return Object.assign({}, ...props.map((prop) => ({ [prop]: o[prop] })));
}

async function saveToStorage(dict, namespace = 'auto') {
	if (namespace == 'auto') {
		const syncKeys = Object.keys(dict).filter((key) => getStorageForKey(key) == 'sync');
		const localKeys = Object.keys(dict).filter((key) => getStorageForKey(key) == 'local');
		const syncDict = pick(dict, ...syncKeys);
		const localDict = pick(dict, ...localKeys);
		if (Object.keys(syncDict).length) {
			await chrome.storage.sync.set(syncDict);
		}
		if (Object.keys(localDict).length) {
			await chrome.storage.local.set(localDict);
		}
		return;
	} else {
		let storageAPI = namespace == 'sync' ? chrome.storage.sync : chrome.storage.local;
		return await storageAPI.set(dict);
	}
}

async function loadObjectFromCache(objName) {
	if (manifest_version < 3) {
		if (typeof localStorage['dataCache'] === 'undefined') {
			localStorage['dataCache'] = JSON.stringify({});
		}
		let dataCache = JSON.parse(localStorage['dataCache']);
		return dataCache[objName];
	} else {
		try {
			await checkStorageTransition();
		} catch (err) {
			console.error(err);
		}
		return await loadFromStorage(objName);
	}
}

async function cacheObject(objName, obj) {
	if (manifest_version < 3) {
		let dataCache = JSON.parse(localStorage['dataCache']);
		dataCache[objName] = obj;
		localStorage['dataCache'] = JSON.stringify(dataCache);
	} else {
		return await saveToStorage({ [objName]: obj });
	}
}

export async function loadVariable(varName) {
	let varValue = await loadObjectFromCache(varName);

	// If variable is not valid or not defined, return and save the default value
	if (varName == 'trockerEnable' && varValue === undefined) {
		varValue = true;
		cacheObject(varName, varValue);
	}
	if (varName == 'showTrackerCount' && varValue === undefined) {
		varValue = true;
		cacheObject(varName, varValue);
	}
	if (varName == 'exposeLinks' && varValue === undefined) {
		varValue = true;
		cacheObject(varName, varValue);
	} // Let the default be to expose tracking images
	if (varName == 'linkBypassTimeout' && varValue === undefined) {
		varValue = 11;
		cacheObject(varName, varValue);
	}
	if (varName == 'useCustomLists' && varValue === undefined) {
		varValue = false;
		cacheObject(varName, varValue);
	}
	if (varName == 'customOpenTrackers' && varValue === undefined) {
		varValue = '';
		cacheObject(varName, varValue);
	}
	if (varName == 'customClickTrackers' && varValue === undefined) {
		varValue = '';
		cacheObject(varName, varValue);
	}
	if (varName == 'openTrackerStats' && varValue === undefined) {
		varValue = {};
		cacheObject(varName, varValue);
	}
	if (varName == 'clickTrackerStats' && varValue === undefined) {
		varValue = {};
		cacheObject(varName, varValue);
	}
	if (varName == 'statsSinceDate' && (varValue === undefined || new Date(varValue) == 'Invalid Date')) {
		varValue = new Date();
		cacheObject(varName, varValue);
	}
	if (varName == 'suspDomains' && varValue === undefined) {
		varValue = {};
		cacheObject(varName, varValue);
	}
	if (varName == 'advanced' && varValue === undefined) {
		varValue = false;
		cacheObject(varName, varValue);
	}
	if (varName == 'verbose' && varValue === undefined) {
		varValue = false;
		cacheObject(varName, varValue);
	}
	if (varName == 'debug' && varValue === undefined) {
		varValue = false;
		cacheObject(varName, varValue);
	}

	// Obsolete
	if (varName == 'allowedTrackerLinks' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}
	if (varName == 'blockedTrackerLinks' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}
	if (varName == 'allowedYWOpenTrackers' && isNaN(varValue)) {
		varValue = await loadVariable('allowedTrackerLinks');
		cacheObject(varName, varValue);
	}
	if (varName == 'blockedYWOpenTrackers' && isNaN(varValue)) {
		varValue = await loadVariable('blockedTrackerLinks');
		cacheObject(varName, varValue);
	}
	if (varName == 'allowedSKOpenTrackers' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}
	if (varName == 'blockedSKOpenTrackers' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}
	if (varName == 'allowedYWClickTrackers' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}
	if (varName == 'bypassedYWClickTrackers' && isNaN(varValue)) {
		varValue = 0;
		cacheObject(varName, varValue);
	}

	return varValue;
}

export async function saveVariable(varName, varValue) {
	await loadVariable(varName); // This make sure dataCache exists
	await cacheObject(varName, varValue);
	return await loadVariable(varName);
}

async function getStat(statObjName, statName, fieldName) {
	let statObj = await loadVariable(statObjName);
	if (statObj[statName] === undefined) statObj[statName] = {};
	if (isNaN(statObj[statName][fieldName])) {
		statObj[statName][fieldName] = 0;
		await saveVariable(statObjName, statObj);
	}
	return statObj[statName][fieldName];
}

async function setStat(statObjName, statName, fieldName, fieldValue) {
	await getStat(statObjName, statName, fieldName); // Make sure stat exists
	let statObj = await loadVariable(statObjName);
	statObj[statName][fieldName] = fieldValue;
	await saveVariable(statObjName, statObj);
}

export async function statPlusN(statObjName, statName, fieldName, N) {
	await setStat(statObjName, statName, fieldName, (await getStat(statObjName, statName, fieldName)) + N);
}

export async function statPlusPlus(statObjName, statName, fieldName) {
	await statPlusN(statObjName, statName, fieldName, 1);
}

async function logSuspURL(url) {
	if (loadVariable('advanced')) {
		if (!url) return;
		let suspDomainsObj = await loadVariable('suspDomains'); // This make sure dataCache exists
		let urlDomain = extractDomain(url);
		if (suspDomainsObj[urlDomain] === undefined)
			suspDomainsObj[urlDomain] = {
				loads: 0,
				sampleUrls: [],
			};
		suspDomainsObj[urlDomain].loads++;
		if (suspDomainsObj[urlDomain].sampleUrls.indexOf(url) == -1) {
			suspDomainsObj[urlDomain].sampleUrls.push(url);
			suspDomainsObj[urlDomain].sampleUrls = suspDomainsObj[urlDomain].sampleUrls.slice(
				Math.max(suspDomainsObj[urlDomain].sampleUrls.length - 5, 0)
			); // Only keep the last 5 elements
		}
		let keys = Object.keys(suspDomainsObj);
		let maxKeysToKeep = 15;
		if (keys.length > maxKeysToKeep)
			// Only keep the last 100 elements
			for (let i = 0; i < keys.length - maxKeysToKeep; i++) delete suspDomainsObj[keys[i]];
		await saveVariable('suspDomains', suspDomainsObj);
	}
}

function extractDomain(url) {
	let domain;
	//find & remove protocol (http, ftp, etc.) and get domain
	if (url.indexOf('://') > -1) {
		domain = url.split('/')[2];
	} else {
		domain = url.split('/')[0];
	}

	//find & remove port number
	domain = domain.split(':')[0];

	return domain;
}

function parseUrlParams(url) {
	let match,
		pl = /\+/g, // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) {
			return decodeURIComponent(s.replace(pl, ' '));
		},
		query = url.slice(url.indexOf('?') + 1); // The query part of the url

	let urlParams = {};
	while ((match = search.exec(query))) urlParams[decode(match[1])] = decode(match[2]);

	return urlParams;
}

export function parseVersionString(str) {
	if (typeof str != 'string') {
		return false;
	}
	let x = str.split('.');
	// parse from string or default to 0 if can't parse
	let maj = parseInt(x[0]) || 0;
	let min = parseInt(x[1]) || 0;
	let pat = parseInt(x[2]) || 0;
	return {
		major: maj,
		minor: min,
		patch: pat,
	};
}

// returns true if str contains any of patterns in it
export function multiMatch(str, patterns) {
	for (let i = 0; i < patterns.length; i++) {
		if (str.indexOf(patterns[i]) > -1) return true;
	}
	return false;
}
