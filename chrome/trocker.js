/* Here we want to find all the img tags with a tracker link in the current tab and expose them */
// Example YW target: <img src="https://ci6.googleusercontent.com/proxy/lksdjhlaksdjfhalksdfhj#https://t.yesware.com/t/klsjdhflaksfhd/sjdhaljsdfhlkj/spacer.gif" style="border:0px;width:0px;min-height:0px" width="0" height="0" class="CToWUd">
// Example SK target: <img src="https://ci4.googleusercontent.com/proxy/ldwgefqhgfhagsdfhavenbwvenasbvdasd#http://t.sidekickopen04.com/e1t/o/5/ASGHDFAHSGDFHAGFHJRWGEDCANSVC&amp;pi=aggfjrahwgvdnbsvdmad" style="display:none!important" height="1" width="1" class="CToWUd">
// Example MA target: <img src="https://ci4.googleusercontent.com/proxy/yutequetqwegsjfhdagsfdj#http://mandrillapp.com/track/open.php?u=3746289346&amp;id=9284352345v345h3459237059gfg" height="1" width="1" class="CToWUd" tracker="true" style="display: none;">
// Example MT target: <img width="0" height="0" src="https://ci5.googleusercontent.com/proxy/wuertwueyrwnervnasdasdhgasdhgajshdgasd#https://mailtrack.io/trace/mail/2938462983423h4d2d3hf4d2g3hf4d2hg34fd234.png" class="CToWUd" tracker="true" style="display: none;">

// Some constants
var trackedSignClass = 'trsgn';

var resourceUrls = {
	'trackedSign': chrome.extension.getURL('tracked.png'),
	'tr1': chrome.extension.getURL("tl.png"),
	'tr2': chrome.extension.getURL("td.png"),
	'trClick': chrome.extension.getURL("tlc.png")
}

// Some global vars
var imageSrcsBU = '';
var trackerImageCntBU = 0;
var linkUrlsBU = '';
var trackLinkCntBU = 0;

var openEmailCount=null;

class Email {
	static getOpenEmails(){
		return [];
	}
	static getDraftEmails(){
		return [];
	}
	constructor(mainDOMElem) {
		this.mainDOMElem = mainDOMElem;
	}
	getBody() { // Revise this to more specifically return the body of the email in each webmail
		return this.mainDOMElem;
	}
	getUIImages() { // Revise this to more specifically return the body of the email in each webmail
		return [];
	}
	getImages() { // Revise this to return images in the email body
		return this.getBody().querySelectorAll('img');
	}
	getLinks() {
		return this.getBody().querySelectorAll('a');
	}
	getTrockerSign(showSign) {
		var trackedSign = this.getTrockerSignDOMElem(showSign);
		if ((trackedSign !== null) && (!showSign)) {
			trackedSign.parentElement.removeChild(trackedSign);
		}
		return trackedSign;
	}
	getTrockerSignDOMElem(showSign) { // Revise to create if needed and return the trocker sign in each webmail
		return null;
	}
	getAttribute(...args) {
		return this.mainDOMElem.getAttribute(...args);
	}
	setAttribute(...args) {
		return this.mainDOMElem.setAttribute(...args);
	}
	removeAttribute(...args) {
		return this.mainDOMElem.removeAttribute(...args);
	}
	imagesAreShown() { // If webmail disables images by default (e.g. gmail), revise to return false until images are shown 
		return true;
	}
}

class EmailGmail extends Email {
	static getOpenEmails() {
		var gmailUI = getGmailUI();
		if (gmailUI == 'main') {
			return Array.from(document.querySelectorAll('.h7')).map(a => new EmailGmail(a)); // Normal view of conversations in Gmail
		} else if (gmailUI == 'print') {
			return Array.from(document.getElementsByTagName('body')).map(a => new EmailGmail(a)); // Print view of conversations in Gmail
		}
	}
	static getDraftEmails() {
		return Array.from(document.querySelectorAll('.M9')).map(a => new EmailGmailDraft(a)); // Compose windows (reply, forward, new message)
	}
	constructor(mainDOMElem) {
		super(mainDOMElem);
		this.gmailUI = getGmailUI();
	}
	getImages() {
		var proxyURL = "googleusercontent.com/proxy";
		if (this.gmailUI === 'main') {
			images = this.getBody().querySelectorAll('.ii.gt img'); // Normal view of conversations in Gmail
			// var images = this.getBody().querySelectorAll('.ii.gt img[src*="' + proxyURL + '"]'); // Normal view of conversations in Gmail
		} else if (this.gmailUI === 'print') {
			var images = this.getBody().querySelectorAll('img'); // Print view of conversations in Gmail
		}
		return images;
	}
	getTrockerSignDOMElem(showSign) { // Revise to create if needed and return the trocker sign
		var trackedSign = null;
		if (this.gmailUI === 'main') {
			var trackedSign = this.mainDOMElem.querySelector('h3.iw img.' + trackedSignClass);
			if (((trackedSign === null) || (trackedSign.length < 1)) && showSign) {
				trackedSign = createTrackedSign();
				//trackedSign.style.cursor = 'pointer';
				this.mainDOMElem.querySelector('h3.iw').appendChild(trackedSign);
			}
		}
		return trackedSign;
	}
	imagesAreShown() {
		return (this.mainDOMElem.querySelector('div.ado') === null)
	}
}

class EmailGmailDraft extends Email {
	getImages() {
		// Exclude any signature images
		let images = Array.from(this.getBody().querySelectorAll('img'));
		let ui_images = Array.from(this.getBody().querySelectorAll('.gmail_signature img'));
		if (ui_images.length > 0) { // Remove draft UI elements that should not be processed (e.g. signatures)
			images = images.filter((el) => !ui_images.includes(el));
		}
		return images;
	}
}

class EmailInbox extends Email {
	static getOpenEmails(){
		return Array.from(document.querySelectorAll('.pA')).map(a => new EmailInbox(a)); // Opened emails in inbox
	}
	static getDraftEmails(){
		return Array.from(document.querySelectorAll('.ae,.Bt.br')).map(a => new EmailInboxDraft(a)); // Compose windows (reply, forward, new message)
	}
	getImages() {
		var proxyURL = "googleusercontent.com/proxy";
		//images = this.getBody().querySelectorAll('img[src*="'+proxyURL+'"]'); // Opened emails in inbox
		return this.getBody().querySelectorAll('.he.s2 img'); // Opened emails in inbox
	}
	getTrockerSignDOMElem(showSign) { // Revise to create if needed and return the trocker sign
		var trackedSign = this.mainDOMElem.querySelector('.pF .m4 img.' + trackedSignClass);
		if (((trackedSign === null) || (trackedSign.length < 1)) && showSign) {
			trackedSign = createTrackedSign();
			//trackedSign.style.cursor = 'pointer';
			this.mainDOMElem.querySelector('.pF .m4').appendChild(trackedSign);
		}
		return trackedSign;
	}
}

class EmailInboxDraft extends Email {
	getImages() {
		return email.querySelectorAll('.n7 img'); // Text part of draft emails in inbox
	}
}

class EmailOutlook extends Email {
	static getOpenEmails() {
		// document.querySelectorAll('div.GjFKx') // Unopen emails
		let emails = Array.from(document.querySelectorAll('div.SlLx9, div.r4JeH, div.uy30y')).map(a => new EmailOutlook(a)); // Opened emails in outlook, final version
		// Before updates ~Nov 2022
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div.QQC3U, div.iUOI8, div.SAW9N')).map(a => new EmailOutlook(a)); // Opened emails in outlook, final version
		// Before updates ~July 2022
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div._2tQ4A3EnvULHEHV6E6FsrS, div._3BL964mseejjC_nzEeda9o, div._2FJRXKSranEP36X2Dy8lE3, div._2q-_UnTDGy-DErmixrz2IR')).map(a => new EmailOutlook(a)); // Opened emails in outlook, final version
		// Before updates ~Oct 2021
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div._2le66D_cFAbkq67CrgZcmE, div._2Tgrtrj5ACwo2I6mKHcBME, ._2Dho5i6XHUaOnZOvgsp38a')).map(a => new EmailOutlook(a)); // Opened emails in outlook, final version
		// Before updates ~July 2019
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div._3irHoMUL9qIdRXbrljByA-, div._2UEsN7oGn-H4ZnCcJIoc3Q, div._103ouDFSzMvKVjD0UYmJQh')).map(a => new EmailOutlook(a)); // Opened emails in outlook,final version
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div._2D1p6xUSTPdw8LYT59VKoE')).map(a => new EmailOutlook(a)); // Opened emails in outlook2, new beta
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div[autoid="_rp_3"]')).map(a => new EmailOutlook(a)); // Opened emails in outlook alpha version
		return emails;
	}
	static getDraftEmails() {
		let emails = Array.from(document.querySelectorAll('.yz4r1')).map(a => new EmailOutlookDraft(a)); // Compose windows final outlook
		// Before updates ~Nov 2022
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('._17WvdmDfhREFqBNvlLv75X')).map(a => new EmailOutlookDraft(a)); // Compose windows final outlook
		// Before updates ~Oct 2021
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('._29NreFcQ3QoBPNO3rKXKB0')).map(a => new EmailOutlookDraft(a)); // Compose windows final outlook
		// Before updates ~July 2019
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('._2BCZP_W9VLRv-NN3SC1nnS')).map(a => new EmailOutlookDraft(a)); // Compose windows final outlook
		if (!emails || !emails.length) emails = Array.from(document.querySelectorAll('div._mcp_32')).map(a => new EmailOutlookDraft(a)); // Compose windows in outlook2, new beta
		return emails;
	}
	getBody() {
		const bodyElems = this.mainDOMElem.querySelectorAll('.XbIp4,.ulb23,.TiApU,._2Qk4AbDuWwkuLB005ds2jm,.QMubUjbS-BOly_BTHEZj7,.JWNdg1hee9_Rz6bIGvG1c,.uPjvZdP7b0tJmYcRO3HY9');
		if (bodyElems.length > 0) {
			return Array.from(bodyElems);
		} else {
			// make array with one element
			return [this.mainDOMElem];
		}
	}
	getUIImages() { // Revise this to more specifically return the body of the email in each webmail
		const attachmentElems = this.mainDOMElem.querySelectorAll('.T3idP');
		if (attachmentElems.length > 0) {
			return [].concat.apply([], 
				Array.from(attachmentElems).map( b => Array.from(b.querySelectorAll('img')) )
			);
		} else {
			return [];
		}
	}
	getLinks() {
		var bodyLinks = this.getBody().map(b => Array.from(b.querySelectorAll('a')));
		return [].concat.apply([], bodyLinks); // Merge links found from all body elements
	}
	getImages() {
		//var images = email.querySelectorAll('img[src*="'+proxyURL+'"]'); // Opened emails in Outlook
		if ((this.mainDOMElem.className.indexOf('SlLx9') > -1) || // Main emails
			(this.mainDOMElem.className.indexOf('Q8TCC') > -1) || // Popout
			(this.mainDOMElem.className.indexOf('r4JeH') > -1) || // Print view
			(this.mainDOMElem.className.indexOf('uy30y') > -1) || // Message history view
			// Before updates ~Nov 2022
			(this.mainDOMElem.className.indexOf('QQC3U') > -1) || // Main emails
			(this.mainDOMElem.className.indexOf('SI5jj') > -1) || // Popout
			(this.mainDOMElem.className.indexOf('SAW9N') > -1) || // Print view
			// Before updates ~July 2022
			(this.mainDOMElem.className.indexOf('_3BL964mseejjC_nzEeda9o') > -1) || // Main emails
			(this.mainDOMElem.className.indexOf('_2FJRXKSranEP36X2Dy8lE3') > -1) || // Popout
			(this.mainDOMElem.className.indexOf('_2q-_UnTDGy-DErmixrz2IR') > -1) || // Print view
			(this.mainDOMElem.className.indexOf('_2tQ4A3EnvULHEHV6E6FsrS') > -1) || // Message history view
			// Before updates ~Oct 2021
			(this.mainDOMElem.className.indexOf('_2le66D_cFAbkq67CrgZcmE') > -1) || // Main emails
			(this.mainDOMElem.className.indexOf('_2Tgrtrj5ACwo2I6mKHcBME') > -1) || // Popout
			(this.mainDOMElem.className.indexOf('_2Dho5i6XHUaOnZOvgsp38a') > -1)) { // Print view
			var bodyImages = this.getBody().map(b => Array.from(b.querySelectorAll('img')));
			// Before updates ~July 2019
		} else if ((this.mainDOMElem.className.indexOf('_3irHoMUL9qIdRXbrljByA-') > -1) ||
			(this.mainDOMElem.className.indexOf('_103ouDFSzMvKVjD0UYmJQh') > -1) ||
			(this.mainDOMElem.className.indexOf('_2UEsN7oGn-H4ZnCcJIoc3Q') > -1)) {
			var bodyImages = this.getBody().map(b => Array.from(b.querySelectorAll('img')));
		} else if (this.mainDOMElem.className.indexOf("_2D1p6xUSTPdw8LYT59VKoE") > -1) { // beta
			var bodyImages = this.getBody().map(b => Array.from(b.querySelectorAll('img')));
		} else {
			var bodyImages = this.getBody().map(b => Array.from(b.parentElement.parentElement.parentElement.parentElement.querySelectorAll('img')));
		}
		var images = [].concat.apply([], bodyImages); // Merge images found from all body elements
		return images;
	}
	getTrockerSignDOMElem(showSign) { // Revise to create if needed and return the trocker sign
		var trackedSign = null;
		if ((this.mainDOMElem.className.indexOf("SlLx9") > -1) || (this.mainDOMElem.className.indexOf("Q8TCC") > -1)) { // Main/popout email
			var trackedSign = this.mainDOMElem.querySelector('.AvaBt img.' + trackedSignClass);
			// Before updates ~Nov 2022
		} else if (this.mainDOMElem.className.indexOf('QQC3U') > -1) { // Main email
			var trackedSign = this.mainDOMElem.querySelector('.GtvxD img.' + trackedSignClass);
			// Before updates ~July 2022
		} else if (this.mainDOMElem.className.indexOf('_3BL964mseejjC_nzEeda9o') > -1) { // Main email
			var trackedSign = this.mainDOMElem.querySelector('._3HWDmPvwbfbJdx0zvu6Bve img.' + trackedSignClass);
			// Before updates ~Oct 2021
		} else if (this.mainDOMElem.className.indexOf('_2le66D_cFAbkq67CrgZcmE') > -1) { // Main email
			var trackedSign = this.mainDOMElem.querySelector('._1Lo7BjmdsKZy3IMMxN7mVu img.' + trackedSignClass);
			// Before updates ~July 2019
		} else if ((this.mainDOMElem.className.indexOf('_3irHoMUL9qIdRXbrljByA-') > -1) || // Final version (main emails)
			(this.mainDOMElem.className.indexOf('_103ouDFSzMvKVjD0UYmJQh') > -1)) { // Final version (main emails in popout)
			var trackedSign = this.mainDOMElem.querySelector('div._3BM5wlNLStI0usWYsOv9Ka img.' + trackedSignClass);
		} else if (this.mainDOMElem.className.indexOf('_2UEsN7oGn-H4ZnCcJIoc3Q') > -1) { // Final version (message history, e.g. forwarded)
			var trackedSign = this.mainDOMElem.querySelector('._3WKppjPonmzz8_LIjympNq img.' + trackedSignClass);
			// Old beta versions			
		} else if (this.mainDOMElem.className.indexOf("_2D1p6xUSTPdw8LYT59VKoE") > -1) { // outlook beta
			var trackedSign = this.mainDOMElem.querySelector('div.EnHwYkExLYficI2goh5Zx img.' + trackedSignClass);
		} else {
			var trackedSign = this.mainDOMElem.querySelector('div._rp_m1 div._rp_38._rp_48 img.' + trackedSignClass);
		}
		if (((trackedSign === null) || (trackedSign.length < 1)) && showSign) {
			trackedSign = createTrackedSign();
			//trackedSign.style.cursor = 'pointer';
			let e = null;
			if ((this.mainDOMElem.className.indexOf("SlLx9") > -1) || (this.mainDOMElem.className.indexOf("Q8TCC") > -1)) {
				e = this.mainDOMElem.querySelector('.AvaBt');
				// Before updates ~Nov 2022
			} else if (this.mainDOMElem.className.indexOf("QQC3U") > -1) {
				e = this.mainDOMElem.querySelector('.GtvxD');
				// Before updates ~July 2022
			} else if (this.mainDOMElem.className.indexOf("_3BL964mseejjC_nzEeda9o") > -1) {
				e = this.mainDOMElem.querySelector('._3HWDmPvwbfbJdx0zvu6Bve ');
				// Before updates ~Oct 2021
			} else if (this.mainDOMElem.className.indexOf("_2le66D_cFAbkq67CrgZcmE") > -1) {
				e = this.mainDOMElem.querySelector('._1Lo7BjmdsKZy3IMMxN7mVu');
				// Before updates ~July 2019
			} else if ((this.mainDOMElem.className.indexOf('_3irHoMUL9qIdRXbrljByA-') > -1) || // Final version (main emails)
				(this.mainDOMElem.className.indexOf('_103ouDFSzMvKVjD0UYmJQh') > -1)) { // Final version (main emails in popout)
				e = this.mainDOMElem.querySelector('div._3BM5wlNLStI0usWYsOv9Ka');
			} else if (this.mainDOMElem.className.indexOf("_2UEsN7oGn-H4ZnCcJIoc3Q") > -1) { // Final version (message history, e.g. forwarded)
				e = this.mainDOMElem.querySelector('._3WKppjPonmzz8_LIjympNq');
				// Old beta versions
			} else if (this.mainDOMElem.className.indexOf("_2D1p6xUSTPdw8LYT59VKoE") > -1) { // outlook beta
				e = this.mainDOMElem.querySelector('div.EnHwYkExLYficI2goh5Zx');
			} else {
				e = this.mainDOMElem.querySelector('div._rp_m1 div._rp_38._rp_48');
			}
			if (e !== null) e.appendChild(trackedSign);
		}
		return trackedSign;
	}
}

class EmailOutlookDraft extends Email {
	getBody() {
		const bodyElem = this.mainDOMElem.querySelectorAll('.bAHScQgzLTvwiV2QXvzpa,._2kZu_nrsBS0LQbV-DFQuPl,._2_G1lB2DCB_6t73ZTT6vX3,._2Hl0t2u2yIjuWmfatKUaJ2');
		if (bodyElem.length == 1) {
			return bodyElem[0];
		} else {
			return this.mainDOMElem;
		}
	}
}

class EmailYMail extends Email {
	static getOpenEmails() {
		let emails = Array.from(document.querySelectorAll('.m_Z12nDQf.D_F.ek_BB.ir_0,.V_GM.H_6D6F')).map(a => new EmailYMail(a)); // Opened emails in outlook
		emails = emails.filter(e => e.getBody() !== null); // Remove unopened emails
		return emails;
	}
	static getDraftEmails() {
		return Array.from(document.querySelectorAll('.em_N.D_F.ek_BB.p_R.o_h,.o_A.d_3zJDR.H_3zJDR')).map(a => new Email(a)); // Compose windows (reply, forward, new message)
	}
	getBody() {
		return this.mainDOMElem.querySelector('.msg-body');
	}
	getTrockerSignDOMElem(showSign) { // Revise to create if needed and return the trocker sign
		var trackedSign = null;
		trackedSign = this.mainDOMElem.querySelector('.D_F.en_0 img.' + trackedSignClass);
		if ((trackedSign === null) || (trackedSign.length < 1)) { // Could be classic Yahoo mail
			trackedSign = this.mainDOMElem.querySelector('.N_dRA.D_X.q_52qC.mq_AQ img.' + trackedSignClass);
		}
		if (((trackedSign === null) || (trackedSign.length < 1)) && showSign) {
			trackedSign = createTrackedSign();
			//trackedSign.style.cursor = 'pointer';
			let parentElem = this.mainDOMElem.querySelector('.o_h.D_F.em_0.E_fq7.ek_BB .D_F.en_0');
			if (!parentElem) { // Classic Yahoo mail
				parentElem = this.mainDOMElem.querySelector('.N_dRA.D_X.q_52qC.mq_AQ');
			}
			parentElem.appendChild(trackedSign);
		}
		return trackedSign;
	}
}

function parseUrlParams(url) {
	var match,
		pl = /\+/g, // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) {
			return decodeURIComponent(s.replace(pl, " "));
		},
		query = url.slice(url.indexOf('?') + 1); // The query part of the url

	urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);

	return urlParams;
}

function addTrockerMark(url, mark) {
	if (url.indexOf('?') > -1) {
		url = url.replace('?', '?' + mark + '&');
	} else {
		url = url + '?' + mark;
	}
	return url;
}

// returns true if str contains any of patterns in it
function multiMatch(str, patterns) {
	for (var i = 0; i < patterns.length; i++) {
		if (str.indexOf(patterns[i]) > -1) return true;
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
		var el = elms[i];

		// Cache the current parent and sibling.
		var parent = el.parentNode;
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

// Moves children of an element up to be its siblings and removes the element
function unwrap(wrapper) {
	if (wrapper instanceof HTMLElement) {
		children = wrapper.children; // Get children

		for (var i = children.length - 1; i >= 0; i--) { // Move children to be siblings
			wrapper.parentNode.insertBefore(children[i], wrapper);
		}
		wrapper.remove(); // Remove wrapper
	}
};

function injectJSScript(elemName, src, elemId, cb) {
	var currentElem = document.getElementById(elemId);
	if (currentElem === null) {
		var j = document.createElement(elemName);
		j.src = src;
		j.setAttribute("id", elemId);
		(document.body || document.head || document.documentElement).appendChild(j);
	}
}

function prepareCSSRules() {
	var styleSheetId = "trexpsdstlsht";
	var currentStyleSheet = document.getElementById(styleSheetId);
	if (currentStyleSheet === null) {
		var css = document.createElement("style");
		css.type = "text/css";
		css.innerHTML += "span.trexpsd:before{position: absolute;content:'';background: url(" + resourceUrls['tr1'] + ") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
		css.innerHTML += "span.trexpsds:before{position: absolute;content:'';background: url(" + resourceUrls['tr2'] + ") 0 0 / 10px 10px no-repeat !important; width: 10px; height: 10px; pointer-events: none;} ";
		css.innerHTML += 'span.trexpsd:empty, span.trexpsds:empty, span[title="trexpsdspnelm"]:empty, span[title="trexpsdspnelm"] :not(img){display:none !important;}';
		css.innerHTML += "a.trexpsdl:hover{cursor: url(" + resourceUrls['trClick'] + "), auto; !important;}";
		css.setAttribute("id", styleSheetId);
		document.body.appendChild(css);
	}
}

// This function returns the environment we are running in
function getEnv() {
	if (document.location.host.indexOf("mail.google.com") > -1) return 'gmail';
	if (document.location.host.indexOf("inbox.google.com") > -1) return 'inbox';
	if (document.location.host.indexOf("mail.live.com") > -1) return 'outlook';
	if (document.location.host.indexOf("outlook.live.com") > -1) return 'outlook2';
	if (document.location.host.indexOf("outlook.office365.com") > -1) return 'outlook2';
	if (document.location.host.indexOf("outlook.office.com") > -1) return 'outlook2';
	if (document.location.host.indexOf("mail.yahoo.com") > -1) return 'ymail';
	return '';
}

// This function returns the part of the Gmail UI we are in
function getGmailUI() {
	if (document.location.search.indexOf('view=pt') > -1) return 'print';
	if (document.location.search.indexOf('view=lg') > -1) return 'print';
	if (document.location.search.indexOf('view=dom') > -1) return 'dom';
	return 'main';
}

function getWebmailUrls(webmails) {
	let env = getEnv();
	let wmInfo = {
		name: '',
		matchUrls: [],
		whiteList: [],
		whiteListExcept: []
	}
	for (let wm of webmails) {
		if ((wm.name && env === wm.name) || (wm.name === 'outlook' && env == 'outlook2')) {
			wmInfo = wm;
		}
	}
	return wmInfo;
}

// This function returns all open emails in the interface

function getOpenEmails() {
	var emails = [];
	var env = getEnv();
	if (env === 'gmail') {
		emails = EmailGmail.getOpenEmails();
	} else if (env === 'inbox') {
		emails = EmailInbox.getOpenEmails();
	} else if (env === 'outlook') {
		emails = Array.from(document.querySelectorAll('.ReadMsgContainer')).map(a => new Email(a)); // Opened emails in outlook
	} else if (env === 'outlook2') {
		emails = EmailOutlook.getOpenEmails();
	} else if (env === 'ymail') {
		emails = EmailYMail.getOpenEmails();
	}
	if (emails.length != openEmailCount) {
		openEmailCount = emails.length;
		logEvent('detected ' + emails.length + ' open emails (env: "' + env + '")', false);
	}
	return emails;
}

// This function returns all draft emails in the interface, we don't want to block images in these
function getDraftEmails() {
	var emails = [];
	var env = getEnv();
	if (env === 'gmail') {
		emails = EmailGmail.getDraftEmails();
	} else if (env === 'inbox') {
		emails = EmailInbox.getDraftEmails();
	} else if (env === 'outlook') {
		//emails = document.querySelectorAll('.ComposeMessage'); // Compose windows 
		var cmpwin = Array.from(document.querySelectorAll('.ComposeMessage iframe.RichText')).map(a => new Email(a)); // RichText Compose windows 
		for (var ifi = 0; ifi < cmpwin.length; ifi++)
			emails.push(new Email(cmpwin[ifi].contentWindow.document.body));
	} else if (env === 'outlook2') {
		emails = EmailOutlook.getDraftEmails();
	} else if (env === 'ymail') {
		emails = EmailYMail.getDraftEmails();
	}
	if (emails.length) logEvent('detected ' + emails.length + ' compose inputs (env: "' + env + '")', false);

	return emails;
}

function getUIWhitelistElems() {
	var elems = [];
	var env = getEnv();
	if (env === 'gmail') {
		var gmailUI = getGmailUI();
		if (gmailUI == 'main') { // Normal view of conversations in Gmail
			// Some selectors: .nH.oy8Mbf.qp: Header, .nH.oy8Mbf.aeN: Left bar, .nH.bAw: Right add-on bar with add-on icons, .bq9: right add-on load area
			elems = document.querySelectorAll('.nH.bAw, .bq9'); // Header, Left Bar, Right add-on bar
		}
	} else if (env === 'outlook2') {
		// Some selectors: .___1d1gxkh: Left bar, .___7y4pq70: Left bar app overflow box
		elems = document.querySelectorAll('.___1d1gxkh, .___7y4pq70, .___1s80610, .f17wyjut, .___mi5lus0, .ms-Icon-imageContainer, .Yd48r, .GssDD'); // Left Bar, Left bar app overflow box
	}
	return elems;
}
// This function gets return the proxy url of the environment
function getProxyURLs() {
	var env = getEnv();
	if ((env === 'gmail') || (env === 'inbox')) return ["googleusercontent.com/proxy", "googleusercontent.com/meips"];
	if (env === 'outlook') return ["mail.live.com/Handlers"];
	if (env === 'outlook2') return []; // Does not proxify
	if (env === 'ymail') return ['yusercontent.com/mail'];
	return '';
}

// This function creates a trackedSign element
function createTrackedSign() {
	var trackedSign = document.createElement('img');
	trackedSign.src = resourceUrls['trackedSign'];
	trackedSign.setAttribute("class", trackedSignClass);
	//trackedSign.style.display = 'none';
	trackedSign.height = 12;
	trackedSign.width = 18;
	trackedSign.style.verticalAlign = "0px";
	trackedSign.style.paddingLeft = '6px';
	return trackedSign;
}

function getUnproxifiedUrl(src) {
	var proxyURLs = getProxyURLs();
	for (const proxyURL of proxyURLs) {
		if (src.indexOf(proxyURL)) {
			if ((env === 'gmail') || (env === 'inbox')) {
				if (src.indexOf('#') > -1) {
					return src.split("#")[1];
				}
			} else if ((env === 'outlook') || (env === 'outlook2') || (env === 'ymail')) {
				let urlParams = parseUrlParams(src);
				if (urlParams.url) {
					return urlParams.url;
				}
			}
		}
	}
	return src;
}

// This function adds judgment url to an image's src, it also returns the non proxied src
function addJudgment(img, judgment) {
	img.src = addJudgmentToSrc(img.src, judgment);
}

// This function adds judgment url to an image's src, it also returns the non proxied src
function addJudgmentToSrc(src, judgment) {
	var eq1String = '=1';

	var env = getEnv();
	if (env === 'ymail') {
		eq1String = eq1String.replace('=', '');
	}

	var nonSuspMark = "trnonsuspmrk" + eq1String; // This will be added to non-suspicious images
	var suspMark = "trsuspmrk" + eq1String; // This will be added to suspicious images

	var trIgnoreMark = "trfcallwmrk" + eq1String; // Any previous ignored judgment should also be removed
	var trIgnoreMarkRem = "trfcallwremmrk" + eq1String; // Any previous ignored judgment will be replaced by this

	if ((src.indexOf('data:image') == 0) || (src.indexOf('blob:') == 0)) return src; // Don't modify if a data image

	var markToAdd = '';
	if (judgment === 'suspicious') {
		markToAdd = suspMark;
	} else if (judgment === 'non-suspicious') {
		markToAdd = nonSuspMark;
	} else if (judgment === 'allowTracking') {
		markToAdd = trIgnoreMark;
	} else {
		return src;
	}

	if ((env === 'gmail') || (env === 'inbox')) {
		if (src.indexOf('#') > -1) {
			if (src.indexOf(markToAdd) == -1) src = src.replace('#', (((src.indexOf('?') == -1) || (src.indexOf('?') > src.indexOf('#'))) ? '?' : '&') + markToAdd + '#');
		} else {
			if (src.indexOf(markToAdd) == -1) {
				if (src.indexOf('?') > -1) {
					src = src.replace('?', '?' + markToAdd + '&');
				} else if (src.indexOf('")') > -1) {
					src = src.replace('")', '?' + markToAdd + '")');
				} else {
					src += '?' + markToAdd;
				}
			}
		}
	} else if ((env === 'outlook') || (env === 'outlook2')) {
		var proxyURL = getProxyURLs()[0];
		if (src.indexOf(markToAdd) == -1) {
			if ((src.indexOf(proxyURL) > -1) && (src.indexOf('&url') > -1)) {
				// srcUrl = parseUrlParams(src).url;		
				src = src.replace('&url', '&' + markToAdd + '&url');
			} else {
				src = addTrockerMark(src, markToAdd);
			}
		}
	} else if ((env === 'ymail')) {
		var proxyURL = getProxyURLs()[0];
		if ((src.indexOf(markToAdd) == -1) && (src.indexOf(proxyURL) > -1)) {
			// if (src.indexOf(proxyURL) > -1) {
			// 	var params = parseUrlParams(src);
			// 	var newUrl = addTrockerMark(params['url'], markToAdd);
			// 	var newSrc = new URL(src);
			// 	newSrc.searchParams.set('url', newUrl);
			// 	src = newSrc.href;
			// } else {
			// src = addTrockerMark(src, markToAdd);
			// }
			src += markToAdd; // Just append to the end, because ymail proxy server doesn't not allow unknown params
		}
	}

	return src;
}

function removeJudgments(img) {
	img.src = removeJudgmentsFromSrc(img.src);
}

function removeJudgmentsFromSrc(src) {
	if ((src.indexOf('data:image') == 0) || (src.indexOf('blob:') == 0)) return src; // Don't modify if a data image
	var eq1String = '=1';

	var env = getEnv();
	if (env === 'ymail') {
		eq1String = eq1String.replace('=', '');
	}

	var nonSuspMark = "trnonsuspmrk" + eq1String; // This will be added to non-suspicious images
	var suspMark = "trsuspmrk" + eq1String; // This will be added to suspicious images

	var trIgnoreMark = "trfcallwmrk" + eq1String; // Any previous judgment will be replaced by this
	var trIgnoreMarkRem = "trfcallwremmrk" + eq1String; // Any previous ignored judgment will be replaced by this

	// Remove all previous marks
	src = src.split(nonSuspMark).join(trIgnoreMarkRem); // replace all
	src = src.split(suspMark).join(trIgnoreMarkRem); // replace all
	src = src.split(trIgnoreMark).join(trIgnoreMarkRem); // replace all
	src = src.split(trIgnoreMarkRem + '&').join(''); // replace all
	return src;
}

function hasJudgments(img) {
	var eq1String = '=1';

	var env = getEnv();
	if (env === 'ymail') {
		eq1String = eq1String.replace('=', '');
	}

	var nonSuspMark = "trnonsuspmrk" + eq1String; // This will be added to non-suspicious images
	var suspMark = "trsuspmrk" + eq1String; // This will be added to suspicious images

	var trIgnoreMark = "trfcallwmrk" + eq1String; // Any previous judgment will be replaced by this
	var trIgnoreMarkRem = "trfcallwremmrk" + eq1String; // Any previous ignored judgment will be replaced by this

	var srcUrl = img.src;
	if ((srcUrl.indexOf('data:image') == 0) || (srcUrl.indexOf('blob:') == 0)) return true; // Don't modify if a data image
	if ((srcUrl.indexOf(nonSuspMark) > -1) ||
		(srcUrl.indexOf(suspMark) > -1) ||
		(srcUrl.indexOf(trIgnoreMark) > -1) ||
		(srcUrl.indexOf(trIgnoreMarkRem) > -1)) {
		return true;
	} else {
		return false;
	}
}

function logEvent(txt, verbose) {
	if ((verbose) || (trockerOptions && trockerOptions.verbose)) {
		console.log('[Trocker] ' + txt);
	}
}

var inRefractoryPeriod = false;
var inOptionPersistancePeriod = false;
var trockerOptions = {};
var uiWhitelistCounter = 0;
checkAndDoYourDuty = function () {
	if (inRefractoryPeriod) return; // In order to avoid back to back function calls triggered by fake hashchange events
	if (inOptionPersistancePeriod) { // We have recently loaded the options, let's use them
		var trackerCount = countTrackers(trockerOptions);
	} else {
		try {
			//logEvent('fetching options', true);
			chrome.runtime.sendMessage({
				method: "loadVariable",
				key: 'trockerEnable'
			}, function (response) {
				if (response) trockerOptions.trockerEnable = response.varValue;
				//if (trockerOptions.trockerEnable) {
				chrome.runtime.sendMessage({
					method: "loadVariable",
					key: 'exposeLinks'
				}, function (response) {
					if (response) trockerOptions.exposeTrackers = response.varValue;
					chrome.runtime.sendMessage({
						method: "getTrackerLists"
					}, function (response) {
						if (response) trockerOptions.openTrackers = response.openTrackers;
						if (response) trockerOptions.clickTrackers = response.clickTrackers;
						if (response) trockerOptions.webmails = response.webmails;
						var trackerCount = countTrackers(trockerOptions);
						chrome.runtime.sendMessage({
							method: "reportTrackerCount",
							value: trackerCount
						}, function (response) { });

					});
				});
				chrome.runtime.sendMessage({
					method: "loadVariable",
					key: 'verbose'
				}, function (response) {
					trockerOptions.verbose = response.varValue;
				});
				//}
			});
		} catch (error) {
			logEvent('Lost connection to extension... The browser may have updated Trocker. Please refresh the page\n'+error, true);
		}
		inOptionPersistancePeriod = true;
		window.setTimeout(function () {
			inOptionPersistancePeriod = false;
		}, 1000);
	}
	inRefractoryPeriod = true;
	window.setTimeout(function () {
		inRefractoryPeriod = false;
	}, 90);
}

function getSize(img) {
	var h = (img.style.height || img.style.minHeight || img.style.maxHeight) ? parseInt(img.style.height || img.style.minHeight || img.style.maxHeight) : -1;
	if ((img.getAttribute("height") !== null) && !isNaN(img.height)) h = (img.height || img.getAttribute("height"));
	var w = (img.style.width || img.style.minWidth || img.style.maxWidth) ? parseInt(img.style.width || img.style.minWidth || img.style.maxWidth) : -1;
	if ((img.getAttribute("width") !== null) && !isNaN(img.width)) w = (img.width || img.getAttribute("width"));

	return {
		h: h,
		w: w
	};
}

function isSusp(img) {
	var src = img.src;
	if ((src.indexOf('data:image') == 0) || (src.indexOf('blob:') == 0)) return false; // Don't declare susp if a data image

	const origSrc = getUnproxifiedUrl(src);
	const pathname = origSrc.replace(new URL(origSrc).origin, '');
	// Patterns usually only seen in tracking images
	const susPatterns = ['/open', '=open', '/trace', '/track'];
	for (let susP of susPatterns) {
		if (pathname.indexOf(susP) > -1) return true;
	}
	return false;
}

function isTiny(img) {
	var src = img.src;
	if ((src.indexOf('data:image') == 0) || (src.indexOf('blob:') == 0)) return false; // Don't declare tiny if a data image

	var s = getSize(img);
	var h = s.h;
	var w = s.w;

	if ((w > -1 && h > -1 && (w * h <= 3)) || (w == -1 && h > -1 && (h <= 3)) || (w > -1 && h == -1 && (w <= 3))) {
		//console.log('Img detected as tiny because w='+w+', h='+h+' ('+img.src+')');
		return true;
	} else if ((img.style.display === "none") || (img.style.visibility === "hidden")) {
		return true;
	} else return false;
}

var clean_height_width = function (x) {
	if (x !== "") return parseInt(x, 10);
	return -1;
}


countTrackers = function (options) {
	if (typeof options.openTrackers === "undefined") return 0; // A fix for initial loading of page when the asynchronous messaging has not returned even once

	var openDomains = [];
	for (var i = 0; i < options.openTrackers.length; i++) openDomains = openDomains.concat(options.openTrackers[i].domains);

	var clickDomains = [];
	for (var i = 0; i < options.clickTrackers.length; i++) clickDomains = clickDomains.concat(options.clickTrackers[i].domains);

	var trackerCount = 0;
	var trackerImages = [];
	var safeImages = [];
	var trackerLinks = [];
	var env = getEnv();
	if ((env === 'gmail') || (env === 'inbox') || (env === 'outlook') || (env === 'outlook2') || (env === 'ymail')) { // Special Gmail, Inbox and Outlook handling
		//var nonSuspMark = "trnonsuspmrk=1"; // This will be added to non-suspicious images
		//var suspMark = "trsuspmrk=1"; // This will be added to suspicious images
		var proxyURLs = getProxyURLs();
		var proxifesImages = (proxyURLs.length > 0);
		var webmailInfo = getWebmailUrls(options.webmails);

		var emails = getOpenEmails();
		//console.log('At '+env+'; '+emails.length+' emails are open...');
		for (var ei = 0; ei < emails.length; ei++) {
			var email = emails[ei];
			var logPrefix = 'Open email ' + (ei + 1) + ' of ' + emails.length + ': ';
			var newFindings = false;
			var openTrackersProcessed = false;
			var clickTrackersProcessed = false;
			var imagesProcessed = false;
			var trAllowTracking = false;
			if (email.getAttribute("trotrckrs") !== null) { // Already processed open trackers
				openTrackersProcessed = true;
			}
			if (email.getAttribute("trimgs") !== null) { // Images available in email when processed open trackers
				imagesProcessed = email.getAttribute("trimgs");
				if (imagesProcessed !== false) {
					imagesProcessed = parseInt(imagesProcessed);
				}
			}
			if (email.getAttribute("trctrckrs") !== null) { // Already processed click trackers
				clickTrackersProcessed = true;
			}
			if (email.getAttribute("trAllowTracking") !== null) { // User has allowed tracking for this email, and this time
				trAllowTracking = true;
			}
			if (email.getAttribute("truiimgs") !== null) { // UI images available in email when processed open trackers
				uiImagesProcessed = email.getAttribute("truiimgs");
				if (uiImagesProcessed !== false) {
					uiImagesProcessed = parseInt(uiImagesProcessed);
				}
			}

			var images = email.getImages();
			var ui_images = email.getUIImages(); // UI images that need to be whitelisted for each email

			var mailTrackers = 0;
			var thisEmailTrackerImages = [];
			var thisEmailSafeImages = [];
			var thisEmailTrackerLinks = [];

			// Open Trackers
			var openTrackerURLs = [];
			if (openTrackersProcessed && (images.length == imagesProcessed) && (ui_images.length == uiImagesProcessed)) {
				mailTrackers += parseInt(email.getAttribute("trotrckrs"));
				// Double check that the images still have the judgment (in case the webmail has changes the src again, this happens in Gmail for unread messages)
				var checkInd = Math.floor(Math.random() * images.length); // Check one of the images by random to confirm that judgment has not been removed by the main app
				if (images.length > 0 && !hasJudgments(images[checkInd])) {
					email.setAttribute("trimgs", 0); // To force reevaluation of images
					logEvent(logPrefix + 'Images will be reevaluated for this email!', true);
				}
				var checkInd = Math.floor(Math.random() * ui_images.length); // Check one of the ui images by random to confirm that judgment has not been removed by the main app
				if (ui_images.length > 0 && !hasJudgments(ui_images[checkInd])) {
					email.setAttribute("truiimgs", 0); // To force reevaluation of images
					logEvent(logPrefix + 'Images will be reevaluated for this email!', true);
				}
			} else { // Process Open Trackers
				logEvent(logPrefix + '=> Evaluating images!', true);
				var mailOpenTrackers = 0;
				var imagesSrcs = [];
				for (var j = 0; j < images.length; j++) imagesSrcs[j] = images[j].src; // Store src for all images
				var isKnownTracker = false;
				for (var i = 0; i < images.length; i++) { // Loop over all images in the email
					var img = images[i];
					// Count repetitions of image URL among images in email -> good for distinguishing design 1x1 images from tracking images
					var reps = 0;
					for (var j = 0; j < imagesSrcs.length; j++)
						if (imagesSrcs[j] == img.src) reps++;

					isProxified = false;
					for (const proxyURL of proxyURLs){
						if ((proxyURL != '') && (img.src.indexOf(proxyURL) > -1)) { // Check if it is proxified
							isProxified = true;
							break;
						}
					}
					
					isKnownTracker = multiMatch(img.src, openDomains); // Check if it is a known tracker
					isWhitelistedURL = webmailInfo.whiteList.length && multiMatch(img.src, webmailInfo.whiteList) && !multiMatch(img.src, webmailInfo.whiteListExcept); // Check if it is whitelisted url

					//console.log('Trocker: Image '+img.src+' has '+reps+ 'reps!'+(isKnownTracker?' is known':' is NOT known')+' - '+(isTiny(img)?' is tiny!':' is NOT tiny.')+' - w:'+getSize(img).w+' - h:'+getSize(img).h);

					removeJudgments(img); // Remove any previous judgment
					if ((isKnownTracker || (((!proxifesImages) || isProxified) && (isTiny(img) || isSusp(img)) && (reps < 5) && !isWhitelistedURL))) {
						if (trAllowTracking) {
							addJudgment(img, 'allowTracking');
						} else {
							if (!isKnownTracker) { // If an unknown tracker
								img.setAttribute("known", "0");
							}
							mailOpenTrackers++;
							openTrackerURLs.push(img.src);
							addJudgment(img, 'suspicious');
							//openTrackerURLs.push(img.src.split("#")[1]);
							//if (img.src.indexOf(suspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+suspMark+'#');
						}
						thisEmailTrackerImages.push(img);
					} else { // Mark non-tracking images
						addJudgment(img, 'non-suspicious');
						//if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
						thisEmailSafeImages.push(img);
					}
				}
				if (images.length || imagesProcessed===false || (images.length != imagesProcessed) || ((env === 'gmail') && email.imagesAreShown())) { // If <Images are displayed>, save this. Otherwise don't save so that we process images later
					email.setAttribute("trotrckrs", mailOpenTrackers);
					email.setAttribute("trimgs", images.length);
					clickTrackersProcessed = false; // Redo click tracker analysis
					newFindings = true;
				}
				mailTrackers += mailOpenTrackers;
				// Whitelist any UI images for this email (attachement image, etc)
				for (var i = 0; i < ui_images.length; i++) { // Loop over all images in the email
					var img = ui_images[i];
					removeJudgments(img); // Remove any previous judgment
					addJudgment(img, 'non-suspicious');
				}
				email.setAttribute("truiimgs", ui_images.length);
			}

			// Link Trackers
			var clickTrackerURLs = [];
			if (clickTrackersProcessed) {
				mailTrackers += parseInt(email.getAttribute("trctrckrs"));
			} else {
				var mailClickTrackers = 0;
				var links = email.getLinks();
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					if (multiMatch(link.href, clickDomains)) {
						thisEmailTrackerLinks.push(link);
						mailClickTrackers++;
						clickTrackerURLs.push(link.href);
					}
				}
				email.setAttribute("trctrckrs", mailClickTrackers);
				mailTrackers += mailClickTrackers;
				newFindings = true;
			}

			trackedSign = email.getTrockerSign((mailTrackers > 0 || trAllowTracking));
			if ((mailTrackers > 0 || trAllowTracking) && newFindings) { // If email has trackers in it
				if (trackedSign !== null) {
					trackedSign.title = '';
					if (trAllowTracking) {
						trackedSign.title += ' Tracking Images: were permitted to work in this email per user request!   ';
					} else {
						if (openTrackerURLs.length > 0) {
							trackedSign.title += openTrackerURLs.length + ' Tracking Images (click if you want to allow them to load this time): ';
							var maxItemsToShow = 5;
							for (var i = 0; i < openTrackerURLs.length; i++) {
								if (i >= maxItemsToShow) {
									trackedSign.title += ', ...   ';
									break;
								} else trackedSign.title += '(' + (i + 1) + ') ' + openTrackerURLs[i] + "   ";
							}
						}
					}
					if (clickTrackerURLs.length > 0) {
						trackedSign.title += clickTrackerURLs.length + ' Tracking Links: ';
						var maxItemsToShow = 5;
						for (var i = 0; i < clickTrackerURLs.length; i++) {
							if (i >= maxItemsToShow) {
								trackedSign.title += ', ...   ';
								break;
							} else trackedSign.title += '(' + (i + 1) + ') ' + clickTrackerURLs[i] + "   ";
						}
					}
					trackedSign.onclick = (event) => {
						event.stopPropagation();
						// Find parent email
						var emails = getOpenEmails();
						for (var ei = 0; ei < emails.length; ei++) {
							var email = emails[ei];
							if (email.mainDOMElem.contains(event.srcElement)) { // is the parent email
								if (email.getAttribute("trAllowTracking") === null) {
									email.setAttribute("trAllowTracking", true);
									email.removeAttribute("trotrckrs"); // To analyze images again
									logEvent(logPrefix + 'Trackers will be allowed for this email!', true);
								} else {
									email.removeAttribute("trAllowTracking");
									email.removeAttribute("trotrckrs"); // To analyze images again
									logEvent(logPrefix + 'Trackers will be blocked for this email!', true);
								}
								break;
							}
						}
					};
				}
			}
			if (thisEmailTrackerLinks.length) logEvent(logPrefix + thisEmailTrackerLinks.length + ' tracked link(s) were found', true);
			if (thisEmailTrackerImages.length) logEvent(logPrefix + thisEmailTrackerImages.length + ' suspicious image(s) were found and blocked', true);
			if (thisEmailSafeImages.length) logEvent(logPrefix + thisEmailSafeImages.length + ' safe-looking image(s) were found', true)

			trackerCount += mailTrackers;
			trackerLinks = trackerLinks.concat(thisEmailTrackerLinks);
			trackerImages = trackerImages.concat(thisEmailTrackerImages);
			safeImages = safeImages.concat(thisEmailSafeImages);
		}

		// Deal with compose windows
		var emails = getDraftEmails(); // Compose windows (reply, forward, new message)
		//console.log('At '+env+'; '+emails.length+' drafts are open...');
		var suspCount = 0;
		for (var ei = 0; ei < emails.length; ei++) {
			var email = emails[ei];
			var logPrefix = 'Draft email ' + (ei + 1) + ' of ' + emails.length + ': ';

			var openTrackersProcessed = false;
			var imagesProcessed = false;
			if (email.getAttribute("trotrckrs") !== null) {
				openTrackersProcessed = true;
			} // Already processed open trackers
			if (email.getAttribute("trimgs") !== null) {
				imagesProcessed = email.getAttribute("trimgs");
			} // Images available in email when processed open trackers

			var images = email.getImages();

			var thisEmailTrackerImages = [];
			var thisEmailSafeImages = [];

			if (openTrackersProcessed && (images.length == imagesProcessed)) {
				mailOpenTrackers += parseInt(email.getAttribute("trotrckrs"));
				// Double check that the images still have the judgment (in case the webmail has changes the src again, this happens in Gmail for unread messages)
				if (images.length > 0 && !hasJudgments(images[0])) {
					email.setAttribute("trimgs", 0); // To force reevaluation of images
					logEvent(logPrefix + 'Images will be reevaluated for this draft email!', true);
				}
			} else {
				var mailOpenTrackers = 0;
				// Only Mark the no suspicious images and leave the suspicious one unmarked so that we don't expose them in compose window
				for (var i = 0; i < images.length; i++) { // Loop over all images in the email
					var img = images[i];
					// Check if it is a known tracker
					if (multiMatch(img.src, openDomains)) isKnownTracker = true;
					else isKnownTracker = false;

					removeJudgments(img); // Remove any previous judgment
					if (isKnownTracker || isTiny(img) || isSusp(img)) {
						addJudgment(img, 'suspicious');
						mailOpenTrackers += 1;
						thisEmailTrackerImages.push(img);
					} else { // Mark non-tracking images
						addJudgment(img, 'non-suspicious');
						//if (img.src.indexOf(nonSuspMark) == -1) img.src = img.src.replace('#', (((img.src.indexOf('?')==-1) || (img.src.indexOf('?') > img.src.indexOf('#')))?'?':'&')+nonSuspMark+'#');
						thisEmailSafeImages.push(img);
					}
				}
				if (images.length) { // save this
					email.setAttribute("trotrckrs", mailOpenTrackers);
					email.setAttribute("trimgs", images.length);
				}
				suspCount += mailOpenTrackers;
			}
			if (thisEmailTrackerImages.length) logEvent(logPrefix + thisEmailTrackerImages.length + ' suspicious image(s) were found and blocked', true);
			if (thisEmailSafeImages.length) logEvent(logPrefix + thisEmailSafeImages.length + ' safe-looking image(s) were found', true)

			trackerCount += mailOpenTrackers;
		}
		if (suspCount) logEvent(suspCount + ' suspicious images were found in the compose windows', false);

		// Whitelist UI elements that are blocked by default and are not separable via address
		// This does not need to repeat with the same period as the rest
		uiWhitelistCounter += 1;
		if (uiWhitelistCounter % 5 == 0) {
			var elems = getUIWhitelistElems();
			for (var ei = 0; ei < elems.length; ei++) {
				var elem = elems[ei];
				var images = elem.querySelectorAll('img');
				for (var i = 0; i < images.length; i++) { // Loop over all images in the ui segment
					var img = images[i];
					// removeJudgments(img); // Remove any previous judgment
					addJudgment(img, 'non-suspicious');
				}
				var bgDivs = elem.querySelectorAll('.bse-bvF-JX-Jw, .aT5-aOt-I-JX-Jw');
				for (var i = 0; i < bgDivs.length; i++) { // Loop over all divs with bg images in the ui segment
					var dv = bgDivs[i];
					if (dv.style.backgroundImage != '') {
						dv.style.backgroundImage = addJudgmentToSrc(dv.style.backgroundImage, 'non-suspicious');
					}
				}
			}
		}
	} else { // The general case
		var logPrefix = 'Across the webpage';
		// Open Trackers
		var images = document.getElementsByTagName('img');
		let imageSrcs = Array.from(images).map(e => e.src).join(' ');
		if (imageSrcs !== imageSrcsBU) {
			for (var i = 0; i < images.length; i++) {
				var img = images[i];

				// Check if it is a known tracker
				if (multiMatch(img.src, openDomains)) isKnownTracker = true;
				else isKnownTracker = false;

				if (isKnownTracker) {
					trackerCount++;
					trackerImages.push(img);
				} else {
					removeJudgments(img); // Remove any previous judgment
					addJudgment(img, 'non-suspicious');
				}
			}
			imageSrcsBU = imageSrcs;
			trackerImageCntBU = trackerImages.length;
		} else {
			trackerCount += trackerImageCntBU;
		}

		// Link Trackers
		var links = document.getElementsByTagName('a');
		let linkUrls = Array.from(links).map(e => e.href).join(' ');
		if (linkUrls !== linkUrlsBU) {
			for (var i = 0; i < links.length; i++) {
				var link = links[i];
				if (multiMatch(link.href, clickDomains)) {
					trackerCount++;
					trackerLinks.push(link);
				}
			}
			linkUrlsBU = linkUrls;
			trackLinkCntBU = trackerLinks.length;
		} else {
			trackerCount += trackLinkCntBU;
		}

		if (trackerLinks.length) logEvent(logPrefix + ' => ' + trackerLinks.length + ' tracked link(s) were found', true);
		if (trackerImages.length) logEvent(logPrefix + ' => ' + trackerImages.length + ' suspicious image(s) were found and blocked', true);
		if (safeImages.length) logEvent(logPrefix + ' => ' + safeImages.length + ' safe-looking image(s) were found', true)
	}

	var gmailUI = getGmailUI();

	if ((options.exposeTrackers) && (gmailUI !== 'print')) {
		prepareCSSRules();

		// Expose Open Trackers
		for (var i = 0; i < trackerImages.length; i++) {
			var img = trackerImages[i];
			// Expose image (wrap the link in a specific span element. Because pseudo elems can't be used with the images themselves.)
			var parent = img.parentNode;
			if ((parent.className != "trexpsd") && (parent.className != "trexpsds") && parent.getAttribute("title") != "trexpsdspnelm") {
				var span = document.createElement('span');
				span.setAttribute("style", "border:0px;width:0px;min-height:0px;margin:0 5px;");
				span.setAttribute("width", "0");
				span.setAttribute("height", "0");
				span.setAttribute("title", "trexpsdspnelm"); // We add this because gmail changes classes but looks like it doesn't change titles
				span.setAttribute("class", "trexpsd");
				if (img.getAttribute("known") === "0") span.setAttribute("class", "trexpsds"); // If unknown tracker
				wrap(span, img);
			} else if (parent.getAttribute("title") == "trexpsdspnelm") { // If already wrapped in an exposer
				parent.setAttribute("class", "trexpsd");
				if (img.getAttribute("known") === "0") parent.setAttribute("class", "trexpsds"); // If unknown tracker
			}
		}

		// Expose Click Trackers
		for (var i = 0; i < trackerLinks.length; i++) {
			var link = trackerLinks[i];
			// Expose the link
			link.classList.add('trexpsdl');
		}

		// Make sure safe images are not exposed
		for (var i = 0; i < safeImages.length; i++) {
			var img = safeImages[i];
			var parent = img.parentNode;
			if (parent.getAttribute("title") == "trexpsdspnelm") { // If wrapped in an exposer based on obsolete judgement
				unwrap(parent);
			}
		}
	}

	// Remove Empty Exposers
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"] :not(img)'); // Unwanted children in exposer spans
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);
	var elems = document.querySelectorAll('span[title="trexpsdspnelm"]:empty'); // Empty exposers
	for (var i = 0; i < elems.length; i++) elems[i].parentNode.removeChild(elems[i]);

	return trackerCount;
}

window.addEventListener("hashchange", function () {
	//alert('hash changed!');
	//checkAndDoYourDuty();
	window.setTimeout(checkAndDoYourDuty, 20); // To respond a little faster after images are loaded	
}, false);

checkAndDoYourDuty();

var env = getEnv();
if ((env === 'gmail') || (env === 'inbox') || (env === 'outlook') || (env === 'outlook2') || (env === 'ymail')) {
	window.setInterval(checkAndDoYourDuty, 500);
} else {
	window.setInterval(checkAndDoYourDuty, 1000);
}
console.log('[Trocker] version: ' + chrome.runtime.getManifest().version);
logEvent('Env="' + env + '"', true);