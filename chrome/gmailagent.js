var pixelblock = (function(){

  var gmail = null,
      safe_pattern  = '?safe-img-pbza#',
      proxy_pattern = 'googleusercontent.com/proxy';

  var blacklist = [{name:'Sidekick',     pattern:'t.signaux',              url:'http://getsidekick.com'},
                   {name:'Sidekick',     pattern:'t.senal',                url:'http://getsidekick.com'},
                   {name:'Sidekick',     pattern:'t.sidekickopen',         url:'http://getsidekick.com'},
                   {name:'Sidekick',     pattern:'t.sigopn',               url:'http://getsidekick.com'},
                   {name:'Banana Tag',   pattern:'bl-1.com',               url:'http://bananatag.com'},
                   {name:'Boomerang',    pattern:'mailstat.us/tr',         url:'http://boomeranggmail.com'},
                   {name:'Cirrus Inisght', pattern:'tracking.cirrusinsight.com', url:'http://cirrusinsight.com'},
                   {name:'Yesware',      pattern:'app.yesware.com',        url:'http://yesware.com'},
                   {name:'Yesware',      pattern:'t.yesware.com',          url:'http://yesware.com'},
                   {name:'Streak',       pattern:'mailfoogae.appspot.com', url:'http://streak.com'},
                   {name:'LaunchBit',    pattern:'launchbit.com/taz-pixel',url:'http://launchbit.com'},
                   {name:'MailChimp',    pattern:'list-manage.com/track',  url:'http://mailchimp.com'},
                   {name:'Postmark',     pattern:'cmail1.com/t',           url:'http://postmarkapp.com'},
                   {name:'iContact',     pattern:'click.icptrack.com/icp/',url:'http://icontact.com'},
                   {name:'Infusionsoft', pattern:'infusionsoft.com/app/emailOpened',  url:'http://infusionsoft.com'},
                   {name:'Intercom',     pattern:'via.intercom.io/o',      url:'http://intercom.io'},
                   {name:'Mandrill',     pattern:'mandrillapp.com/track',  url:'http://mandrillapp.com'},
                   {name:'Hubspot',      pattern:'t.hsms06.com',           url:'http://hubspot.com'},
                   {name:'RelateIQ',     pattern:'app.relateiq.com/t.png', url:'http://relateiq.com'},
                   {name:'RJ Metrics',   pattern:'go.rjmetrics.com',       url:'http://rjmetrics.com'},
                   {name:'Mixpanel',     pattern:'api.mixpanel.com/track', url:'http://mixpanel.com'},
                   {name:'Front App',    pattern:'web.frontapp.com/api',   url:'http://frontapp.com'},
                   {name:'Mailtrack.io', pattern:'mailtrack.io/trace',     url:'http://mailtrack.io'}];

  /*
   * 
   */
  var is_blacklisted = function(img){
    var blacklisted = false;

    // run img src's against our blacklist
    $.each(blacklist, function() {
      if(img.src.indexOf(this.pattern) > 0) {
        img.tracker_info = this;
        blacklisted = true;
      }
    });

    // block all images left over that are 1 x 1 (or less, regardless)
    if (!blacklisted) {
      var elem = $(img)[0];
      // fetch all possible height values
      var w1 = clean_height_width(elem.style.width);
      var w2 = clean_height_width(elem.style.maxWidth);

      var w3 = -1;
      // check if width attr exists (otherwise dom always returns 0)
      if(typeof $(img).attr('width') != 'undefined') {
        w3 = clean_height_width(elem.width) ;
      }

      // fetch all possible width values
      var h1 = clean_height_width(elem.style.height);
      var h2 = clean_height_width(elem.style.maxHeight);

      var h3 = -1;
      // check if height attr exists (otherwise dom always returns 0)
      if(typeof $(img).attr('height') != 'undefined') {
        h3 = clean_height_width(elem.height);
      }

      if ( (w1 == 0 || w1 == 1 || w2 == 0 || w2 == 1 || w3 == 0 || w3 == 1) &&
           (h1 == 0 || h1 == 1 || h2 == 0 || h2 == 1 || h3 == 0 || h3 == 1)
      ) {
        img.tracker_info = {pattern:'', name:'Unknown', url:''};
        blacklisted = true;
      }
    }

    // if blacklisted, hide image (ie. prevent the tracking img from loading)
    if(blacklisted) img.style.display = 'none';
    return blacklisted;
  }

  var clean_height_width = function(x){
    if (x !== "") return parseInt(x, 10);
    return -1;
  }

  /*
   * Whitelist an image, i.e. let it display/load
   */
  var whitelist_image = function(img){
    if(img.src.indexOf(safe_pattern) == -1) img.src = img.src.replace('#', safe_pattern);
  }

  /*
   * 
   */
  var show_tracking_eye = function(email){
    var tracking_images = $(email).find("img[tracker='true']");

    if(tracking_images.length > 0){
      // Add the red eye
      var eye = $('#red-eye').clone();
      //var content = get_popover_content(tracking_images);
      //$(eye).popover({trigger:'click',placement:'bottom', content:content, html:true});

      //$(eye).click( function(e){ e.stopPropagation(); } );
      //$(email).click( function(e){ $(eye).popover('hide'); } );

      eye.show();
      $(email).find('h3.iw').append(eye);// div.gK
    }
  }

  /*
   * 
   */
  var get_popover_content = function(imgs){
    var plural = imgs.length > 1 ? 's':'';
    var content = '<div class="hover-content">';
    content += '<div>Blocked <span style="font-weight:bold;text-decoration:underline;">' + imgs.length + '</span> tracking attempt' + plural + '</div>';
    content += '<div style="margin-top:8px;"><span style="text-decoration:underline;">Source' + plural + '</span>:&nbsp;';

    $.each(imgs, function(index){
      var url = clean_url(this.src);
      if(index > 0) content += ', ';

      if(this.tracker_info.url != ''){
        content += '<a class="tracker-name" href="'+ this.tracker_info.url +'" target="_blank" title="' + this.tracker_info.url  + '">' + this.tracker_info.name + '</a>';
      }else{
        content += '<span class="tracker-name unknown" title="' + url + '">' + this.tracker_info.name + '</span>';
      }
      
    });
    content += '</div></div>';
    return content;
  }

  /*
   * 
   */
  var clean_url = function(url){
    if(url == '' || url.indexOf('#') == -1) return url;
    return url.substring(url.indexOf('#')+1);
  }

  var scan_images = function(){
    try {
      // Note: For some reason gmail.js seems to crash once in a while, add a check to re-init it
      if (typeof gmail == 'undefined') gmail = Gmail();
   
      var body = gmail.dom.email_body();
  
      var emails = $(body[0]).find('div.h7[processed!="true"]');
      // go through all open emails on screen
      for(var x = 0; x < emails.length; x++){
        var email = emails[x], tracking_image_found = false;
  
        // loop over all images in this email
        $("img[src]", email).each(function(){
          var src = this.src;
          if(src.indexOf(proxy_pattern) > 0 && src.indexOf(safe_pattern) == -1){
            if(is_blacklisted(this)){
              this.setAttribute('tracker', 'true');
              tracking_image_found = true;
            }else{
              whitelist_image(this);
            }
          }
        });
  
        // show 'eye'
        if(tracking_image_found) show_tracking_eye(email);
  
        // Handle no images mode
        if($("div.ado", email).length == 0) email.setAttribute('processed', 'true');
      }
    }catch(e){
      console.log('PixelBlock Error: ' + e);
    }
    setTimeout(scan_images, 100);
  }

  var init = function(){
    // add bootstrap.js
    //$('#bs-script').attr('src', $('#bs-script').attr('data-src'));
    // init gmail.js
    gmail = new Gmail();
  }

  var start = function(){
    setTimeout(scan_images, 450);
  }

  return {init:init, start:start};
})();

// check if jquery loaded & initialized
var checkLoaded = function() {
  if(window.jQuery) {
    $.fn.onAvailable = function(e) {
      var t = this.selector;
      var n = this;
      if (this.length > 0) e.call(this);
      else {
        var r = setInterval(function () {
          if ($(t).length > 0) {
            e.call($(t));
            clearInterval(r);
          }
        }, 50);
        
      }
    };
    pixelblock.init();
    pixelblock.start();
  } else {
    setTimeout(checkLoaded, 100);
  }
};
checkLoaded();