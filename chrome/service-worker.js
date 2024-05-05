import {getOpenTrackerList, getClickTrackerList} from './lists.js'
import {parseVersionString, loadVariable, updateBrowserActionButton} from './tools.js'

console.log('service-worker.js');

async function switchTrockerState() {
	if (await loadVariable('trockerEnable') == true) await saveVariable('trockerEnable', false);
	else await saveVariable('trockerEnable', true);

	updateBrowserActionButton();
}

function openOptionsPage() {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL('options.html'));
	}
}

chrome.action.onClicked.addListener(openOptionsPage);

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == "update") {
		let newVer = parseVersionString(chrome.runtime.getManifest().version);
		let prevVer = parseVersionString(details.previousVersion);

		if ((prevVer.major <= 1) && (prevVer.minor <= 0) && (prevVer.patch <= 5)) {
			// Migrating from old system of storing stuff
			if (typeof localStorage['dataCache'] === "undefined") {
				if (typeof localStorage["nowareEnable"] !== "undefined") { saveVariable('trockerEnable', ((localStorage["nowareEnable"] === "true") || localStorage.nowareEnable == true)); }
				if (typeof localStorage["exposeLinks"] !== "undefined") { saveVariable('exposeLinks', ((localStorage["exposeLinks"] === "true") || localStorage.exposeLinks == true)); }
				if (!isNaN(f["allowedYeswareLinks"])) { saveVariable('allowedTrackerLinks', parseInt(localStorage["allowedYeswareLinks"])); }
				if (!isNaN(localStorage["blockedYeswareLinks"])) { saveVariable('blockedTrackerLinks', parseInt(localStorage["blockedYeswareLinks"])); }
				if ((typeof localStorage["statsSinceDate"] !== "undefined") && (new Date(localStorage["statsSinceDate"]) != "Invalid Date")) {
					saveVariable('statsSinceDate', new Date(localStorage["statsSinceDate"]));
				}
			}
		}
		if ((prevVer.major <= 1) && (prevVer.minor < 2)) { // Migrate stats to the new form in version 2
			setStat('openTrackerStats', 'YW', 'blocked', loadVariable('blockedYWOpenTrackers'));
			setStat('openTrackerStats', 'YW', 'allowed', loadVariable('allowedYWOpenTrackers'));
		}

		if ((prevVer.major < newVer.major) || (prevVer.minor < newVer.minor)) {
			// Open updated page in a new tab
			let url = "updated.html";
			chrome.tabs.create({ url: url, active: true });
		}
	}

	// Initializations for new installs
	loadVariable('statsSinceDate'); // Attempt to load this so that it will be created if it doesn't exist

	updateBrowserActionButton();
});

chrome.runtime.onMessage.addListener(handleContentScriptMessages);

async function handleContentScriptMessages(message, sender) {
	// Return early if this message isn't meant for the background script
	if (message.target !== 'background') {
		return;
	}
	let tabId = sender.tab.id;
	if (message.type == "loadVariable") {
		let keys = (message.keys) ? message.keys : [message.key];
		let result = {};
		for (const key of keys) {
			result[key] = await loadVariable(key);
		}
		sendMessageToContentScript(tabId, 'loadVariable-result', result);
	} else if (message.type == "saveVariable") {
		let varName = message.key;
		let varValue = message.value;
		varValue = await saveVariable(varName, varValue);
		let result = {};
		result[varName] = varValue;
		sendMessageToContentScript(tabId, 'saveVariable-result', result);
	} else if (message.type == "reportTrackerCount") {
		let trackerCount = message.value;
		if (await loadVariable('showTrackerCount') == true) {
			await updateBrowserActionButton(tabId, trackerCount);
		} else {
			await updateBrowserActionButton(tabId, 0);
		}
	} else if (message.type == "getTrackerLists") {
		sendMessageToContentScript(tabId, 'getTrackerLists-result', { 
			openTrackers: await getOpenTrackerList(), clickTrackers: await getClickTrackerList(), webmails: webmails 
		});
	} else if (message.type == "addLimitedOpenPermission") {
		limitedPermissions.addOpenPermission(message.key);
	}
	return;
}

function sendMessageToContentScript(tabId, type, data) {
	chrome.tabs.sendMessage(tabId,
		{
			type: type,
			target: 'content-script',
			data: data
		}
	);
}

// Webmail image proxy domains we have to listen on
// Gmail Example: https://ci5.googleusercontent.com/proxy/c98MiCwnx8WKJGocCSAHkb-hELC6NR1lEjYmgXearhWHPiAwdbhTHIriCpYAJF38AQ0hW8nU2fpxNpRcfX7WlIO5uQzoqUWv9hLk-tywdbEOkabGvgH83LRQK0cZqzoA_WMkHvFIJ6eF8aDzNAncocBmT48JP_KGGN8KjNaAxrYxtrmp6qx9YNGY__LPXhQs66jEYIgh1cnPrcTG9rQhAYLnAN1Tyi-aNfmFyTb2W0x8fD7jGjuhX-v7YpbAnXtUI2_wY9wowlYD7Q=s0-d-e1-ft#http://t.sidekickopen04.com/e1t/o/5/f18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0?si=5353798341492736&pi=e20e388a-468f-4643-9ab3-9a162c205522
// Outlook Example: https://dub121.mail.live.com/Handlers/ImageProxy.mvc?bicild=&canary=CZchR4mnfhxj7s0LgOeyVm90Hy2KbEDkiuDHIBKoGGU%3d0&url=http%3a%2f%2ft.sidekickopen04.com%2fe1t%2fo%2f5%2ff18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0%3fsi%3d5353798341492736%26pi%3de20e388a-468f-4643-9ab3-9a162c205522

// Handle special webmail requests from webmails that don't always use proxies
let webmails = [
	{
		name: 'google',
		matchUrls: ['://mail.google.com', '://inbox.google.com'],
		whiteList: [],
		whiteListExcept: ['.googleusercontent.com/proxy', '.googleusercontent.com/meips'] // Google's image proxy
	},
	{
		name: 'outlook',
		matchUrls: ['outlook.live.com', 'outlook.office.com'],
		whiteList: ['https://c.live.com/', 'https://c.bing.com/', 'https://outlook.live.com/', 'https://avatar.skype.com',
			'http://c.live.com/', 'http://c.bing.com/', 'http://outlook.live.com/',
			'http://avatar.skype.com', 'msecnd.net/dam/skype/',
			'office365.com', 'office.com', 'storage.live.com', 'cdn.office.net',
			'https://attachment.outlook.live.net', 'https://attachment.outlook.office.com',
			'officeapps.live.com'
		],
		whiteListExcept: []
	},
	{
		name: 'ymail',
		matchUrls: ['mail.yahoo.com'],
		whiteList: [],
		whiteListExcept: ['.yusercontent.com/mail']  // Yahoo's image proxy
	}
];

function findWebmailSource(details) {
	let originUrl = details.initiator || details.documentUrl;
	if (!originUrl) return false;
	for (let i = 0; i < webmails.length; i++) {
		for (let j = 0; j < webmails[i].matchUrls.length; j++) {
			if (originUrl.indexOf(webmails[i].matchUrls[j]) > -1) {
				return webmails[i];
			}
		}
	}
	return false;
}

// let webmailOpenRequestTypes = ["image"];
// chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestNonProxyWebmails, { urls: ["http://*/*", "https://*/*"], types: webmailOpenRequestTypes }, ["blocking"]);
// function handleOnBeforeRequestNonProxyWebmails(details) { // For non-proxy webmails such as outlook
// 	let webmail = findWebmailSource(details);
// 	if (webmail !== false) { // is from webmail

// 		for (let j = 0; j < webmail.whiteList.length; j++) {
// 			if (details.url.indexOf(webmail.whiteList[j]) > -1) return; // Should be allowed 
// 		}
// 		if (webmail.whiteListExcept.length > 0) {
// 			let mustBeChecked = false;
// 			for (let j = 0; j < webmail.whiteListExcept.length; j++) {
// 				if (details.url.indexOf(webmail.whiteListExcept[j]) > -1) {
// 					mustBeChecked = true; // Should be allowed by default
// 					break;
// 				}
// 			}
// 			if (!mustBeChecked) return; // Not in the checklist
// 		}
// 		// Must be checked for explicit non-susp mark from the content script

// 		// Block all images by default, unless they have some trocker mark
// 		let nonSuspMark = "trnonsuspmrk"; // This should be added to non-suspicious images
// 		let suspMark = "trsuspmrk"; // This should be added to suspicious images
// 		let trIgnoreMark = "trfcallwmrk"; // Any previous judgment will be replaced by this when user forces allowing the trackers

// 		let hasNonSuspPattern = (details.url.indexOf(nonSuspMark) > -1);
// 		let hasSuspPattern = (details.url.indexOf(suspMark) > -1);
// 		let hasForceAllowPattern = (details.url.indexOf(trIgnoreMark) > -1);

// 		// hasNonSuspPattern = false;  // ONLY FOR TESTS: Uncomment this to confirm that all email images are blocked by default

// 		// If from Gmail and suspicious, log the suspicious url 
// 		if ((webmail.name === 'google') && hasSuspPattern) logSuspURL(details.url.split("#")[1]); // First remove the google proxy server
// 		if (((webmail.name === 'outlook') || (webmail.name === 'ymail')) && hasSuspPattern) logSuspURL(parseUrlParams(details.url).url); // First remove the outlook/ymail proxy server

// 		let trackerName = "UK"; // For efficiency, don't try to find tracker name, assume unknown

// 		if (loadVariable('trockerEnable') == true && (!hasNonSuspPattern && !hasForceAllowPattern)) {
// 			if (hasSuspPattern) { // A fix to avoid counting first attempt to load non-tracking images from Outlook
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was blocked!');
// 				statPlusPlus('openTrackerStats', trackerName, 'blocked');
// 			}
// 			return { cancel: true };
// 		}

// 		if (hasSuspPattern || hasForceAllowPattern) {
// 			if (!hasForceAllowPattern) {
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was allowed!');
// 			} else {
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was allowed per specific user request!');
// 			}
// 			statPlusPlus('openTrackerStats', trackerName, 'allowed');
// 		}
// 	}
// 	// Don't return anything to leave the request untouched
// }

// // Handle open trackers
// let openTrackers = getOpenTrackerList();
// let openListenDomains = [];
// for (let i = 0; i < openTrackers.length; i++) openListenDomains = openListenDomains.concat(openTrackers[i].domains);
// let openListenPatterns = [];
// for (let i = 0; i < openTrackers.length; i++) openListenPatterns = openListenPatterns.concat(openTrackers[i].patterns);
// let openListenURLs = openListenPatterns;
// for (let i = 0; i < openListenDomains.length; i++) openListenURLs.push("*://" + openListenDomains[i] + "/*");
// let openRequestTypes = ["image", "xmlhttprequest", "other"];
// chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestOpenTracker, { urls: openListenURLs, types: openRequestTypes }, ["blocking"]);

// function handleOnBeforeRequestOpenTracker(details) {

// 	let webmail = findWebmailSource(details);
// 	if (webmail !== false) return; // These webmail requests are handled in the "handleOnBeforeRequestNonProxyWebmails" listener

// 	// details.tabId -> the tab that's the origin of request 
// 	// details.url -> the url of request 

// 	// Gmail Related
// 	let gmailProxyURLs = ["googleusercontent.com/proxy", "googleusercontent.com/meips/"];
// 	let nonSuspMark = "trnonsuspmrk"; // This should be added to non-suspicious images
// 	let suspMark = "trsuspmrk"; // This should be added to suspicious images
// 	let trIgnoreMark = "trfcallwmrk"; // Any previous judgment will be replaced by this when user forces allowing the trackers

// 	let hasNonSuspPattern = (details.url.indexOf(nonSuspMark) > -1);
// 	let hasSuspPattern = (details.url.indexOf(suspMark) > -1);
// 	let hasForceAllowPattern = (details.url.indexOf(trIgnoreMark) > -1);

// 	for (let i = 0; i < openTrackers.length; i++) {
// 		let hasKnownTracker = multiMatch(details.url, openTrackers[i].domains);
// 		let allKnownTrackersChecked = (i == (openTrackers.length - 1));
// 		if (hasKnownTracker || hasSuspPattern) { // If is a known tracker Or is a suspicious image inside a Gmail/Inbox and Outlook email

// 			let trackerName = (hasKnownTracker) ? (openTrackers[i].name) : "UK"; // Unknown tracker

// 			// If you know the tab, run the content script
// 			if ((details.tabId > -1) && (trackerName !== 'GA')) { // If the request comes from a tab (and is not a GA link)
// 				if (((loadVariable('showTrackerCount') == true) || (loadVariable('exposeLinks') == true)) && // And need to expose trackers
// 					(loadVariable('anyPage') == true)) {		// And need to work on any url
// 					chrome.permissions.contains({
// 						permissions: ['tabs'],
// 						origins: ['<all_urls>']
// 					}, (result) => {
// 						if (result) {
// 							// The extension has the permissions.
// 							hasPermission = true;
// 						} else {
// 							// The extension doesn't have the permissions.
// 							hasPermission = false;
// 						}
// 						if (hasPermission) {
// 							chrome.tabs.get(details.tabId, function (tab) {
// 								if ((tab.url.indexOf("://mail.google.com") == -1) && (tab.url.indexOf("://inbox.google.com") == -1) && (tab.url.indexOf("mail.live.com") == -1) && (tab.url.indexOf("outlook.live.com") == -1)) { // Already running in Gmail/Inbox and Outlook
// 									chrome.tabs.executeScript(tab.id, { file: "trocker.js" }, function (ret) { });
// 								}
// 							});
// 						}
// 					});
// 				}
// 			}

// 			if (loadVariable('trockerEnable') == true && !hasForceAllowPattern) {
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was blocked!');
// 				statPlusPlus('openTrackerStats', trackerName, 'blocked');
// 				return { cancel: true };
// 			}

// 			if (!hasForceAllowPattern) {
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was allowed!');
// 			} else {
// 				console.log((new Date()).toLocaleString() + ': A ' + trackerName + ' open tracker ' + details.type + ' request was allowed per specific user request!');
// 			}
// 			statPlusPlus('openTrackerStats', trackerName, 'allowed');
// 			break; // No need to check the rest, break out of the for loop
// 		}
// 	}

// 	// Don't return anything to leave the request untouched
// }

// // Handle click trackers
// let clickTrackers = getClickTrackerList();
// let clickListenDomains = []; // No need for Google's proxy because google doesn't proxy links
// for (let i = 0; i < clickTrackers.length; i++) clickListenDomains = clickListenDomains.concat(clickTrackers[i].domains);
// let clickListenPatterns = [];
// for (let i = 0; i < clickTrackers.length; i++) clickListenPatterns = clickListenPatterns.concat(clickTrackers[i].patterns);
// let clickListenURLs = clickListenPatterns;
// for (let i = 0; i < clickListenDomains.length; i++) clickListenURLs.push("*://" + clickListenDomains[i] + "/*");
// let clickRequestTypes = ["main_frame", "sub_frame", "stylesheet", "script", "object", "xmlhttprequest", "other"];
// chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestClickTracker, { urls: clickListenURLs, types: clickRequestTypes }, ["blocking", "requestBody"]);

// function handleOnBeforeRequestClickTracker(details) {
// 	// details.tabId -> the tab that's the origin of request 
// 	// details.url -> the url of request 
// 	if ((details['requestBody'] === undefined) || (details['requestBody'] === {}) || (details['requestBody'] === null)) { // Don't filter form submits
// 		for (let i = 0; i < clickTrackers.length; i++) {
// 			if (multiMatch(details.url, clickTrackers[i].domains)) {
// 				if (loadVariable('trockerEnable') == true) {
// 					if (!limitedPermissions.hasOpenPermission(details.url)) {
// 						console.log((new Date()).toLocaleString() + ': A ' + openTrackers[i].name + ' click tracker ' + details.type + ' request was redirected!');
// 						let redirectUrl = chrome.runtime.getURL("bypasser.html") + '#' + details.url;
// 						return { redirectUrl: redirectUrl };
// 					} else {
// 						limitedPermissions.removeOpenPermission(details.url);
// 					}
// 				}
// 				console.log((new Date()).toLocaleString() + ': A ' + openTrackers[i].name + ' click tracker ' + details.type + ' request was allowed!');
// 				statPlusPlus('clickTrackerStats', openTrackers[i].name, 'allowed');
// 				break; // No need to check the rest, break out of the for loop
// 			}
// 		}
// 	}

// 	// Don't return anything to leave the request untouched
// }


let limitedPermissions = { // An object that would allow limited, temporary tracked url access (mainly to allow clicking on tracked urls from the bypasser page)
	allowedURLs: [],
	hasOpenPermission: function (url) {
		if (limitedPermissions.allowedURLs.indexOf(url) > -1) return true;
		else return false;
	},
	removeOpenPermission: function (url) {
		while (limitedPermissions.allowedURLs.indexOf(url) > -1) limitedPermissions.allowedURLs.splice(limitedPermissions.allowedURLs.indexOf(url), 1);
	},
	addOpenPermission: function (url) {
		limitedPermissions.allowedURLs.push(url);
	}
};


//chrome.webRequest.handlerBehaviorChanged(); // To make sure that chrome follows our blocking rules