/* Here we want to find all the img tags with a tracker link in the current tab and expose them */
// Example YW target: <img src="https://ci6.googleusercontent.com/proxy/C-ENSN58vhPeLlIsUcFVEmzulIrhDKRHI3gvGPbXJMcDsLeFlwAxNXBzrcAgfkHxrOlM_F1WT11K-XhxjIROZl5keeQD0Uv-_7R54KRtt5t40F6rlvbgdwchmDahbo4til5h7AGetmG3pS9t34dyEmcvb77QiA8MB40a5-p8UV9rsQ=s0-d-e1-ft#https://t.yesware.com/t/9753ac6e46810c884c8c008a53991032923afab3/c01311adc69f53dd4f8cbe6cf718b64b/spacer.gif" style="border:0px;width:0px;min-height:0px" width="0" height="0" class="CToWUd">
// Example SK target: <img src="https://ci4.googleusercontent.com/proxy/AaE-nmOW6Wl6ss-TPJ4rUWZkQuZ9OaR0YGvDDasY5PptQziqrDpf7N_Y4DMnHlo9fEa-z9NfU5-hg9NiHW8NpIfdbc1J56UXR67jEf4cGBFTw2lQCAX47RsHAv4zBTvI-_TA9svdYsKW00lmLhmmxiiorMgmqiIVcbZLls99Y9h8ZykJshQk8PXQh76B9AKdnlQ2uoHiAEJMgVVBLaZiMm027xHzNVIkHAt-zm-dI8_bnUJYSR26duNUhlREjXp9t3xZ-SAWCqgXEw=s0-d-e1-ft#http://t.sidekickopen04.com/e1t/o/5/f18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0?si=5353798341492736&amp;pi=4227e036-57e8-4305-a449-e1239aec2122" style="display:none!important" height="1" width="1" class="CToWUd">
// Example MA target: <img src="https://ci4.googleusercontent.com/proxy/VX7MQFMWtTLgqn_c7QBIJWHGjsnH7lp_xbZOms9SPXXQUJsaZUJTcjKIvfwL5sKbuIIETx9Okk3arH0Z-sjmF96MuuRXOHc1246ROgrRDoy3QJf_6DILPWtTZAXI6hd34jlBEk7Yi7BpLA=s0-d-e1-ft#http://mandrillapp.com/track/open.php?u=30205832&amp;id=623ff9f9f38a45d9845fe0f757d33067" height="1" width="1" class="CToWUd" tracker="true" style="display: none;">
// Example MT target: <img width="0" height="0" src="https://ci5.googleusercontent.com/proxy/c6k7cnJGJV7cGNDyMwXWEJpeSbQtrb5NXbz6v-MfJRUpUISCDoXmxzYAQUg5Tqb4Wulwt2Gx8ChIFM1HHVeGooHBE-zwxlEfKQugiRZ2tDZQ6xwErf0EdUD6SM1W_5K3194=s0-d-e1-ft#https://mailtrack.io/trace/mail/05b5c4fd75690a3b77108e689a10c1182efe5eac.png" class="CToWUd" tracker="true" style="display: none;">



// returns true if str contains any of patterns in it
function multiMatch(str, patterns){
	for (var i = 0; i<patterns.length; i++){
		if (str.indexOf(patterns[i])>-1) return true;
	}
	return false;
}

// Wrap an HTMLElement (wrapper) around each element in an HTMLElement array (elems).
// Usage Example of wrap
/*
var message = document.getElementById('message');
var div = document.createElement('div');
wrap(div, message);
*/
function wrap(wrapper, elms) {
    // Convert `elms` to an array, if necessary.
    if (!elms.length) elms = [elms];
    
    // Loops backwards to prevent having to clone the wrapper on the
    // first element (see `child` below).
    for (var i = elms.length - 1; i >= 0; i--) {
        var child = (i > 0) ? wrapper.cloneNode(true) : wrapper;
        var el    = elms[i];
        
        // Cache the current parent and sibling.
        var parent  = el.parentNode;
        var sibling = el.nextSibling;
        
        // Wrap the element (is automatically removed from its current
        // parent).
        child.appendChild(el);
        
        // If the element had a sibling, insert the wrapper before
        // the sibling to maintain the HTML structure; otherwise, just
        // append it to the parent.
        if (sibling) {
            parent.insertBefore(child, sibling);
        } else {
            parent.appendChild(child);
        }
    }
};

function injectJSScript(elemName, src, elemId, cb){
	var currentElem = document.getElementById(elemId);
	if (currentElem === null) {
	  var j = document.createElement(elemName);
	  j.src = src;
	  j.setAttribute("id", elemId);
	  (document.body || document.head || document.documentElement).appendChild(j);
	}
}

function prepareCSSRules(){
	var styleSheetId = "trexpsdstlsht";
	var currentStyleSheet = document.getElementById(styleSheetId);
	if (currentStyleSheet === null) {
	  var css = document.createElement("style");
	  css.type = "text/css";
	  css.innerHTML += "span.trexpsd:before{position: absolute;content:'';background: url("+chrome.extension.getURL("tl.png")+") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
	  css.innerHTML += "span.trexpsds:before{position: absolute;content:'';background: url("+chrome.extension.getURL("td.png")+") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
	  css.innerHTML += 'span.trexpsd:empty, span.trexpsds:empty, span[title="trexpsdspnelm"]:empty, span[title="trexpsdspnelm"] :not(img){display:none !important;}';
	  css.innerHTML += "a.trexpsdl:hover{cursor: url("+chrome.extension.getURL("tlc.png")+"), auto; !important;}";
	  css.setAttribute("id", styleSheetId);
	  document.body.appendChild(css);
	}
}

function isGmail(){
	return (document.location.host.indexOf("mail.google.com") > -1);
}
function getGmailUI(){
	if (document.location.search.indexOf('view=pt') > -1) return 'print';
	if (document.location.search.indexOf('view=dom') > -1) return 'dom';
	return 'main';
}

var inRefractoryPeriod = false;
var inOptionPersistancePeriod = false;
var trockerOptions = {};
checkAndDoYourDuty = function(){
	if (inRefractoryPeriod) return; // In order to avoid back to back function calls triggered by fake hashchange events
	if (inOptionPersistancePeriod){ // We have recently loaded the options, let's use them
		var trackerCount = countTrackers(trockerOptions);
	} else {
		chrome.extension.sendMessage({method: "loadVariable", key: 'trockerEnable'}, function(response) {
			trockerOptions.trockerEnable = response.varValue;
			//if (trockerOptions.trockerEnable) {
				chrome.extension.sendMessage({method: "loadVariable", key: 'exposeLinks'}, function(response) {
					trockerOptions.exposeTrackers = response.varValue;
					chrome.extension.sendMessage({method: "getTrackerLists"}, function(response) {
						trockerOptions.openTrackers = response.openTrackers;
						trockerOptions.clickTrackers = response.clickTrackers;
						var trackerCount = countTrackers(trockerOptions);
						chrome.extension.sendMessage({method: "reportTrackerCount", value: trackerCount}, function(response) {});
					});
				});
			//}
		});
		inOptionPersistancePeriod = true;
		window.setTimeout(function(){inOptionPersistancePeriod = false;}, 1000);
	}
	inRefractoryPeriod = true;
	window.setTimeout(function(){inRefractoryPeriod = false;}, 90);	
}

function isTiny(img){
	var h = (img.style.height || img.style.minHeight || img.style.maxHeight)?parseInt(img.style.height || img.style.minHeight || img.style.maxHeight):-1;
	if ((img.getAttribute("height")!==null)&&!isNaN(img.height)) h = img.height;
	var w = (img.style.width || img.style.minWidth || img.style.maxWidth)?parseInt(img.style.width || img.style.minWidth || img.style.maxWidth):-1;
	if ((img.getAttribute("width")!==null)&&!isNaN(img.width)) w = img.width;
	
	if ( (w > -1 && h > -1 && (w*h<3) )||(w == -1 && h > -1 && (h<3))||(w > -1 && h == -1 && (w<3) ) ) {
		//console.log('Img detected as tiny because w='+w+', h='+h+' ('+img.src+')');
		return true;
	}
	else return false;	
}

var clean_height_width = function(x){
    if (x !== "") return parseInt(x, 10);
    return -1;
}


countTrackers = function(options){	
	var trackerCount = 0;
	
	var openDomains = []; 
	for (var i=0; i<options.openTrackers.length; i++) openDomains = openDomains.concat(options.openTrackers[i].domains);

	var clickDomains = []; 
	for (var i=0; i<options.clickTrackers.length; i++) clickDomains = clickDomains.concat(options.clickTrackers[i].domains);

	var trackerImages = [];
	if (isGmail()) { // Special Gmail handling
		var gmailProxyURL = "googleusercontent.com/proxy";
		var nonSuspMark = "trnonsuspmrk"; // This will be added to non-suspicious images
		var suspMark = "trsuspmrk"; // This will be added to suspicious images
	
		var gmailUI = getGmailUI();
		
		var emails = [];
		if (gmailUI == 'main') {
			var emails = document.querySelectorAll('.nH.hx .h7'); // Normal view of conversations
		} else if(gmailUI == 'print') {
			var emails = document.getElementsByTagName('body');
		}
		for (var ei = 0; ei < emails.length; ei++){
			var email = emails[ei];
			if (email.getAttribute("trtrckrs") !== null) {trackerCount+=parseInt(email.getAttribute("trtrckrs")); continue;} // Already processed
			var images = [];
			if (gmailUI == 'main'){
				if (email.querySelector('div.ado') !== null ) continue; // When <Images are not displayed>
				var images = email.querySelectorAll('.ii.gt img');
			} else if(gmailUI == 'print'){
				var images = email.querySelectorAll('img');
			}
			var mailTrackers = 0;
			var trackerURLs = [];
			var isKnownTracker = false;
			for (var i = 0; i < images.length; i++)	{ // Loop over all images in the email
				var img = images[i];
				
				if (img.src.indexOf(gmailProxyURL) == -1) continue; // To ignore interface images such as gmail's cleardot.gif
				
				// Check if it is a known tracker
				if (  multiMatch(img.src, openDomains) ) isKnownTracker = true;
				else isKnownTracker = false;
				
				if ( isKnownTracker || isTiny(img) ) {
					trackerCount++;
					if (!isKnownTracker) { // If an unknown tracker
						img.setAttribute("known","0");
					}
					trackerImages.push(img);
					mailTrackers++;
					trackerURLs.push(img.src.split("#")[1]);
					if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+suspMark+'#');
				} else { // Mark non-tracking images
				    if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
				}
			}
			if (mailTrackers > 0 && (gmailUI == 'main')){ // If email has trackers in it
				var trackedSignClass = 'trsgn';
				var trackedSign = email.querySelector('h3.iw img.'+trackedSignClass);
				if ((trackedSign === null) || (trackedSign.length < 1)){
					var trackedSign = document.createElement('img');
					trackedSign.src = chrome.extension.getURL('tracked.png');
					trackedSign.setAttribute("class", trackedSignClass);
					//trackedSign.style.display = 'none';
					trackedSign.height = 12;
					trackedSign.width = 18;
					trackedSign.style.verticalAlign = "0px";
					trackedSign.style.paddingLeft = '6px';
					//trackedSign.style.cursor = 'pointer';
					email.querySelector('h3.iw').appendChild(trackedSign);
					trackedSign.title = 'Tracking Images: ';
					for (var i=0; i<trackerURLs.length; i++) trackedSign.title += '('+(i+1)+') '+trackerURLs[i]+"   ";
				}				
			}
			email.setAttribute("trtrckrs", mailTrackers);
		}
		
		// Deal with compose windows
		var emails = document.querySelectorAll('.M9'); // Compose windows (reply, forward, new messaage)
		for (var ei = 0; ei < emails.length; ei++){
			var email = emails[ei];
			var images = email.querySelectorAll('img');
			// Only Mark the no suspicious images and leave the suspicious one unmarked so that we don't expose them in compose window
			for (var i = 0; i < images.length; i++)	{ // Loop over all images in the email
				var img = images[i];
				// Check if it is a known tracker
				if (  multiMatch(img.src, openDomains) ) isKnownTracker = true;
				else isKnownTracker = false;
				if ( isKnownTracker || isTiny(img) ) {
					// Do nothing
				} else { // Mark non-tracking images
				    if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
				}
			}
		}
	} else { // The general case
		var images = document.getElementsByTagName('img');
		var isKnownTracker = false;
		for (var i = 0; i < images.length; i++)	{
			var img = images[i];
			
			// Check if it is a known tracker
			if (  multiMatch(img.src, openDomains) ) isKnownTracker = true;
			else isKnownTracker = false;
			
			if ( isKnownTracker ) {
				trackerCount++;
				trackerImages.push(img);
			}
		}
	}
	
	if (options.exposeTrackers){
		prepareCSSRules();
		
		for (var i = 0; i < trackerImages.length; i++){
			var img = trackerImages[i];
			// Expose image (wrap the link in a specific span element. Because pseudo elems can't be used with the images themselves.)
			var parent = img.parentNode;
			if ((parent.className != "trexpsd") && (parent.className != "trexpsds") && parent.getAttribute("title") != "trexpsdspnelm") {
				var span = document.createElement('span');
				span.setAttribute("style","border:0px;width:0px;min-height:0px;margin:0 5px;");
				span.setAttribute("width","0");
				span.setAttribute("height","0");
				span.setAttribute("title","trexpsdspnelm"); // We add this because gmail changes classes but looks like it doesn't change titles
				span.setAttribute("class","trexpsd");
				if (img.getAttribute("known") === "0") span.setAttribute("class","trexpsds"); // If unknown tracker
				wrap(span, img);
			} else if (parent.getAttribute("title") == "trexpsdspnelm") { // If already wrapped in an exposer
				parent.setAttribute("class","trexpsd");
				if (img.getAttribute("known") === "0") parent.setAttribute("class","trexpsds"); // If unknown tracker
			}
		}
	}

	// Remove Empty Exposers
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"] :not(img)'); // Unwanted children in exposer spans
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"]:empty'); // Empty exposers
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	
	var trackerLinks = [];
	var links = document.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		//if (isGmail()) { // Special Gmail handling
		//} else { // The general case
			var link = links[i];
			if (  multiMatch(link.href, clickDomains) ) {
				trackerCount++;
				trackerLinks.push(link);
			}
		//}
	}
	
	if (options.exposeTrackers){
		for (var i = 0; i < trackerLinks.length; i++){
			var link = trackerLinks[i];
			// Expose the link
			link.classList.add('trexpsdl');
		}
	}
	
	return trackerCount;
}

window.addEventListener("hashchange", function(){
	//alert('hash changed!');
	//checkAndDoYourDuty();
	window.setTimeout(checkAndDoYourDuty, 20); // To respond a little faster after images are loaded	
}, false);

checkAndDoYourDuty();

if (isGmail()) window.setInterval(checkAndDoYourDuty, 500);
