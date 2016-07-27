/* Here we want to find all the img tags with a tracker link in the current tab and expose them */
// Example YW target: <img src="https://ci6.googleusercontent.com/proxy/lksdjhlaksdjfhalksdfhj#https://t.yesware.com/t/klsjdhflaksfhd/sjdhaljsdfhlkj/spacer.gif" style="border:0px;width:0px;min-height:0px" width="0" height="0" class="CToWUd">
// Example SK target: <img src="https://ci4.googleusercontent.com/proxy/ldwgefqhgfhagsdfhavenbwvenasbvdasd#http://t.sidekickopen04.com/e1t/o/5/ASGHDFAHSGDFHAGFHJRWGEDCANSVC&amp;pi=aggfjrahwgvdnbsvdmad" style="display:none!important" height="1" width="1" class="CToWUd">
// Example MA target: <img src="https://ci4.googleusercontent.com/proxy/yutequetqwegsjfhdagsfdj#http://mandrillapp.com/track/open.php?u=3746289346&amp;id=9284352345v345h3459237059gfg" height="1" width="1" class="CToWUd" tracker="true" style="display: none;">
// Example MT target: <img width="0" height="0" src="https://ci5.googleusercontent.com/proxy/wuertwueyrwnervnasdasdhgasdhgajshdgasd#https://mailtrack.io/trace/mail/2938462983423h4d2d3hf4d2g3hf4d2hg34fd234.png" class="CToWUd" tracker="true" style="display: none;">


function parseUrlParams(url){
  var match,
	  pl     = /\+/g,  // Regex for replacing addition symbol with a space
	  search = /([^&=]+)=?([^&]*)/g,
	  decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	  query  = url.slice(url.indexOf('?') + 1); // The query part of the url

  urlParams = {};
  while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);

  return urlParams;
}

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

// This function returns the environment we are running in
function getEnv(){
	if (document.location.host.indexOf("mail.google.com") > -1) return 'gmail';
	if (document.location.host.indexOf("inbox.google.com") > -1) return 'inbox';
	if (document.location.host.indexOf("mail.live.com") > -1) return 'outlook';
	if (document.location.host.indexOf("mail.yahoo.com") > -1) return 'ymail';
	return '';
}
// This function returns the part of the Gmail UI we are in
function getGmailUI(){
	if (document.location.search.indexOf('view=pt') > -1) return 'print';
	if (document.location.search.indexOf('view=lg') > -1) return 'print';
	if (document.location.search.indexOf('view=dom') > -1) return 'dom';
	return 'main';
}

// This function returns all open emails in the interface
function getOpenEmails(){
	var emails = [];
	var env = getEnv();
	if (env==='gmail'){
		var gmailUI = getGmailUI();
		if (gmailUI == 'main') {
			emails = document.querySelectorAll('.nH.hx .h7'); // Normal view of conversations in Gmail
		} else if(gmailUI == 'print') {
			emails = document.getElementsByTagName('body'); // Print view of conversations in Gmail
		}		
	} else if (env==='inbox'){
		emails = document.querySelectorAll('.pA'); // Opened emails in inbox
	} else if (env==='outlook'){
		emails = document.querySelectorAll('.ReadMsgContainer'); // Opened emails in outlook
	}
	return emails;
}
// This function returns all draft emails in the interface, we don't want to block images in these
function getDraftEmails(){
	var emails = [];
	var env = getEnv();
	if (env==='gmail'){
		emails = document.querySelectorAll('.M9'); // Compose windows (reply, forward, new messaage)
	} else if (env==='inbox'){
		emails = document.querySelectorAll('.ae,.Bt.br'); // Compose windows (reply, forward, new messaage)
	} else if (env==='outlook'){
		//emails = document.querySelectorAll('.ComposeMessage'); // Compose windows 
		var cmpwin = document.querySelectorAll('.ComposeMessage iframe.RichText'); // RichText Compose windows 
		for (var ifi = 0; ifi < cmpwin.length; ifi++)
			emails.push(cmpwin[ifi].contentWindow.document.body);
	}
	return emails;
}
// This function gets return the proxy url of the environment
function getProxyURL(){
	var env = getEnv();
	if ((env==='gmail')||(env==='inbox')) return "googleusercontent.com/proxy";
	if (env==='outlook') return "mail.live.com/Handlers";
	return '';
}

// This function gets an email and returns all the images that are in it
function getEmailImages(email){
	var images = [];
	var env = getEnv();
	if (env==='gmail'){
		var proxyURL = "googleusercontent.com/proxy";
		var gmailUI = getGmailUI();
		if (gmailUI == 'main') {
			//images = email.querySelectorAll('.ii.gt img'); // Normal view of conversations in Gmail
			images = email.querySelectorAll('.ii.gt img[src*="'+proxyURL+'"]'); // Normal view of conversations in Gmail
		} else if(gmailUI == 'print') {
			images = email.querySelectorAll('img[src*="'+proxyURL+'"]'); // Print view of conversations in Gmail
		}		
	} else if (env==='inbox'){
		var proxyURL = "googleusercontent.com/proxy";
		//images = email.querySelectorAll('img[src*="'+proxyURL+'"]'); // Opened emails in inbox
		images = email.querySelectorAll('img'); // Opened emails in inbox
	} else if (env==='outlook'){
		var proxyURL = "mail.live.com/Handlers";
		//images = email.querySelectorAll('img[src*="'+proxyURL+'"]'); // Opened emails in inbox
		images = email.querySelectorAll('img'); // Opened emails in inbox
	}
	//if (images.length) console.log(images.length+' images were found in the email');
	return images;
}
// This function gets an email and returns all the links that are in it
function getEmailLinks(email){
	var links = email.querySelectorAll('a');
	return links;
}

var trackedSignClass = 'trsgn';
// This function creates a trackedSign element
function createTrackedSign(){
	var trackedSign = document.createElement('img');
	trackedSign.src = chrome.extension.getURL('tracked.png');
	trackedSign.setAttribute("class", trackedSignClass);
	//trackedSign.style.display = 'none';
	trackedSign.height = 12;
	trackedSign.width = 18;
	trackedSign.style.verticalAlign = "0px";
	trackedSign.style.paddingLeft = '6px';
	return trackedSign;
}
// This function gets the 'tracked' sign element of the email or creates it if doesn't exist 
function getEmailTrackedSign(email){
	var trackedSign = null;
	var env = getEnv();
	if (env==='gmail'){
		var gmailUI = getGmailUI();
		if (gmailUI == 'main') {	
			var trackedSign = email.querySelector('h3.iw img.'+trackedSignClass);
			if ((trackedSign === null) || (trackedSign.length < 1)){
				trackedSign = createTrackedSign();
				//trackedSign.style.cursor = 'pointer';
				email.querySelector('h3.iw').appendChild(trackedSign);
			}
		}
	} else if (env==='inbox'){
		var trackedSign = email.querySelector('.pF .m4 img.'+trackedSignClass);
		if ((trackedSign === null) || (trackedSign.length < 1)){
			trackedSign = createTrackedSign();
			//trackedSign.style.cursor = 'pointer';
			email.querySelector('.pF .m4').appendChild(trackedSign);
		}
	} else if (env==='outlook'){
		var trackedSign = email.querySelector('.SenderLineLeft img.'+trackedSignClass);
		if ((trackedSign === null) || (trackedSign.length < 1)){
			trackedSign = createTrackedSign();
			//trackedSign.style.cursor = 'pointer';
			email.querySelector('.SenderLineLeft').appendChild(trackedSign);
		}
	}
	
	return trackedSign;
}
// This function adds judgement url to an image's src, it also returns the non proxied src
function addJudgement(img, suspicious){
	var nonSuspMark = "trnonsuspmrk"; // This will be added to non-suspicious images
	var suspMark = "trsuspmrk"; // This will be added to suspicious images
	
	var srcUrl = img.src;
	var env = getEnv();
	if ((env==='gmail')||(env==='inbox')){
		srcUrl = img.src.split("#")[1]; // Get the non-proxied src
		if (suspicious){
			if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+suspMark+'#');
		} else {
			if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
		}
	} else if (env==='outlook'){
		var proxyURL = "mail.live.com/Handlers";
		if (img.src.indexOf(proxyURL) > -1) srcUrl = parseUrlParams(img.src).url;		
		if (suspicious){
			if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('&url', '&'+suspMark+'&url');
		} else {
			if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('&url', '&'+nonSuspMark+'&url');
		}
	}
	
	return srcUrl;
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

function getSize(img){
	var h = (img.style.height || img.style.minHeight || img.style.maxHeight)?parseInt(img.style.height || img.style.minHeight || img.style.maxHeight):-1;
	if ((img.getAttribute("height")!==null)&&!isNaN(img.height)) h = img.height;
	var w = (img.style.width || img.style.minWidth || img.style.maxWidth)?parseInt(img.style.width || img.style.minWidth || img.style.maxWidth):-1;
	if ((img.getAttribute("width")!==null)&&!isNaN(img.width)) w = img.width;
	
	return {h:h,w:w};	
}

function isTiny(img){
	var s = getSize(img);
	var h = s.h;
	var w = s.w;
	
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
	
	if (typeof options.openTrackers==="undefined") return 0; // A fix for initial loading of page when the asynchronous messaging has not returned even once
	
	var openDomains = []; 
	for (var i=0; i<options.openTrackers.length; i++) openDomains = openDomains.concat(options.openTrackers[i].domains);

	var clickDomains = []; 
	for (var i=0; i<options.clickTrackers.length; i++) clickDomains = clickDomains.concat(options.clickTrackers[i].domains);

	var trackerImages = [];
	var trackerLinks = [];
	var env = getEnv();
	if ((env==='gmail')||(env==='inbox')||(env==='outlook')) { // Special Gmail, Inbox and Outlook handling
		//var nonSuspMark = "trnonsuspmrk"; // This will be added to non-suspicious images
		//var suspMark = "trsuspmrk"; // This will be added to suspicious images
		var proxyURL = getProxyURL();
	
		var emails = getOpenEmails();
		//console.log('At '+env+'; '+emails.length+' emails are open...');
		for (var ei = 0; ei < emails.length; ei++){
			var email = emails[ei];
			var newFindings = false;
			var openTrackersProcessed = false;
			var clickTrackersProcessed = false;		
			var imagesProcessed = false;
			if (email.getAttribute("trotrckrs") !== null) {openTrackersProcessed = true; } // Already processed open trackers
			if (email.getAttribute("trimgs") !== null) {imagesProcessed = email.getAttribute("trimgs"); } // Images available in email when processed open trackers
			if (email.getAttribute("trctrckrs") !== null) {clickTrackersProcessed = true; } // Already processed click trackers
			
			var images = getEmailImages(email);
			
			var mailTrackers = 0;
			// Open Trackers
			var openTrackerURLs = [];
			if (openTrackersProcessed && (images.length == imagesProcessed)){
				mailTrackers+=parseInt(email.getAttribute("trotrckrs"));
			} else { // Process Open Trackers
				var mailOpenTrackers = 0;
				var imagesSrcs = [];
				for (var j = 0; j < images.length; j++) imagesSrcs[j] = images[j].src; // Store src for all images
				var isKnownTracker = false;
				for (var i = 0; i < images.length; i++)	{ // Loop over all images in the email
					var img = images[i];
					// Count repetitions of image URL among images in email -> good for dinstingushing design 1x1 images from tracking images
					var reps = 0;
					for (var j = 0; j < imagesSrcs.length; j++)	if (imagesSrcs[j] == img.src) reps++;
					
					isProxified = ((proxyURL!='')&&(img.src.indexOf(proxyURL) > -1)); // Check if it is proxified
					isKnownTracker = multiMatch(img.src, openDomains); // Check if it is a known tracker
					
					//console.log('Trocker: Image '+img.src+' has '+reps+ 'reps!'+(isKnownTracker?' is known':' is NOT known')+' - '+(isTiny(img)?' is tiny!':' is NOT tiny.')+' - w:'+getSize(img).w+' - h:'+getSize(img).h);
					
					if ( isKnownTracker || (isProxified && isTiny(img)) && (reps < 5) ) {
						if (!isKnownTracker) { // If an unknown tracker
							img.setAttribute("known","0");
						}
						trackerImages.push(img);
						mailOpenTrackers++;
						var srcUrl = addJudgement(img, true);
						openTrackerURLs.push(srcUrl);
						//openTrackerURLs.push(img.src.split("#")[1]);
						//if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+suspMark+'#');
					} else { // Mark non-tracking images
						addJudgement(img, false);
						//if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
					}
				}
				if (images.length || ((env==='gmail') && email.querySelector('div.ado') === null) ){ // If <Images are displayed>, save this. Otherwise don't save so that we process images later
					email.setAttribute("trotrckrs", mailOpenTrackers);
					email.setAttribute("trimgs", images.length);
					clickTrackersProcessed = false; // Redo click tracker analysis
					newFindings = true;
				}
				mailTrackers+=mailOpenTrackers;				
			}
			
			// Link Trackers
			var clickTrackerURLs = [];
			if (clickTrackersProcessed){
				mailTrackers+=parseInt(email.getAttribute("trctrckrs"));
			} else {
				var mailClickTrackers = 0;
				var links = getEmailLinks(email);
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					if (  multiMatch(link.href, clickDomains) ) {
						trackerLinks.push(link);
						mailClickTrackers++;
						clickTrackerURLs.push(link.href);
					}
				}
				email.setAttribute("trctrckrs", mailClickTrackers);
				mailTrackers+=mailClickTrackers;
				newFindings = true;
			}
				
			if (mailTrackers > 0 && newFindings){ // If email has trackers in it
				trackedSign = getEmailTrackedSign(email);
				if (trackedSign !== null){
					trackedSign.title = '';
					if (openTrackerURLs.length > 0){
						trackedSign.title += openTrackerURLs.length + ' Tracking Images: ';
						var maxItemsToShow = 5;
						for (var i=0; i<openTrackerURLs.length; i++) {
							if (i>=maxItemsToShow) { trackedSign.title += ', ...   '; break; 
							} else trackedSign.title += '('+(i+1)+') '+openTrackerURLs[i]+"   "; 							
						}
					}
					if (clickTrackerURLs.length > 0){
						trackedSign.title += clickTrackerURLs.length + ' Tracking Links: ';
						var maxItemsToShow = 5;
						for (var i=0; i<clickTrackerURLs.length; i++) {
							if (i>=maxItemsToShow) { trackedSign.title += ', ...   '; break; 
							} else trackedSign.title += '('+(i+1)+') '+clickTrackerURLs[i]+"   ";
						}
					}
				}
			}			
			trackerCount += mailTrackers;
		}
		
		// Deal with compose windows
		var emails = getDraftEmails(); // Compose windows (reply, forward, new messaage)
		//console.log('At '+env+'; '+emails.length+' drafts are open...');
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
					addJudgement(img, false);
				    //if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
				}
			}
		}
	} else { // The general case
		// Open Trackers
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
		
		// Link Trackers
		var links = document.getElementsByTagName('a');
		for (var i = 0; i < links.length; i++) {
			var link = links[i];
			if (  multiMatch(link.href, clickDomains) ) {
				trackerCount++;
				trackerLinks.push(link);
			}
		}
	}
	
	if (options.exposeTrackers){
		prepareCSSRules();
		
		// Expose Open Trackers
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
		
		// Expose Click Trackers
		for (var i = 0; i < trackerLinks.length; i++){
			var link = trackerLinks[i];
			// Expose the link
			link.classList.add('trexpsdl');
		}
	}

	// Remove Empty Exposers
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"] :not(img)'); // Unwanted children in exposer spans
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"]:empty'); // Empty exposers
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	
	return trackerCount;
}

window.addEventListener("hashchange", function(){
	//alert('hash changed!');
	//checkAndDoYourDuty();
	window.setTimeout(checkAndDoYourDuty, 20); // To respond a little faster after images are loaded	
}, false);

checkAndDoYourDuty();

var env = getEnv();
if ((env==='gmail')||(env==='inbox')||(env==='outlook')) window.setInterval(checkAndDoYourDuty, 500);
