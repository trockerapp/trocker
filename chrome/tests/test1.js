window.addEventListener('load', function () {
  runTests();
  document.getElementById("showDetailsOpt").onchange = runTests;
});

function runTests() {
  // Test set 1: matching urls as expected
  var resBox = document.getElementsByClassName('urlMatchRes')[0];
  resBox.innerHTML = '';
  var openTrackers = getOpenTrackerList();
  var openTrackerSamples = getOpenTrackerSamples();
  runUrlMatchTests(resBox, openTrackers, openTrackerSamples, 'Open');

  var clickTrackers = getClickTrackerList();
  var clickTrackerSamples = getClickTrackerSamples();
  runUrlMatchTests(resBox, clickTrackers, clickTrackerSamples, 'Click');


  // Test set 2: detection of tiny images as tiny
  var resBox = document.getElementsByClassName('tinyImagesRes')[0];
  resBox.innerHTML = '';
  var images = document.querySelectorAll('.tinyImages img');
  runTinyImageTests(images, resBox, true);

  // Test set 3: detection of normal images as non-tiny
  var resBox = document.getElementsByClassName('normalImagesRes')[0];
  resBox.innerHTML = '';
  var images = document.querySelectorAll('.normalImages img');
  runTinyImageTests(images, resBox, false);
}

function runTinyImageTests(images, resBox, correctAns) {
  var correctAnsText = correctAns ? 'tiny' : 'non-tiny';
  var wrongAnsText = correctAns ? 'non-tiny' : 'tiny';
  var fails = 0;
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    if (img.parentElement.className.indexOf('trexpsd') > -1) {
      var category = img.parentElement.parentElement.title;
    } else {
      var category = img.parentElement.title;
    }

    var failColor = (img.parentElement.getAttribute('failColor')) ? (img.parentElement.getAttribute('failColor')) : '#e55353';
    if ((isTiny(img) || isSusp(img)) == correctAns) resBox.innerHTML += '<span style="background:limegreen;">' + (i + 1) + ') [' + category + '] Correctly detected as ' + correctAnsText + '!</span><br />';
    else {
      resBox.innerHTML += '<span style="background:' + failColor + ';">' + (i + 1) + ') [' + category + '] Incorrectly detected as ' + wrongAnsText + '!</span><br />';
      fails++;
    }
    if (showDetails()) {
      resBox.innerHTML += '<div>HTML: <textarea disabled style="width:100%">' + img.outerHTML + '</textarea></div>';
      var s = getSize(img);
      resBox.innerHTML += '<div>Interpreted size: width = "' + s.w + '", height: "' + s.h + '"</div>';
      resBox.innerHTML += '<div>DOM sizes:';
      resBox.innerHTML += 'img.style.width = "' + img.style.width + '", img.style.minWidth: "' + img.style.minWidth + '", img.style.maxWidth: "' + img.style.maxWidth + '", img.getAttribute("width"): "' + img.getAttribute("width") + '", img.width: "' + img.width + '" <br />';
      resBox.innerHTML += 'img.style.height = "' + img.style.height + '", img.style.minHeight: "' + img.style.minHeight + '", img.style.minHeight: "' + img.style.maxHeight + '", img.getAttribute("height"): "' + img.getAttribute("height") + '", img.height: "' + img.height + '"';
      resBox.innerHTML += '</div><br />';
    }
  }
  resBox.innerHTML += fails + ' (of ' + images.length + ') ' + correctAnsText + ' detection tests failed!<br />';
}

function runUrlMatchTests(resBox, list, samples, prefix) {
  listNum = 0;
  caseFailCount = 0;
  for (var i = 0; i < list.length; i++) {
    var ot = list[i];
    var name = ot.name;
    var testCount = 0;
    var passCount = 0;
    var hitFailCount = 0;
    var missFailCount = 0;
    // Find samples
    for (var j = 0; j < samples.length; j++) {
      if (name == samples[j].name) {
        let thisSamples = samples[j];
        // Check that every hit sample matches some pattern
        for (var url of thisSamples.samples.hit) {
          testCount++;
          hitCnt = 0;
          hitCnt += checkDomainMatches(ot.domains, url);
          hitCnt += checkPatternMatches(ot.patterns, url);
          if (hitCnt > 0) { // At least one pattern matches the url
            // Ok
            passCount++;
          } else {
            hitFailCount++;
          }
        }
        // Check that no miss sample matches any pattern
        for (var url of thisSamples.samples.miss) {
          testCount++;
          hitCnt = 0;
          hitCnt += checkDomainMatches(ot.domains, url);
          hitCnt += checkPatternMatches(ot.patterns, url);
          if (hitCnt == 0) { // None of the patterns matche the url
            // Ok
            passCount++;
          } else {
            missFailCount++;
          }
        }
      }
    }
    if (testCount > 0) {
      listNum += 1;
      if ((hitFailCount + missFailCount) == 0) {
        var bgColor = 'limegreen';
      } else {
        caseFailCount++;
        var bgColor = '#e55353';
      }
      var resHTML = '<span style="background:' + bgColor + ';">' + (listNum) + ') ' + prefix + ' tracker name: "' + name + '" =>  ' + passCount + ' of the ' + testCount + ' tests passed.';
      if (hitFailCount) resHTML += ' ' + hitFailCount + ' track sample urls were not detected as trackers! ';
      if (missFailCount) resHTML += ' ' + missFailCount + ' urls were incorrectly detected as trackers! ';
      resHTML += '</span><br />';
      resBox.innerHTML += resHTML;
    }
  }
  resBox.innerHTML += caseFailCount + ' (of ' + listNum + ') ' + prefix + ' tracker url match tests failed!<br />';
}

function checkDomainMatches(domains, url) {
  hitCnt = 0;
  for (var d of domains) {
    var re = new RegExp(d, 'i');
    if (re.test(url)) {
      hitCnt++;
    }
  }
  return hitCnt;
}

function checkPatternMatches(patterns, url) {
  hitCnt = 0;
  for (var p of patterns) {
    // Convert chrome's url patters to regexp (https://developer.chrome.com/extensions/match_patterns)
    if (p.indexOf('*://') == 0) p = p.replace('*://', 'https?://');
    if (p.indexOf('https?://*.') == 0) p = p.replace('https?://*.', 'https?://(*.)?');
    p = p.replace('.', '\\.');
    p = p.replace('*', '.*');
    var re = new RegExp(p, 'i');
    // Check patterns
    if (re.test(url)) {
      hitCnt++;
    }
  }
  return hitCnt;
}

function showDetails() {
  return document.getElementById("showDetailsOpt").checked;
}
