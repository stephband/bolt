// ui.site.js

// Run jQuery without aliasing it to $

jQuery.noConflict();

// Handle dropdowns, popdowns and tabs

(function(jQuery, undefined){
	
	var debug = (window.console && console.log);
	
	var doc = jQuery(document),
			objects = {};
	
	function store(selector, options, fn) {
		var object;
		
		// Cache the obj against the selector, or false when
		// there is no object. Buttons can have a many-to-one
		// relationship to objects, so we search for them all.
		
		if ( objects[selector] === undefined ) {
			object = options.object || jQuery(selector);
			
			objects[selector] = object.length ? {
				button: options.button || jQuery('a[href="'+selector+'"]'),
				object: object,
				type: options.type || (
					object.hasClass('dropdown') ? 'dropdown' :
					object.hasClass('tab') ? 'tab' :
					object.hasClass('popdown') ? 'popdown' :
					object.hasClass('popup') ? 'popup' :
					false
				)
			} : false ;
		}
		
		if (objects[selector] && fn) {
			fn(objects[selector].button, objects[selector].object, objects[selector].type);
		}
	}
	
	// !Handlers
	
	var setup = {
		tab: (function(){
			// Keep data about tabs
			var tabsdata = {};
			
			return function(selector, button, object, fn){
				var data = tabsdata[selector],
						contents = object.add(object.siblings('.tab'));
				
				if (data){
					// Ignore clicks on an already active button
					if (data.activeObject[0] === object[0]) { return; }
					
					data.activeObject.trigger('deactivate');
				}
				else {
					data = {};
				
					// Give data to all tabs in this tab index
					contents.each(function(i){
						var elem = jQuery(this),
								selector = '#' + this.id;
						
						tabsdata[selector] = data;
						
						store(selector, { object: elem }, function(button, object){
							object.trigger('deactivate');
							// Hmmm. deactivate has not yet been bound,
							// so the above has no effect.
							button.removeClass('active');
							object.removeTransitionClass('active');
							
						});
					});
				}
				
				data.activeObject = object;
				
				fn && fn();
			};
		})(),
		
		popdown: function(selector, button, object, fn){
			// For popdown and dropdown:
			function click(e) {
				var target = jQuery(e.target);
				
				// If the click is inside it, or is on it, do nothing.
				if (object[0] === e.target || jQuery.contains(object[0], e.target)) {
					return;
				}
				
				object.trigger({ type: 'deactivate' });
				doc.unbind('click', click);
			}
			
			doc
			.bind('click', click);
			
			fn && fn(function(){
				doc.unbind('click', click);
			});
		},
		
		dropdown: function(selector, button, object, fn){
			// For popdown and dropdown:
			function click(e) {
				var target = jQuery(e.target);
				
				// If we've clicked on a file input inside it, wait
				// for the input to change. This is a fix for file
				// inputs not firing change events when they're made
				// invisible. Deserves further investigation.
				if (jQuery.contains( object[0], e.target ) && target.is('input[type="file"]') ) {
					target.bind('change', function(e){
						object.trigger({ type: 'deactivate' });
						doc.unbind('click', click);
					});
					
					return;
				}
				
				object.trigger({ type: 'deactivate' });
				doc.unbind('click', click);
			}
			
			doc
			.bind('click', click);
			
			fn && fn(function(){
				doc.unbind('click', click);
			});
		}
	}
	
	function activate(e) {
		var id = e.currentTarget.id,
				selector = '#'+id;
		
		store(selector, { object: jQuery(e.currentTarget) }, function(button, object, type){
			// Set up based on type
			setup[type] && setup[type](selector, button, object, function(deactivateFn){
				button
				.addClass('active');
				
				object
				.addTransitionClass('active')
				.bind('deactivate', {button: button, object: object, fn: deactivateFn}, deactivate);
			});
		});
	}
	
	function deactivate(e) {
		// Check that the event is coming from this node
		if (e.target !== e.currentTarget) { return; }
		
		e.data.button
		.removeClass('active');
		
		e.data.object
		.removeTransitionClass('active')
		.unbind('deactivate', deactivate);
		
		e.data.fn && e.data.fn();
	}
	
	var actions = {
		'#close': function(button) {
			var object = button.closest('.popup, .popdown, .dropdown, .tab');
			
			object.length && object.trigger('deactivate');
		}
	}
	
	doc
	.delegate('.popup, .popdown, .dropdown, .tab', 'activate', activate)
	.delegate('a', 'click', function(e) {
		var button = jQuery( e.currentTarget ),
				href = button.attr('href'),
				hashRefFlag = /^#/.test( href );
		
		// Don't even bother if the clicked link isn't a hash ref
		if (!hashRefFlag) { return; }
		
		if (actions[href]) { return actions[href](button); }
		
		// Store the object if it is not already stored
		store(href, { button: button }, function(button, object){
			object.trigger('activate');
			
			// Don't let the click do anything browsery.
			e.preventDefault();
		});
	})
	
	// Activate the node that corresponds to the hashref
	// in the location bar. 
	
	.ready(function(){
		var href = window.location.hash;
		
		// Check if it's an alphanumeric id selector (not a hash bang).
		if (!href || !(/^#[a-zA-Z0-9]/.exec(href))) { return; }
		
		store(href, {}, function(button, object){
			object.trigger('activate');
		});
	});
})( jQuery );


// Activate popup

(function( jQuery, undefined ){
	var doc = jQuery(document),
	
	    flashPlaceholder = jQuery('<div/>', {
	    	id: 'flash_video',
	    	html: django.trans.noFlashMessage
	    }),
	
	    actions = {
	    	flash: function(media, fn) {
	    		// Pass the media object in, just for the width and
	    		// height properties.
	    		flashPlaceholder.popup(media);
	    		
	    		swfobject.embedSWF(
	    			window.django.mediaURL + "swf/player.swf",
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


// Handle form elements

(function(document, undefined){
	var doc = jQuery(document);
	
	doc
	
	// Extend the events emitted by input[type='range']
	// nodes with changestart and changeend events.
	
	.delegate('input[type="range"]', 'mousedown touchstart', (function(){
		var endTypes = {
			mousedown: 'mouseup',
			touchstart: 'touchend'
		};
		
		function change(e){
			jQuery(e.target)
			.trigger({ type: 'changestart' })
			.unbind('change', change);
		}
		
		function mouseup(e){
			jQuery(e.target)
			.trigger({ type: 'changeend' })
			.unbind('mouseup', mouseup);
		}
		
		return function(e){
			jQuery(e.target)
			.bind('change', change)
			.bind(endTypes[ e.type ], mouseup);
		};
	})())
	
	// Global form validation
	
	.delegate( 'input, textarea', 'change', function(e) {
		jQuery(this).validate({
			fail: function(){ e.preventDefault(); }
		});
	});
	
	// Create placeholder labels when browser does not
	// natively support placeholder attribute.
	
	if ( !jQuery.support.placeholder ) {
		
		doc
		.delegate('textarea[placeholder], input[placeholder]', 'change valuechange', function(){
			var input = jQuery(this),
					value = input.val();
			
			if ( !value || !value.length ) {
				input.addClass('empty');
			}
			else {
				input.removeClass('empty');
			};
		})
		
		// TODO: bind DOMNodeInserted only at the end of the
		// ready function, as we're not actually interested in
		// processing dom nodes that get inserted before that.
		// Also, find a way of emulating DOMNodeInserted in IE.
		
		.bind('ready DOMNodeInserted', (function(){
			var ignore = false;
			
			function identify(node){
				// Generate an id, apply it to the input node
				// and return it.
				return (node.id = 'input_' + parseInt(Math.random() * 100000000));
			}
			
			return function(e){
				var elem;
				
				//console.log('DOM node inserted', e.target);
				
				if (ignore) { return; }
				
				// Look for nodes with placeholder attributes.
				elem = (
					e.target.getAttribute && e.target.getAttribute('placeholder') ?
						jQuery(e.target) :
					e.target.childNodes.length ?
						jQuery('textarea[placeholder], input[placeholder]', e.target) :
						false
				);
				
				if (!elem || !elem.length) { return; }
				
				console.log('DOM node inserted, needs placeholder', e.target);
				
				elem.each(function(i){
					var input = jQuery(this),
							id, value, height, position, text, placeholder;
					
					// If placeholder already exists, do nothing.
					if (input.data('placeholder')) { return; }
					
					id = this.id || identify(this);
					value = input.val();
					height = input.is('input') ? input.outerHeight() : input.css('lineHeight');
					position = input.position();
					text = input.attr('placeholder');
					placeholder = jQuery('<label/>', {
					  html: text,
					  'for': id, 
					  'class': 'placeholder',
					  
					  // It's not really my style to be setting CSS in
					  // JavaScript, but it seems to make sense here.
					  // Let's see how this plays out.
					  css: {
					  	top: position.top,
					  	left: position.left,
					  	height: height,
					  	lineHeight: height + 'px',
					  	paddingLeft: input.css('paddingLeft'),
					  	paddingRight: input.css('paddingRight')
					  }
					});
					
					// Use ignore to signal that the inserted node is coming
					// from this function!
					ignore = true;
					
					input
					.after(placeholder)
					.data('placeholder', placeholder);
					
					ignore = false;
					
					if (!value || !value.length) {
						input.addClass('empty');
					};
				});
			};
		})());
	}
})(document);


// Define event handlers

(function(jQuery, undefined){

	function prepareDragData(e){
		var elem = jQuery( e.target ),
		    data = elem.data('mimetypes'),
		    mimetype;
	
		if (!data) { return; }
	
		for (mimetype in data){
			ddd('[drag data] mimetype:', mimetype, 'data:', data[mimetype]);
			e.originalEvent.dataTransfer.setData(mimetype, JSON.stringify(data[mimetype]));
		}
	};
	
	function prepareDragFeedback(e){
		var elem = jQuery( e.target ),
		    data = elem.data('feedback'),
		    offset, dragOffset;

		if (data && data.node){
			ddd('[drag feedback] node:', data.node);
			jQuery(document.body).append(data.node);
			e.originalEvent.dataTransfer.setDragImage(data.node, data.width || 32, data.height || 32);
		}
		else {
			offset = elem.offset();
			dragOffset = {
				offsetX: e.pageX - offset.left,
				offsetY: e.pageY - offset.top
			};

			ddd('[drag feedback] offset:', dragOffset);
			e.originalEvent.dataTransfer.setDragImage( e.target, dragOffset.left, dragOffset.top );
			e.originalEvent.dataTransfer.setData( 'webdoc/offset', JSON.stringify(dragOffset) );
		}
	};
	
	jQuery.event.setupHandlers({
		
	});
	
})(jQuery);


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