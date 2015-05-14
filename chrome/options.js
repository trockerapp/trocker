// Saves options to localStorage.
function save_options() {
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
function restore_options() {
	document.getElementById("trockerEnableOpt").checked = loadVariable('trockerEnable');
	document.getElementById("trockerEnableOpt").onchange = save_options;

	document.getElementById("showTrackerCountOpt").checked = loadVariable('showTrackerCount');
	document.getElementById("showTrackerCountOpt").onchange = save_options;

	document.getElementById("exposeLinksOpt").checked = loadVariable('exposeLinks');
	document.getElementById("exposeLinksOpt").onchange = save_options;
	
	// Showing some stats
	document.getElementById("allowedTrackerLinks").innerHTML = loadVariable('allowedTrackerLinks');
	document.getElementById("blockedTrackerLinks").innerHTML = loadVariable('blockedTrackerLinks');
	document.getElementById("statsSinceDate").innerHTML = "(Since "+(new Date(loadVariable('statsSinceDate')).toLocaleDateString())+")";
}
document.addEventListener('DOMContentLoaded', restore_options);