/* Here we want to find all the img tags with yesware link in the current tab and expose them */
// Example YW target: <img src="https://ci6.googleusercontent.com/proxy/C-ENSN58vhPeLlIsUcFVEmzulIrhDKRHI3gvGPbXJMcDsLeFlwAxNXBzrcAgfkHxrOlM_F1WT11K-XhxjIROZl5keeQD0Uv-_7R54KRtt5t40F6rlvbgdwchmDahbo4til5h7AGetmG3pS9t34dyEmcvb77QiA8MB40a5-p8UV9rsQ=s0-d-e1-ft#https://t.yesware.com/t/9753ac6e46810c884c8c008a53991032923afab3/c01311adc69f53dd4f8cbe6cf718b64b/spacer.gif" style="border:0px;width:0px;min-height:0px" width="0" height="0" class="CToWUd">
// Example SK target: <img src="https://ci4.googleusercontent.com/proxy/AaE-nmOW6Wl6ss-TPJ4rUWZkQuZ9OaR0YGvDDasY5PptQziqrDpf7N_Y4DMnHlo9fEa-z9NfU5-hg9NiHW8NpIfdbc1J56UXR67jEf4cGBFTw2lQCAX47RsHAv4zBTvI-_TA9svdYsKW00lmLhmmxiiorMgmqiIVcbZLls99Y9h8ZykJshQk8PXQh76B9AKdnlQ2uoHiAEJMgVVBLaZiMm027xHzNVIkHAt-zm-dI8_bnUJYSR26duNUhlREjXp9t3xZ-SAWCqgXEw=s0-d-e1-ft#http://t.sidekickopen04.com/e1t/o/5/f18dQhb0S7ks8dDMPbW2n0x6l2B9gXrN7sKj6v5dwdFW7gs8107d-cvzW5vws_W3LvrVvW6fVgD81k1H6H0?si=5353798341492736&amp;pi=4227e036-57e8-4305-a449-e1239aec2122" style="display:none!important" height="1" width="1" class="CToWUd">


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



var inRefractoryPeriod = false;
checkAndDoYourDuty = function(){
	if (inRefractoryPeriod) return; // In order to avoid back to back function calls triggered by fake hashchange events
	chrome.extension.sendMessage({method: "loadVariable", key: 'trockerEnable'}, function(response) {
		var trockerEnable = response.varValue;
		//if (trockerEnable) {
			chrome.extension.sendMessage({method: "loadVariable", key: 'exposeLinks'}, function(response) {
				var exposeLinks = response.varValue;
				var trackerCount = countTrackers({exposeLinks: exposeLinks});				
				chrome.extension.sendMessage({method: "reportTrackerCount", value: trackerCount}, function(response) {});
			});
		//}
	});
	inRefractoryPeriod = true;
	window.setTimeout(function(){inRefractoryPeriod = false;}, 1000);
}


countTrackers = function(options){
	var trackerCount = 0;
	
	var YWOpenDomains = ["t.yesware.com/t"];
	var YWClickDomains = ["t.yesware.com/tl"];
	var SKDomains = ["t.sigopn01.com", "t.senaluno.com", "t.senaldos.com", "t.senaltres.com", "t.senalquatro.com", "t.senalcinco.com", "t.sigopn02.com", "t.sigopn03.com", "t.sigopn04.com", "t.sigopn05.com", "t.signauxun.com", "t.signauxdeux.com", "t.signauxtrois.com", "t.signauxquatre.com", "t.signauxcinq.com", "t.signauxsix.com", "t.signauxsept.com", "t.signauxhuit.com", "t.signauxdix.com", "t.signauxneuf.com", "t.signaleuna.com", "t.signaledue.com", "t.signaletre.com", "t.signalequattro.com", "t.signalecinque.com", "t.strk01.email", "t.strk02.email", "t.strk03.email", "t.strk04.email", "t.strk05.email", "t.strk06.email", "t.strk07.email", "t.strk08.email", "t.strk09.email", "t.strk10.email", "t.strk11.email", "t.strk12.email", "t.strk13.email", "t.sidekickopen01.com", "t.sidekickopen02.com", "t.sidekickopen03.com", "t.sidekickopen04.com", "t.sidekickopen05.com"];
	
	var openDomains = YWOpenDomains.concat(SKDomains);
	var clickDomains = YWOpenDomains.concat(YWClickDomains);

	var images = document.getElementsByTagName('img');
	for (var i = 0; i < images.length; i++)
	{
		var img = images[i];
		if (  multiMatch(img.src, openDomains) ) {
			trackerCount++;
			if (options.exposeLinks){
				// Expose links
				var parent = img.parentNode;
				if ((parent.className != "trexpsd") && (parent.className != "trexpsds") && parent.getAttribute("title") != "trexpsdspnelm") {
					var span = document.createElement('span');
					//span.style.cssText="border:0px;width:0px;min-height:0px;margin:0 5px;";
					span.setAttribute("style","border:0px;width:0px;min-height:0px;margin:0 5px;");
					span.setAttribute("width","0");
					span.setAttribute("height","0");
					span.setAttribute("title","trexpsdspnelm");
					if (img.src.indexOf('https://t.yesware.com/t/')>-1) {
						//img.className += " trexpsds";
						//img.classList.add("trexpsds");
						span.setAttribute("class","trexpsds");
						//span.className = "trexpsds";
					} else {
						//img.className += " trexpsd";
						//img.classList.add("trexpsd");
						span.setAttribute("class","trexpsd");
						//span.className = "trexpsd";
					}
					wrap(span, img);
				} else if (parent.getAttribute("title") == "trexpsdspnelm") {
					if (img.src.indexOf('http://t.yesware.com/t/')>-1) {
						parent.setAttribute("class","trexpsd");
					} else {
						parent.setAttribute("class","trexpsds");
					}
				}
			}
		}
	}
	
	var links = document.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++)
	{
		var link = links[i];
		if (  multiMatch(link.href, clickDomains) ) {
			trackerCount++;
			if (options.exposeLinks){
				// Expose links
				
			}
		}
	}
	
	return trackerCount;
}

prepareCSSRules();
window.addEventListener("hashchange", function(){
	//alert('hash changed!');
	checkAndDoYourDuty();
}, false);

checkAndDoYourDuty();

function prepareCSSRules(){
	var styleSheetId = "trexpsdstlsht";
	var currentStyleSheet = document.getElementById(styleSheetId);
	if (currentStyleSheet === null) {
	  var css = document.createElement("style");
	  css.type = "text/css";
	  css.innerHTML += "span.trexpsd:before{position: absolute;content:'';background: url("+chrome.extension.getURL("tl.png")+") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
	  css.innerHTML += "span.trexpsds:before{position: absolute;content:'';background: url("+chrome.extension.getURL("td.png")+") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
	  css.setAttribute("id", styleSheetId);
	  document.body.appendChild(css);
	}
}