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
	} else
      sendResponse({}); // snub them.
});

// Webmail image proxy domains we have to listen on
// Gmail Example: https://ci5.googleusercontent.com/proxy/c98MiCwnx8WKJGocCSAHkb-hELC6NR1lEjYmgXearhWHPiAwdbhTHIriCpYAJF38AQ0hW8nU2fpxNpRcfX7WlIO5uQzoqUWv9hLk-tywdbEOkabGvgH83LRQK0cZqzoA_WMkHvFIJ6eF8aDzNAncocBmT48JP_KGGN8KjNaAxrYxtrmp6qx9YNGY__LPXhQs66jEYIgh1cnPrcTG9rQhAYLnAN1Tyi-aNfmFyTb2W0x8fD7jGjuhX-v7YpbAnXtUI2_wY9wowlYD7Q=s0-d-e1-ft#http://t.sidekickopen04.com/e1t/o/5/f18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0?si=5353798341492736&pi=e20e388a-468f-4643-9ab3-9a162c205522
// Outlook Example: https://dub121.mail.live.com/Handlers/ImageProxy.mvc?bicild=&canary=CZchR4mnfhxj7s0LgOeyVm90Hy2KbEDkiuDHIBKoGGU%3d0&url=http%3a%2f%2ft.sidekickopen04.com%2fe1t%2fo%2f5%2ff18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0%3fsi%3d5353798341492736%26pi%3de20e388a-468f-4643-9ab3-9a162c205522

var webmailProxyDomains = ["*.googleusercontent.com/proxy", // Google's image proxy
						   "*.mail.live.com/Handlers" // Outlook's image proxy
						   ]; 

						   
// Handle open trackers
var openTrackers = getOpenTrackerList();
var openListenDomains = webmailProxyDomains;
for (var i=0; i<openTrackers.length; i++) openListenDomains = openListenDomains.concat(openTrackers[i].domains);
var openListenURLs = [];
for (var i=0; i<openListenDomains.length; i++) openListenURLs.push("*://"+openListenDomains[i]+"/*");
var openRequestTypes = ["image"];
chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestOpenTracker, {urls: openListenURLs, types: openRequestTypes}, ["blocking"]);

function handleOnBeforeRequestOpenTracker(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  
  for (var i=0; i<openTrackers.length; i++){
	if (multiMatch(details.url, openTrackers[i].domains)){
	  // If you know the tab, run the content script
      if (details.tabId > -1) { // If the request comes from a tab
	    if ((loadVariable('showTrackerCount')==true) || (loadVariable('exposeLinks')==true)) {
	      chrome.tabs.executeScript(details.tabId, {file: "countTrackers.js"}, function(ret){});
	    }
	  }
		
	  if (loadVariable('trockerEnable')==true){
		statPlusPlus('openTrackerStats', openTrackers[i].name, 'blocked');
		return {cancel: true};
	  }
	
	  statPlusPlus('openTrackerStats', openTrackers[i].name, 'allowed');
      break; // No need to check the rest, break out of the for loop
	}
  }

  // Don't return anything to leave the request untouched
}


// Handle click trackers
var clickTrackers = getClickTrackerList();
var clickListenDomains = []; // No need for Google's proxy because google doesn't proxy links
for (var i=0; i<clickTrackers.length; i++) clickListenDomains = clickListenDomains.concat(clickTrackers[i].domains);
var clickListenURLs = [];
for (var i=0; i<clickListenDomains.length; i++) clickListenURLs.push("*://"+clickListenDomains[i]+"/*");
var clickRequestTypes = ["main_frame", "sub_frame", "stylesheet", "script", "object", "xmlhttprequest", "other"];
chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequestClickTracker, {urls: clickListenURLs, types: clickRequestTypes}, ["blocking"]);

function handleOnBeforeRequestClickTracker(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  
  for (var i=0; i<clickTrackers.length; i++){
	if (multiMatch(details.url, clickTrackers[i].domains)){
	  // If you know the tab, run the content script
      if (details.tabId > -1) { // If the request comes from a tab
	    if ((loadVariable('showTrackerCount')==true) || (loadVariable('exposeLinks')==true)) {
	      chrome.tabs.executeScript(details.tabId, {file: "countTrackers.js"}, function(ret){});
	    }
	  }
	  
	  if (loadVariable('trockerEnable')==true){
		if (openTrackers[i].name == 'YW') {
		  var urlParams = parseUrlParams(details.url);
	      var redirectUrl = urlParams['ytl'];
	      statPlusPlus('clickTrackerStats', openTrackers[i].name, 'bypassed');
		  return {redirectUrl: redirectUrl};
		} else if (openTrackers[i].name == 'SK') {
		  var urlParams = parseUrlParams(details.url);
	      var redirectUrl = urlParams['t'];
	      statPlusPlus('clickTrackerStats', openTrackers[i].name, 'bypassed');
		  return {redirectUrl: redirectUrl};
		}
	  }	
	  
	  statPlusPlus('clickTrackerStats', openTrackers[i].name, 'allowed');
	  break; // No need to check the rest, break out of the for loop
	}
  }

  // Don't return anything to leave the request untouched
}








/*

// TO DO:
// Add  toutapp.com, mailtrack.io
var YWOpenDomains = ["t.yesware.com/t"];
var YWClickDomains = ["t.yesware.com/tl"];
var SKDomains = ["t.sigopn01.com", "t.senaluno.com", "t.senaldos.com", "t.senaltres.com", "t.senalquatro.com", "t.senalcinco.com", "t.sigopn02.com", "t.sigopn03.com", "t.sigopn04.com", "t.sigopn05.com", "t.signauxun.com", "t.signauxdeux.com", "t.signauxtrois.com", "t.signauxquatre.com", "t.signauxcinq.com", "t.signauxsix.com", "t.signauxsept.com", "t.signauxhuit.com", "t.signauxdix.com", "t.signauxneuf.com", "t.signaleuna.com", "t.signaledue.com", "t.signaletre.com", "t.signalequattro.com", "t.signalecinque.com", "t.strk01.email", "t.strk02.email", "t.strk03.email", "t.strk04.email", "t.strk05.email", "t.strk06.email", "t.strk07.email", "t.strk08.email", "t.strk09.email", "t.strk10.email", "t.strk11.email", "t.strk12.email", "t.strk13.email", "t.sidekickopen01.com", "t.sidekickopen02.com", "t.sidekickopen03.com", "t.sidekickopen04.com", "t.sidekickopen05.com"];

var listenDomains = ["*.googleusercontent.com/proxy"];
listenDomains = listenDomains.concat(YWOpenDomains);
listenDomains = listenDomains.concat(YWClickDomains);
listenDomains = listenDomains.concat(SKDomains);

//var listenURLs = ["*://t.yesware.com/t/*", "*://t.yesware.com/tl/*", "*://*.googleusercontent.com/proxy/*"];
var listenURLs = [];
for (var i=0; i<listenDomains.length; i++) listenURLs.push("*://"+listenDomains[i]+"/*");



chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequest, {urls: listenURLs}, ["blocking"]);


function handleOnBeforeRequest(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  var shouldBeCanceled = false; // By default we don't block anything
  
  // All urls that we are concerned with
  if ( multiMatch(details.url, YWOpenDomains) ||
       multiMatch(details.url, YWClickDomains) ||
	   multiMatch(details.url, SKDomains) )
	 {
	// If you know the tab, run the content script
    if (details.tabId > -1) { // If the request comes from a tab
	  if ((loadVariable('showTrackerCount')==true) || (loadVariable('exposeLinks')==true)) {
	    chrome.tabs.executeScript(details.tabId, {file: "countTrackers.js"}, function(ret){});
	  }
	}
	
	// SK Email Open Tracker
    if ((details.type == "image") && multiMatch(details.url, SKDomains)) {
      if (loadVariable('trockerEnable')==true){
        shouldBeCanceled = true;
        saveVariable('blockedSKOpenTrackers', loadVariable('blockedSKOpenTrackers') + 1); // Stat ++
      } else {
        shouldBeCanceled = false;
  	    saveVariable('allowedSKOpenTrackers', loadVariable('allowedSKOpenTrackers') + 1); // Stat ++
      }	
    }
	
	
	// YW Email Open Tracker
    if (multiMatch(details.url, YWOpenDomains)) {
      if (loadVariable('trockerEnable')==true){
        shouldBeCanceled = true;
        saveVariable('blockedYWOpenTrackers', loadVariable('blockedYWOpenTrackers') + 1); // Stat ++
      } else {
        shouldBeCanceled = false;
  	    saveVariable('allowedYWOpenTrackers', loadVariable('allowedYWOpenTrackers') + 1); // Stat ++
      }	
    }	
  
    // YW Click Tracker
    if (multiMatch(details.url, YWClickDomains)) {
	  if (loadVariable('trockerEnable')==true){
	    var urlParams = parseUrlParams(details.url);
	    var redirectUrl = urlParams['ytl'];
	    saveVariable('bypassedYWClickTrackers', loadVariable('bypassedYWClickTrackers') + 1); // Stat ++
	    return {redirectUrl: redirectUrl}; 	  
	  } else {
	    shouldBeCanceled = false;	
	    saveVariable('allowedYWClickTrackers', loadVariable('allowedYWClickTrackers') + 1); // Stat ++
	  }
	}
  }
  return {cancel: shouldBeCanceled}; 
}

*/