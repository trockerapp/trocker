// Saves options to localStorage.
function saveOptions() {
  saveVariable('trockerEnable', document.getElementById("trockerEnableOpt").checked);
  saveVariable('showTrackerCount', document.getElementById("showTrackerCountOpt").checked);
  saveVariable('exposeLinks', document.getElementById("exposeLinksOpt").checked);
  
  updateBrowserActionButton();
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  status.style.opacity = 100;
  setTimeout(function() {
    status.style.opacity = 0;
  }, 750);
}

// Restores select box state to saved value from cache.
function restoreOptions() {
	document.getElementById("trockerEnableOpt").checked = loadVariable('trockerEnable');
	document.getElementById("trockerEnableOpt").onchange = saveOptions;

	document.getElementById("showTrackerCountOpt").checked = loadVariable('showTrackerCount');
	document.getElementById("showTrackerCountOpt").onchange = saveOptions;

	document.getElementById("exposeLinksOpt").checked = loadVariable('exposeLinks');
	document.getElementById("exposeLinksOpt").onchange = saveOptions;
	
	// Showing some stats
	// Open Tracker Stats
	var allOpenTrackerBlocks = 0;
	var allOpenTrackerAllows = 0;
	var statsObj = loadVariable('openTrackerStats');
	for (var key in statsObj) {
      if (statsObj.hasOwnProperty(key)) {
        var val = statsObj[key];
		if (!isNaN(val['blocked'])) allOpenTrackerBlocks = allOpenTrackerBlocks + val['blocked'];
		if (!isNaN(val['allowed'])) allOpenTrackerAllows = allOpenTrackerAllows + val['allowed'];
      }
    }
	document.getElementById("blockedOpenTrackers").innerHTML = allOpenTrackerBlocks;
	document.getElementById("allowedOpenTrackers").innerHTML = allOpenTrackerAllows;
	// Click Tracker Stats
	var allClickTrackerBypasses = 0;
	var allClickTrackerAllows = 0;
	var statsObj = loadVariable('clickTrackerStats');
	for (var key in statsObj) {
      if (statsObj.hasOwnProperty(key)) {
        var val = statsObj[key];
		if (!isNaN(val['bypassed'])) allClickTrackerBypasses = allClickTrackerBypasses + val['bypassed'];
		if (!isNaN(val['allowed'])) allClickTrackerAllows = allClickTrackerAllows + val['allowed'];
      }
    }
	document.getElementById("bypassedClickTrackers").innerHTML = allClickTrackerBypasses;
	document.getElementById("allowedClickTrackers").innerHTML = allClickTrackerAllows;
	// Stats start date
	document.getElementById("statsSinceDate").innerHTML = "(Since "+(new Date(loadVariable('statsSinceDate')).toLocaleDateString())+")";
	
	setTimeout(restoreOptions, 5*1000); // Update stats every few seconds
}
document.addEventListener('DOMContentLoaded', restoreOptions);