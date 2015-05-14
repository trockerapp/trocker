/* Here we want to find all the img tags with yesware link in the current tab and expose them */
// Example target: <img src="https://ci6.googleusercontent.com/proxy/C-ENSN58vhPeLlIsUcFVEmzulIrhDKRHI3gvGPbXJMcDsLeFlwAxNXBzrcAgfkHxrOlM_F1WT11K-XhxjIROZl5keeQD0Uv-_7R54KRtt5t40F6rlvbgdwchmDahbo4til5h7AGetmG3pS9t34dyEmcvb77QiA8MB40a5-p8UV9rsQ=s0-d-e1-ft#https://t.yesware.com/t/9753ac6e46810c884c8c008a53991032923afab3/c01311adc69f53dd4f8cbe6cf718b64b/spacer.gif" style="border:0px;width:0px;min-height:0px" width="0" height="0" class="CToWUd">

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




checkAndDoYourDuty = function(){
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
}


countTrackers = function(options){
	var trackerCount = 0;

	var images = document.getElementsByTagName('img');
	for (var i = 0; i < images.length; i++)
	{
		var img = images[i];
		if (img.src.indexOf('t.yesware.com/t/')>-1) {
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
					if (img.src.indexOf('http://t.yesware.com/t/')>-1) {
						//img.className += " trexpsd";
						//img.classList.add("trexpsd");
						span.setAttribute("class","trexpsd");
						//span.className = "trexpsd";
					} else {
						//img.className += " trexpsds";
						//img.classList.add("trexpsds");
						span.setAttribute("class","trexpsds");
						//span.className = "trexpsds";
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