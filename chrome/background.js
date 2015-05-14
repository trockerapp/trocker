function switchNowareState(){
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
	
    // Open updated page in a new tab
	var url = "updated.html";
	chrome.tabs.create({ url: url, active: true});	
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
	} else
      sendResponse({}); // snub them.
});


function handleOnBeforeRequest(details){
  // details.tabId -> the tab that's the origin of request 
  // details.url -> the url of request 
  var shouldBeCanceled = false; // By default we don't block anything
  if (details.url.indexOf('t.yesware.com/t/')>-1) {
    if (loadVariable('trockerEnable')==true){
      shouldBeCanceled = true;
      saveVariable('blockedTrackerLinks', loadVariable('blockedTrackerLinks') + 1); // Stat ++
    } else {
      shouldBeCanceled = false;
  	  saveVariable('allowedTrackerLinks', loadVariable('allowedTrackerLinks') + 1); // Stat ++
    }
	  
	if (details.tabId > -1) { // If the request comes from a tab
	  if ((loadVariable('showTrackerCount')==true) || (loadVariable('exposeLinks')==true)) {
	    chrome.tabs.executeScript(details.tabId, {file: "countTrackers.js"}, function(ret){});
	  }
	}
  }
  return {cancel: shouldBeCanceled}; 
}

chrome.webRequest.onBeforeRequest.addListener(handleOnBeforeRequest, 
  {urls: ["*://t.yesware.com/t/*", "*://*.googleusercontent.com/proxy/*"]},
  ["blocking"]);

