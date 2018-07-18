var resBox = document.getElementsByClassName('resBox')[0];
var images = document.querySelectorAll('.tinyImages img');
var fails = 0;
for (var i=0; i<images.length; i++) {
	var category = images[i].parentElement.title;
	var failColor = (images[i].parentElement.getAttribute('failColor'))?(images[i].parentElement.getAttribute('failColor')):'#e55353';
	if (isTiny(images[i])) resBox.innerHTML += '<span style="background:limegreen;">'+i+') ['+category+'] Correctly detected as tiny!</span><br />';
	else {
		resBox.innerHTML += '<span style="background:'+failColor+';">'+i+') ['+category+'] Incorrectly detected as non-tiny!</span><br />';
		fails++;
	}
}
resBox.innerHTML += fails+' (of '+images.length+') tiny detection tests failed!<br /><hr />';
var fails = 0;
var images = document.querySelectorAll('.normalImages img');
for (var i=0; i<images.length; i++) {
	var category = images[i].parentElement.title;
	var failColor = (images[i].parentElement.getAttribute('failColor'))?(images[i].parentElement.getAttribute('failColor')):'#e55353';
	if (isTiny(images[i])==false) resBox.innerHTML += '<span style="background:limegreen;">'+i+') ['+category+'] Correctly detected as non-tiny!</span><br />';
	else {
		resBox.innerHTML += '<span style="background:'+failColor+';">'+i+') ['+category+'] Incorrectly detected as tiny!</span><br />';
		fails++;
	}
}
resBox.innerHTML += fails+' (of '+images.length+') non-tiny detection tests failed!<br /><hr />';
