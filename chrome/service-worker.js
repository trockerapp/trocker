import {getOpenTrackerList, getClickTrackerList} from './lists.js'
import {parseVersionString, loadVariable, updateBrowserActionButton, updateDeclarativeNetRequestRules} from './tools.js'

console.log('service-worker.js');

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
	const msg = `Navigation blocked to ${e.request.url} on tab ${e.request.tabId}, per rule:`;
	console.log(msg);
	console.log(e.rule)
});

chrome.tabs.onUpdated.addListener(checkTabForTrackedLinks);
async function checkTabForTrackedLinks(tabId, changeInfo, tab) {
	console.log(`Tab change info for ${tabId}`);
	console.log(changeInfo);
}

async function switchTrockerState() {
	if (await loadVariable('trockerEnable') == true) await saveVariable('trockerEnable', false);
	else await saveVariable('trockerEnable', true);

	updateBrowserActionButton();
	updateDeclarativeNetRequestRules();
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
	updateDeclarativeNetRequestRules();
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
