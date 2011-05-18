// Activate popup

(function( jQuery, undefined ){
	var doc = jQuery(document),
	
			flashPlaceholder = jQuery('<div/>', {
				id: 'flash_video',
				html: 'Flash not installed. Get it <a href="http://adobe.com/flashplayer">here</a>.'
			}),
	
			actions = {
				flash: function(media, fn) {
					// Pass the media object in, just for the width and
					// height properties.
					flashPlaceholder.popup(media);
					
					swfobject.embedSWF(
						django.mediaURL + "swf/player.swf",
						'flash_video',
						media.width,
						media.height,
						"9.0.45",
						window.django.mediaURL + "swf/expressInstall.swf",
						media.flashvars,
						media.params,
						{ align: "middle" }
					);
				}
			};
	
	doc
	.delegate('a[href="#popup"]', 'click', function(e) {
		var link = jQuery(this),
				media = link.data('json'),
				placeholder;
		
		if (!media) { return; }
		
		actions[media.type](media);
		
		e.preventDefault();
	});
})( jQuery );


// Tweet this page

//jQuery(document)
//.delegate('.window', 'click', function(e) {
//	var width	 = 575,
//			height = 400,
//			win = $(window),
//			left	 = (win.width()	 - width)	 / 2,
//			top		 = (win.height() - height) / 2,
//			url		 = e.target.href,
//			opts	 = 'status=1' +
//							 ',width='	+ width	 +
//							 ',height=' + height +
//							 ',top='		+ top		 +
//							 ',left='		+ left;
//	
//	window.open(url, 'twitter', opts);
//	e.preventDefault();
//});


//mbi: csrf injection
jQuery(document.documentElement).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
        // Only send the token to relative URLs i.e. locally.
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});