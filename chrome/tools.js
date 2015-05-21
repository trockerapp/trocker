function setBrowserActions(options) {
	var iconCallback = function() {
		if (chrome.runtime.lastError) {
			return;
		}
		if (options.tabId===undefined) {
			chrome.browserAction.setBadgeText({text: options.badgeText});
		} else {
			chrome.browserAction.setBadgeText({text: options.badgeText, tabId: options.tabId});
		}
		chrome.browserAction.setBadgeBackgroundColor({ color: options.color });
	};
	chrome.browserAction.setIcon({ path: options.iconPaths }, iconCallback);
	//chrome.browserAction.setIcon({ tabId: options.tabId, path: options.iconPaths }, iconCallback);
}

function updateBrowserActionButton(tabId, trackerCount){
  var browserActionOptions = {
    tabId: tabId,
  }

  if (loadVariable('trockerEnable')==true) {
	browserActionOptions.iconPaths = "trocker.png";
	browserActionOptions.color = [208, 0, 24, 255];
  } else {
	browserActionOptions.iconPaths = "trockerbw.png";
	browserActionOptions.color = [190, 190, 190, 230];
  }
  browserActionOptions.badgeText = '';
  if (trackerCount>0) browserActionOptions.badgeText = (trackerCount).toString();	
  setBrowserActions(browserActionOptions);
}


function loadObjectFromCache(objName){
	var dataCache = JSON.parse(localStorage['dataCache']);
	return dataCache[objName];
}

function cacheObject(objName, obj){
	var dataCache = JSON.parse(localStorage['dataCache']);
	dataCache[objName] = obj;
	localStorage['dataCache'] = JSON.stringify(dataCache);
}

function loadVariable(varName){
	if (typeof localStorage['dataCache'] === "undefined") { localStorage['dataCache'] = JSON.stringify({}); }
	
	varValue = loadObjectFromCache(varName);
	
	// If variable is not valid or not defined, return and save the default value
	if ((varName == 'trockerEnable') && (varValue === undefined)) { varValue = true; cacheObject(varName, varValue); }
	if ((varName == 'showTrackerCount') && (varValue === undefined)) { varValue = true; cacheObject(varName, varValue); }
	if ((varName == 'exposeLinks') && (varValue === undefined)) { varValue = false; cacheObject(varName, varValue); }
	if ((varName == 'allowedTrackerLinks') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'blockedTrackerLinks') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'allowedYWOpenTrackers') && isNaN(varValue)) { varValue = loadVariable('allowedTrackerLinks'); cacheObject(varName, varValue); }
	if ((varName == 'blockedYWOpenTrackers') && isNaN(varValue)) { varValue = loadVariable('blockedTrackerLinks'); cacheObject(varName, varValue); }
	if ((varName == 'allowedSKOpenTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'blockedSKOpenTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'allowedYWClickTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'bypassedYWClickTrackers') && isNaN(varValue)) { varValue = 0; cacheObject(varName, varValue); }
	if ((varName == 'openTrackerStats') && (varValue === undefined)) { varValue = {}; cacheObject(varName, varValue); }
	if ((varName == 'clickTrackerStats') && (varValue === undefined)) { varValue = {}; cacheObject(varName, varValue); }
	if ((varName == 'statsSinceDate') && ((varValue === undefined) || (new Date(varValue) == "Invalid Date"))) { varValue = new Date(); cacheObject(varName, varValue); }
	
	return varValue;
}

function saveVariable(varName, varValue){
	loadVariable(varName); // This make sure dataCache exists
	cacheObject(varName, varValue);
	return loadVariable(varName);
}


function getStat(statObjName, statName, fieldName){
	var statObj = loadVariable(statObjName); 
	if (statObj[statName] === undefined) statObj[statName] = {};
	if (isNaN(statObj[statName][fieldName])) statObj[statName][fieldName] = 0;
	return statObj[statName][fieldName];
}

function setStat(statObjName, statName, fieldName, fieldValue){
	getStat(statObjName, statName, fieldName); // Make sure stat exists
	var statObj = loadVariable(statObjName); 
	statObj[statName][fieldName] = fieldValue;
	saveVariable(statObjName, statObj);
}

function statPlusPlus(statObjName, statName, fieldName){
	setStat(statObjName, statName, fieldName, getStat(statObjName, statName, fieldName) + 1);
}

function parseUrlParams(url){
  var match,
	  pl     = /\+/g,  // Regex for replacing addition symbol with a space
	  search = /([^&=]+)=?([^&]*)/g,
	  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	  query  = url.slice(url.indexOf('?') + 1); // The query part of the url

  urlParams = {};
  while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);

  return urlParams;
}

function parseVersionString(str) {
    if (typeof(str) != 'string') { return false; }
    var x = str.split('.');
    // parse from string or default to 0 if can't parse
    var maj = parseInt(x[0]) || 0;
    var min = parseInt(x[1]) || 0;
    var pat = parseInt(x[2]) || 0;
    return {
        major: maj,
        minor: min,
        patch: pat
    }
}

// returns true if str contains any of patterns in it
function multiMatch(str, patterns){
	for (var i = 0; i<patterns.length; i++){
		if (str.indexOf(patterns[i])>-1) return true;
	}
	return false;
}