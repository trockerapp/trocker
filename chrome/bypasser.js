import { getClickTrackerList } from './lists.js'
import { findOriginalLink, multiMatch, statPlusPlus } from './tools.js'

let trockerOptions = {};
chrome.runtime.onMessage.addListener(handleMessages);
async function handleMessages(message, sender) {
	// Return early if this message isn't meant for the background script
	if (message.target !== 'content-script') {
		return;
	}
	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case 'loadVariable-result':
			for (const [key, value] of Object.entries(message.data)) {
				if (trockerOptions[key] != value) {
					trockerOptions[key] = value;
				}
			}
			break;
  }
}

let response = chrome.runtime.sendMessage({
  target: 'background', 
  type: "loadVariable",
  keys: ['trockerEnable', 'linkBypassTimeout', 'verbose', 'debug']
});

let bypasserUI = {
  setup: async function () {
    if (bypasserUI.toID) window.clearTimeout(bypasserUI.toID); // To avoid duplicate contdowns on hashchange
    bypasserUI.trackedURL = getTrackedURL();
    var trackedLink = document.querySelector('a#trackedLink');
    trackedLink.href = bypasserUI.trackedURL;
    trackedLink.innerHTML = URLSummary(bypasserUI.trackedURL, 40);
    trackedLink.onclick = function (e) { e.stopPropagation(); e.preventDefault(); bypasserUI.loadTrackedURL(); }

    bypasserUI.redirectURL = bypasserUI.trackedURL;
    var origURL = await findOriginalLink(bypasserUI.trackedURL);
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

    if (trockerOptions.linkBypassTimeout) {
      bypasserUI.cntDown = response.varValue;
    } else {
      bypasserUI.cntDown = 11;
    }
    bypasserUI.updateCountdown();
  },
  updateCountdown: async function () {
    bypasserUI.cntDown--;
    var cntDownSpan = document.querySelector('span#cntdown');
    cntDownSpan.innerHTML = bypasserUI.cntDown;

    if (bypasserUI.cntDown >= 1) {
      bypasserUI.toID = window.setTimeout(bypasserUI.updateCountdown, 1000);
    } else {// Redirect
      // Update Stats
      var clickTrackers = await getClickTrackerList();
      for (var i = 0; i < clickTrackers.length; i++) {
        if (multiMatch(bypasserUI.trackedURL, clickTrackers[i].domains)) {
          if (bypasserUI.trackedURL == bypasserUI.redirectURL) {
            await statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'allowed');
            bypasserUI.loadTrackedURL();
          } else {
            await statPlusPlus('clickTrackerStats', clickTrackers[i].name, 'bypassed');
            window.location.replace(bypasserUI.redirectURL);
          }
          return;
        }
      }
      window.location.replace(bypasserUI.redirectURL); // This shouldn't happen
    }
  },
  loadTrackedURL: function () {
    var url = new URL(bypasserUI.trackedURL);
    // If your expected result is "http://foo.bar/?x=1&y=2&x=42"
    url.searchParams.set('trfcallwmrk', 1);
    window.location.replace(url.href);
    // });
  }

}

window.addEventListener("hashchange", function () {
  bypasserUI.setup();
}, false);
bypasserUI.setup();


function getTrackedURL() {
  let res = document.location.hash.split('#')[1];
  if (!res) {
    res = document.referrer;
  }
  console.log(`Redirected from "${res}"`)
  return res;
}

function URLSummary(url, summaryLen) {
  return url.substr(0, summaryLen) + ((url.length > summaryLen) ? '...' : '');
}