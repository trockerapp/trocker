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
	document.getElementById("blockedOpenTrackers").innerHTML = loadVariable('blockedYWOpenTrackers') + loadVariable('blockedSKOpenTrackers');
	document.getElementById("allowedOpenTrackers").innerHTML = loadVariable('allowedYWOpenTrackers') + loadVariable('allowedSKOpenTrackers');
	document.getElementById("bypassedClickTrackers").innerHTML = loadVariable('bypassedYWClickTrackers');
	document.getElementById("allowedClickTrackers").innerHTML = loadVariable('allowedYWClickTrackers');
	document.getElementById("statsSinceDate").innerHTML = "(Since "+(new Date(loadVariable('statsSinceDate')).toLocaleDateString())+")";
	
	setTimeout(restoreOptions, 5*1000);
}
document.addEventListener('DOMContentLoaded', restoreOptions);