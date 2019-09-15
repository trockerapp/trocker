bypasserUI = {
  setup: function (){
	if (bypasserUI.toID) window.clearTimeout(bypasserUI.toID); // To avoid duplicate contdowns on hashchange
    bypasserUI.trackedURL = getTrackedURL();
    var trackedLink = document.querySelector('a#trackedLink');
    trackedLink.href = bypasserUI.trackedURL;
    trackedLink.innerHTML = URLSummary(bypasserUI.trackedURL, 40);
    trackedLink.onclick = function(e){e.stopPropagation(); e.preventDefault(); bypasserUI.loadTrackedURL();}

    bypasserUI.redirectURL = bypasserUI.trackedURL;
    var origURL = findOriginalLink(bypasserUI.trackedURL);
    if (origURL) {
      bypasserUI.redirectURL = origURL;
      var origLink = document.querySelector('a#origLink');
      origLink.href = origURL;
      origLink.innerHTML = URLSummary(origURL, 40);
  
      document.querySelector('#willbypass').classList.remove('hidden');	
      document.querySelector('#cantbypass').classList.add('hidden');	
    } else {
      document.querySelector('#cantbypass').classList.remove('hidden');
      document.querySelector('#willbypass').classList.add('hidden');
    }
    chrome.runtime.sendMessage({method: "loadVariable", key: 'linkBypassTimeout'}, function(response) {
      if (response) {
        bypasserUI.cntDown = response.varValue;
      } else {
        bypasserUI.cntDown = 11;
      }
      bypasserUI.updateCountdown();
    });
  },
  updateCountdown: function (){
    bypasserUI.cntDown--;
    var cntDownSpan = document.querySelector('span#cntdown');
    cntDownSpan.innerHTML = bypasserUI.cntDown;
    
    if (bypasserUI.cntDown >= 1) {
	  bypasserUI.toID = window.setTimeout(bypasserUI.updateCountdown, 1000);
    } else {// Redirect
      // Update Stats
      var clickTrackers = getClickTrackerList();
      for (var i=0; i<clickTrackers.length; i++) {
	    if (multiMatch(bypasserUI.trackedURL, clickTrackers[i].domains)) {
	      if (bypasserUI.trackedURL == bypasserUI.redirectURL) {
	        statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'allowed');
		    bypasserUI.loadTrackedURL();
	      } else {
		    statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'bypassed');
		    window.location.replace(bypasserUI.redirectURL);
 	      }
		  return;
	    }
      }
	  window.location.replace(bypasserUI.redirectURL); // This shouldn't happen
    }	
  },
  loadTrackedURL: function (){
	chrome.runtime.sendMessage({method: "addLimitedOpenPermission", key: bypasserUI.trackedURL}, function() {
	  window.location.replace(bypasserUI.trackedURL);
	});
  }

}

window.addEventListener("hashchange", function(){
	bypasserUI.setup();
}, false);
bypasserUI.setup();


function getTrackedURL(){
  return document.location.hash.split('#')[1];
}

function URLSummary(url, summaryLen){
	return url.substr(0,summaryLen)+((url.length > summaryLen)?'...':'');
}