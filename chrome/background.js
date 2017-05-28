function switchTrockerState(){
  if (loadVariable('trockerEnable')==true) saveVariable('trockerEnable', false);
  else saveVariable('trockerEnable', true);

  updateBrowserActionButton();
}

function openOptionsPage(){
  var chromeVersionFull = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
  var chromeVersion = parseInt(/([0-9]+)/.exec(chromeVersionFull)[0]);
  if (chromeVersion >= 42) 
	var url = 'chrome://extensions/?options=' + chrome.runtime.id;
  else
	var url = "options.html";
  
  chrome.tabs.query({url: url}, function(matchingTabs){
	if (matchingTabs.length < 1)
	  chrome.tabs.create({ url: url, active: true});
	else {
	  var tabId = matchingTabs[0].id;
	  chrome.tabs.update(tabId, {active: true});
	}
  });	
}

chrome.browserAction.onClicked.addListener(openOptionsPage);

chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == "update"){
	var newVer = parseVersionString(chrome.runtime.getManifest().version);
	var prevVer = parseVersionString(details.previousVersion);
	
	if ((prevVer.major <= 1) && (prevVer.minor<=0) && (prevVer.patch<=5)) {
	  // Migrating from old system of storing stuff
      if (typeof localStorage['dataCache'] === "undefined") { 
	    if (typeof localStorage["nowareEnable"] !== "undefined") { saveVariable('trockerEnable', ((localStorage["nowareEnable"] === "true") || localStorage.nowareEnable==true) ); }
	    if (typeof localStorage["exposeLinks"] !== "undefined") { saveVariable('exposeLinks', ((localStorage["exposeLinks"] === "true") || localStorage.exposeLinks==true) ); }
	    if (!isNaN(localStorage["allowedYeswareLinks"])) { saveVariable('allowedTrackerLinks', parseInt(localStorage["allowedYeswareLinks"])); }
	    if (!isNaN(localStorage["blockedYeswareLinks"])) { saveVariable('blockedTrackerLinks', parseInt(localStorage["blockedYeswareLinks"])); }
	    if ((typeof localStorage["statsSinceDate"] !== "undefined")&&(new Date(localStorage["statsSinceDate"]) != "Invalid Date")) {
  	      saveVariable('statsSinceDate', new Date(localStorage["statsSinceDate"]) );
	    }
      }
	}
	if ((prevVer.major <= 1) && (prevVer.minor<2)) { // Migrate stats to the new form in version 2
		setStat('openTrackerStats', 'YW', 'blocked', loadVariable('blockedYWOpenTrackers'));
		setStat('openTrackerStats', 'YW', 'allowed', loadVariable('allowedYWOpenTrackers'));
	}
	
	if ((prevVer.major < newVer.major) || (prevVer.minor < newVer.minor)) {
      // Open updated page in a new tab
	  var url = "updated.html";
	  chrome.tabs.create({ url: url, active: true});	
	}
  }
  
  // Initializations for new installs
  loadVariable('statsSinceDate'); // Atempt to load this so that it will be created if it doesn't exist
  
  updateBrowserActionButton();
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "loadVariable") {
		var varName = request.key;
		var varValue = loadVariable(varName);
    	sendResponse({varName: varName, varValue: varValue});
	} else if (request.method == "saveVariable") {
		var varName = request.key;
		var varValue = request.value;
		varValue = saveVariable(varName, varValue);
		sendResponse({varName: varName, varValue: varValue});
	} else if (request.method == "reportTrackerCount") {
		var trackerCount = request.value;
		var tabId = sender.tab.id;		  
		if (loadVariable('showTrackerCount')==true){
		  updateBrowserActionButton(tabId, trackerCount);
		} else {
		  updateBrowserActionButton(tabId, 0);
		}
	} else if (request.method == "getTrackerLists") {
		sendResponse({openTrackers: getOpenTrackerList(), clickTrackers: getClickTrackerList()});
	} else if (request.method == "addLimitedOpenPermission") {
		limitedPermissions.addOpenPermission(request.key);
		sendResponse({}); 
	} else
      sendResponse({}); // snub them.
});

// Webmail image proxy domains we have to listen on
// Gmail Example: https://ci5.googleusercontent.com/proxy/c98MiCwnx8WKJGocCSAHkb-hELC6NR1lEjYmgXearhWHPiAwdbhTHIriCpYAJF38AQ0hW8nU2fpxNpRcfX7WlIO5uQzoqUWv9hLk-tywdbEOkabGvgH83LRQK0cZqzoA_WMkHvFIJ6eF8aDzNAncocBmT48JP_KGGN8KjNaAxrYxtrmp6qx9YNGY__LPXhQs66jEYIgh1cnPrcTG9rQhAYLnAN1Tyi-aNfmFyTb2W0x8fD7jGjuhX-v7YpbAnXtUI2_wY9wowlYD7Q=s0-d-e1-ft#http://t.sidekickopen04.com/e1t/o/5/f18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0?si=5353798341492736&pi=e20e388a-468f-4643-9ab3-9a162c205522
// Outlook Example: https://dub121.mail.live.com/Handlers/ImageProxy.mvc?bicild=&canary=CZchR4mnfhxj7s0LgOeyVm90Hy2KbEDkiuDHIBKoGGU%3d0&url=http%3a%2f%2ft.sidekickopen04.com%2fe1t%2fo%2f5%2ff18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0%3fsi%3d5353798341492736%26pi%3de20e388a-468f-4643-9ab3-9a162c205522

var webmailProxyDomains = [
	"*.googleusercontent.com/proxy", // Google's image proxy
	"*.mail.live.com/Handlers" // Outlook's image proxy
]; 

// Handle open trackers
var openTrackers = getOpenTrackerList();
var openListenDomains = webmailProxyDomains;
for (var i=0; i<openTrackers.length; i++) openListenDomains = openListenDomains.concat(openTrackers[i].domains);
var openListenPatterns = [];
for (var i=0; i<openTrackers.length; i++) openListenPatterns = openListenPatterns.concat(openTrackers[i].patterns);
openListenURLs = openListenPatterns;
for (var i=0; i<openListenDomains.length; i++) openListenURLs.push("*://"+openListenDomains[i]+"/*");
var openRequestTypes = ["image", "xmlhttprequest", "other"]; 
chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestOpenTracker, {urls: openListenURLs, types: openRequestTypes}, ["blocking"]);

function handleOnBeforeRequestOpenTracker(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  
  // Gmail Related
  var gmailProxyURL = "googleusercontent.com/proxy";
  var nonSuspMark = "trnonsuspmrk"; // This should be added to non-suspicious images
  var suspMark = "trsuspmrk"; // This should be added to suspicious images
  var fromGmail = (details.url.indexOf(gmailProxyURL) > -1);
  var hasNonSuspPattern = (details.url.indexOf(nonSuspMark) > -1);
  var hasSuspPattern = (details.url.indexOf(suspMark) > -1);
  
  var outlookProxyURL = "mail.live.com/Handlers";
  var outlookProxyURL2 = "outlook.live.com/Handlers";
  var fromOutlook = (details.url.indexOf(outlookProxyURL) > -1)||(details.url.indexOf(outlookProxyURL2) > -1);
  
  /*
  if (fromOutlook && (details.url.indexOf('&url=')>-1)) 
	  details.url = parseUrlParams(details.url).url; // Make things easy in case of Outlook
  */
  
  for (var i=0; i<openTrackers.length; i++){
		var hasKnownTracker = multiMatch(details.url, openTrackers[i].domains);
		var allKnownTrackersChecked = (i==(openTrackers.length-1));
		if (  hasKnownTracker || hasSuspPattern || (allKnownTrackersChecked && (fromGmail||fromOutlook) && !hasNonSuspPattern)) { // If is a known tracker Or is a suspicious image inside a Gmail/Inbox and Outlook email
			// If you know the tab, run the content script
				if (details.tabId > -1) { // If the request comes from a tab
				if ((loadVariable('showTrackerCount')==true) || (loadVariable('exposeLinks')==true)) {
					chrome.tabs.get(details.tabId, function(tab){
				if ((tab.url.indexOf("://mail.google.com") == -1)&&(tab.url.indexOf("://inbox.google.com") == -1)&&(tab.url.indexOf("mail.live.com") == -1)&&(tab.url.indexOf("outlook.live.com") == -1)) // Already running in Gmail/Inbox and Outlook
						chrome.tabs.executeScript(tab.id, {file: "trocker.js"}, function(ret){});
				});	      
				}
			}
			
			// If from Gmail and suspicious, log the suspicious url 
			if (fromGmail && hasSuspPattern) logSuspURL(details.url.split("#")[1]); // First remove the gmail proxy server
			if (fromOutlook && hasSuspPattern) logSuspURL(parseUrlParams(details.url).url); // First remove the outlook proxy server
			
			if (hasKnownTracker) var trackerName = openTrackers[i].name;
			else var trackerName = "UK"; // Unknown tracker
			
			if (loadVariable('trockerEnable')==true){
				if (!(fromGmail||fromOutlook) || hasSuspPattern){ // A fix to avoid counting first attempt to load non-tracking images from Gmail/Inbox and Outlook
						console.log((new Date()).toLocaleString() +': A '+trackerName+' open tracker '+details.type+' request was blocked!');
					statPlusPlus('openTrackerStats', trackerName, 'blocked');
				}
				return {cancel: true};
			}
			
			if (!(fromGmail||fromOutlook) || hasSuspPattern){ // A fix to avoid counting first attempt to load non-tracking images from Gmail/Inbox and Outlook
				console.log((new Date()).toLocaleString() + ': A '+trackerName+' open tracker '+details.type+' request was allowed!');
				statPlusPlus('openTrackerStats', trackerName, 'allowed');
			}
				break; // No need to check the rest, break out of the for loop
		}    
  }

  // Don't return anything to leave the request untouched
}


// Handle click trackers
var clickTrackers = getClickTrackerList();
var clickListenDomains = []; // No need for Google's proxy because google doesn't proxy links
for (var i=0; i<clickTrackers.length; i++) clickListenDomains = clickListenDomains.concat(clickTrackers[i].domains);
var clickListenPatterns = [];
for (var i=0; i<clickTrackers.length; i++) clickListenPatterns = clickListenPatterns.concat(clickTrackers[i].patterns);
var clickListenURLs = clickListenPatterns;
for (var i=0; i<clickListenDomains.length; i++) clickListenURLs.push("*://"+clickListenDomains[i]+"/*");
var clickRequestTypes = ["main_frame", "sub_frame", "stylesheet", "script", "object", "xmlhttprequest", "other"];
chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestClickTracker, {urls: clickListenURLs, types: clickRequestTypes}, ["blocking", "requestBody"]);

function handleOnBeforeRequestClickTracker(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  if ((details['requestBody'] === undefined)||(details['requestBody'] ==={})) { // Don't filter form submits
    for (var i=0; i<clickTrackers.length; i++){
	  if (multiMatch(details.url, clickTrackers[i].domains)){
	    if (loadVariable('trockerEnable')==true){
		  if (!limitedPermissions.hasOpenPermission(details.url)) {
			console.log((new Date()).toLocaleString() + ': A '+openTrackers[i].name+' click tracker '+details.type+' request was redirected!');
	        var redirectUrl = chrome.extension.getURL("bypasser.html")+'#'+details.url;
		    return {redirectUrl: redirectUrl};
		  } else {
		    limitedPermissions.removeOpenPermission(details.url);
		  }
	    }	 
		console.log((new Date()).toLocaleString() + ': A '+openTrackers[i].name+' click tracker '+details.type+' request was allowed!');		
	    statPlusPlus('clickTrackerStats', openTrackers[i].name, 'allowed');
	    break; // No need to check the rest, break out of the for loop
	  }
	}
  }

  // Don't return anything to leave the request untouched
}


limitedPermissions = { // An object that would allow limited, temporary tracked url access (mainly to allow clicking on tracked urls from the bypasser page)
  allowedURLs: [],
  hasOpenPermission: function(url){
	if (limitedPermissions.allowedURLs.indexOf(url) > -1) return true;
	else return false;
  },
  removeOpenPermission: function(url){
	while (limitedPermissions.allowedURLs.indexOf(url) > -1) limitedPermissions.allowedURLs.splice(limitedPermissions.allowedURLs.indexOf(url), 1);
  },
  addOpenPermission: function(url){
	limitedPermissions.allowedURLs.push(url);
  }
};


//chrome.webRequest.handlerBehaviorChanged(); // To make sure that chrome follows our blocking rules