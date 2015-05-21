var trackedURL = document.location.hash.split('#')[1];
var trackedLink = document.querySelector('a#trackedLink');
trackedLink.href = trackedURL;
trackedLink.innerHTML = URLSummary(trackedURL, 40);
trackedLink.onclick = loadTrackedURL;

var redirectURL = trackedURL;
var origURL = findOriginalLink(trackedURL);
if (origURL) {
  redirectURL = origURL;
  var origLink = document.querySelector('a#origLink');
  origLink.href = origURL;
  origLink.innerHTML = URLSummary(origURL, 40);
  
  document.querySelector('#willbypass').classList.remove('hidden');	
} else {
  document.querySelector('#cantbypass').classList.remove('hidden');
}

var cntDown = 10;
function updateCountdown(){
  var cntDownSpan = document.querySelector('span#cntdown');
  cntDownSpan.innerHTML = cntDown;
  cntDown--;
  
  if (cntDown >= 1) {
	window.setTimeout(updateCountdown, 1000);
  } else {// Redirect
    // Update Stats
    var clickTrackers = getClickTrackerList();
    for (var i=0; i<clickTrackers.length; i++) {
	  if (multiMatch(trackedURL, clickTrackers[i].domains)) {
	    if (trackedURL == redirectURL) {
	      statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'allowed');
		  loadTrackedURL();
	    } else {
		  statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'bypassed');
		  window.location.replace(redirectURL);
 	    }
		return;
	  }
    }
	window.location.replace(redirectURL); // This shouldn't happen
  }	
}
updateCountdown();

function loadTrackedURL(){
	chrome.extension.sendMessage({method: "addLimitedOpenPermission", key: trackedURL}, function() {
	  window.location.replace(trackedURL);
	});
}

function URLSummary(url, summaryLen){
	return url.substr(0,summaryLen)+((url.length > summaryLen)?'...':'');
}