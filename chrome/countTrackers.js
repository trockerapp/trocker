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

var inRefractoryPeriod = false;
checkAndDoYourDuty = function(){
	if (inRefractoryPeriod) return; // In order to avoid back to back function calls triggered by fake hashchange events
	chrome.extension.sendMessage({method: "loadVariable", key: 'trockerEnable'}, function(response) {
		var trockerEnable = response.varValue;
		//if (trockerEnable) {
			chrome.extension.sendMessage({method: "loadVariable", key: 'exposeLinks'}, function(response) {
				var exposeTrackers = response.varValue;
				chrome.extension.sendMessage({method: "getTrackerLists"}, function(response) {
					var trackerCount = countTrackers({exposeTrackers: exposeTrackers, openTrackers: response.openTrackers, clickTrackers: response.clickTrackers});				
					chrome.extension.sendMessage({method: "reportTrackerCount", value: trackerCount}, function(response) {});
				});
			});
		//}
	});
	inRefractoryPeriod = true;
	window.setTimeout(function(){inRefractoryPeriod = false;}, 1000);
}


countTrackers = function(options){
	prepareCSSRules();

	var trackerCount = 0;
	
	var openTrackers = options.openTrackers;
	var openDomains = []; 
	for (var i=0; i<openTrackers.length; i++) openDomains = openDomains.concat(openTrackers[i].domains);

	var clickTrackers = options.clickTrackers;
	var clickDomains = []; 
	for (var i=0; i<clickTrackers.length; i++) clickDomains = clickDomains.concat(clickTrackers[i].domains);

	
	var images = document.getElementsByTagName('img');
	var isTracker = false;
	var isTiny = false;
	for (var i = 0; i < images.length; i++)	{
		var img = images[i];
		
		// Check if it is a known tracker
		if (  multiMatch(img.src, openDomains) ) isTracker = true;
		else isTracker = false;
		
		// Any 1x1 or smaller image is suspicious, let's expose them
		// We might not be blocking them...
		//if (img.naturalWidth <= 1 && img.naturalHeight <= 1) isTiny = true;
		//else isTiny = false;
        
		if ( isTracker || isTiny ) {
			trackerCount++;
			if (options.exposeTrackers){
				// Expose image (wrap the link in a specific span element. Because pseudo elems can't be used with the images themselves.)
				var parent = img.parentNode;
				if ((parent.className != "trexpsd") && (parent.className != "trexpsds") && parent.getAttribute("title") != "trexpsdspnelm") {
					var span = document.createElement('span');
					span.setAttribute("style","border:0px;width:0px;min-height:0px;margin:0 5px;");
					span.setAttribute("width","0");
					span.setAttribute("height","0");
					span.setAttribute("title","trexpsdspnelm"); // We add this because gmail changes classes but looks like it doesn't change titles
					span.setAttribute("class","trexpsd");
					//if (isTiny && !isTracker) span.setAttribute("class","trexpsds"); // If unknown tracker but suspicious
					wrap(span, img);
				} else if (parent.getAttribute("title") == "trexpsdspnelm") { // If already wrapped in an exposer
					parent.setAttribute("class","trexpsd");
					//if (isTiny && !isTracker) span.setAttribute("class","trexpsds"); // If unknown tracker but suspicious
				}
			}
		}
	}
	// Remove Empty Exposers
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"] :not(img)'); // Unwanted children in exposer spans
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"]:empty'); // Empty exposers
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	
	var links = document.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		var link = links[i];
		if (  multiMatch(link.href, clickDomains) ) {
			trackerCount++;
			if (options.exposeTrackers){
				// Expose links
				link.classList.add('trexpsdl');
			}
		}
	}
	
	return trackerCount;
}

window.addEventListener("hashchange", function(){
	//alert('hash changed!');
	checkAndDoYourDuty();
}, false);

checkAndDoYourDuty();