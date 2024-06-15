const manifest_version = chrome.runtime.getManifest().manifest_version;

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
	}

	if (await loadVariable('trockerEnable') == true) {
		browserActionOptions.iconPaths = "trocker.png";
		browserActionOptions.color = [208, 0, 24, 255];
	} else {
		browserActionOptions.iconPaths = "trockerbw.png";
		browserActionOptions.color = [190, 190, 190, 230];
	}
	browserActionOptions.badgeText = '';
	if (trackerCount > 0) browserActionOptions.badgeText = (trackerCount).toString();
	setBrowserActions(browserActionOptions);
}

function findOriginalLink(trackedURL) {
	let origLink = '';
	let clickTrackers = getClickTrackerList();
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
	for (let [key, {
			oldValue,
			newValue
		}] of Object.entries(changes)) {
		console.log(
			`Storage key "${key}" in namespace "${namespace}" changed.`,
			`Old value was "${oldValue}", new value is "${newValue}".`
		);
	}
});

// Create offscreen document to transition local storage data
// https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/cookbook.offscreen-dom/background.js
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let creating_offscreen=false; // A global promise to avoid concurrency issues
async function sendMessageToOffscreenDocument(type, data) {
	// Create an offscreen document if one doesn't exist yet
	if (!(await hasDocument())) {
		if (creating_offscreen) {
			await creating_offscreen;
		} else {
			creating_offscreen = chrome.offscreen.createDocument({
				url: OFFSCREEN_DOCUMENT_PATH,
				reasons: ['LOCAL_STORAGE'],
				justification: 'Port data over from local storage'
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
		data: data
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
		case 'reportTrackerCount':
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
	const existingContexts = await chrome.runtime.getContexts({
		contextTypes: ['OFFSCREEN_DOCUMENT'],
		documentUrls: [offscreenUrl]
	});

	if (existingContexts.length > 0) {
		return true;
	}
	return false;
}

async function checkStorageTransition() {
	let res = await chrome.storage.local.get(['V3_conversion']);
	if (!res['V3_conversion']) {
		// Commence V3 storage transition
		return sendMessageToOffscreenDocument('get-full-local-storage', null);
	} else {
		return;
	}
}

function getStorageForKey(key){
	if (key == '???') { // To sync settings across devices, add their names here
		return 'sync'
	} else {
		return 'local';
	}
}

async function loadFromStorage(objName, namespace='auto'){
	if (namespace == 'auto') {
		namespace = getStorageForKey(objName)	
	}
	let storageAPI = (namespace == 'sync') ? chrome.storage.sync : chrome.storage.local;
	let res = await storageAPI.get([objName]);
	return res[objName];
}

function pick(o, ...props) {
    return Object.assign({}, ...props.map(prop => ({[prop]: o[prop]})));
}

async function saveToStorage(dict, namespace='auto'){
	if (namespace == 'auto') {
		const syncKeys = Object.keys(dict).filter( key => getStorageForKey(key) == 'sync' );
		const localKeys = Object.keys(dict).filter( key => getStorageForKey(key) == 'local' );
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
		let storageAPI = (namespace == 'sync') ? chrome.storage.sync : chrome.storage.local;
		return await storageAPI.set(dict);
	}
}

async function loadObjectFromCache(objName) {
	if (manifest_version < 3) {
		if (typeof localStorage['dataCache'] === "undefined") { localStorage['dataCache'] = JSON.stringify({}); }
		let dataCache = JSON.parse(localStorage['dataCache']);
		return dataCache[objName];
	} else {
		await checkStorageTransition();
		return await loadFromStorage(objName);
	}
}

async function cacheObject(objName, obj) {
	if (manifest_version < 3) {
		let dataCache = JSON.parse(localStorage['dataCache']);
		dataCache[objName] = obj;
		localStorage['dataCache'] = JSON.stringify(dataCache);
	} else {
		return await saveToStorage({[objName]: obj});
	}
}

export async function loadVariable(varName) {
	let varValue = await loadObjectFromCache(varName);

	// If variable is not valid or not defined, return and save the default value
	if ((varName == 'trockerEnable') && (varValue === undefined)) { varValue = true; cacheObject(varName, varValue); }
	if ((varName == 'showTrackerCount') && (varValue === undefined)) { varValue = true; cacheObject(varName, varValue); }
	if ((varName == 'anyPage') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'exposeLinks') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'linkBypassTimeout') && (varValue === undefined)) { varValue = 11; cacheObject(varName, varValue); }
	if ((varName == 'useCustomLists') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'customOpenTrackers') && (varValue === undefined)) { varValue = ''; cacheObject(varName, varValue); }
	if ((varName == 'customClickTrackers') && (varValue === undefined)) { varValue = ''; cacheObject(varName, varValue); }
	if ((varName == 'openTrackerStats') && (varValue === undefined)) { varValue = {}; cacheObject(varName, varValue); }
	if ((varName == 'clickTrackerStats') && (varValue === undefined)) { varValue = {}; cacheObject(varName, varValue); }
	if ((varName == 'statsSinceDate') && ((varValue === undefined) || (new Date(varValue) == "Invalid Date"))) { varValue = new Date(); cacheObject(varName, varValue); }
	if ((varName == 'suspDomains') && (varValue === undefined)) { varValue = {}; cacheObject(varName, varValue); }
	if ((varName == 'advanced') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'verbose') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'debug') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }

	// Obsolete
	if ((varName == 'allowedTrackerLinks') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'blockedTrackerLinks') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'allowedYWOpenTrackers') && isNaN(varValue)) { varValue = loadVariable('allowedTrackerLinks'); cacheObject(varName, varValue); }
	if ((varName == 'blockedYWOpenTrackers') && isNaN(varValue)) { varValue = loadVariable('blockedTrackerLinks'); cacheObject(varName, varValue); }
	if ((varName == 'allowedSKOpenTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'blockedSKOpenTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'allowedYWClickTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'bypassedYWClickTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }


	return varValue;
}

export async function saveVariable(varName, varValue) {
	loadVariable(varName); // This make sure dataCache exists
	cacheObject(varName, varValue);
	return loadVariable(varName);
}

function getStat(statObjName, statName, fieldName) {
	let statObj = loadVariable(statObjName);
	if (statObj[statName] === undefined) statObj[statName] = {};
	if (isNaN(statObj[statName][fieldName])) {
		statObj[statName][fieldName] = 0;
		saveVariable(statObjName, statObj);
	}
	return statObj[statName][fieldName];
}

function setStat(statObjName, statName, fieldName, fieldValue) {
	getStat(statObjName, statName, fieldName); // Make sure stat exists
	let statObj = loadVariable(statObjName);
	statObj[statName][fieldName] = fieldValue;
	saveVariable(statObjName, statObj);
}

function statPlusPlus(statObjName, statName, fieldName) {
	setStat(statObjName, statName, fieldName, getStat(statObjName, statName, fieldName) + 1);
}

function logSuspURL(url) {
	if (loadVariable('advanced')) {
		if (!url) return;
		let suspDomainsObj = loadVariable('suspDomains'); // This make sure dataCache exists
		let urlDomain = extractDomain(url);
		if (suspDomainsObj[urlDomain] === undefined) suspDomainsObj[urlDomain] = {
			"loads": 0,
			"sampleUrls": []
		};
		suspDomainsObj[urlDomain].loads++;
		if (suspDomainsObj[urlDomain].sampleUrls.indexOf(url) == -1) {
			suspDomainsObj[urlDomain].sampleUrls.push(url);
			suspDomainsObj[urlDomain].sampleUrls = suspDomainsObj[urlDomain].sampleUrls.slice(Math.max(suspDomainsObj[urlDomain].sampleUrls.length - 5, 0)); // Only keep the last 5 elements
		}
		let keys = Object.keys(suspDomainsObj);
		let maxKeysToKeep = 15;
		if (keys.length > maxKeysToKeep)  // Only keep the last 100 elements
			for (let i = 0; i < (keys.length - maxKeysToKeep); i++)
				delete (suspDomainsObj[keys[i]]);
		saveVariable('suspDomains', suspDomainsObj);
	}
}

function extractDomain(url) {
	let domain;
	//find & remove protocol (http, ftp, etc.) and get domain
	if (url.indexOf("://") > -1) {
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
		pl = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query = url.slice(url.indexOf('?') + 1); // The query part of the url

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);

	return urlParams;
}

export function parseVersionString(str) {
	if (typeof (str) != 'string') { return false; }
	let x = str.split('.');
	// parse from string or default to 0 if can't parse
	let maj = parseInt(x[0]) || 0;
	let min = parseInt(x[1]) || 0;
	let pat = parseInt(x[2]) || 0;
	return {
		major: maj,
		minor: min,
		patch: pat
	}
}

// returns true if str contains any of patterns in it
function multiMatch(str, patterns) {
	for (let i = 0; i < patterns.length; i++) {
		if (str.indexOf(patterns[i]) > -1) return true;
	}
	return false;
}