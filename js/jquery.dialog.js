//  jquery.dialog.js
//  0.6
//  Stephen Band
  
//  dialog(Type, Options)
//  Displays current jQuery object in a dialog. Both Type and Options
//  are optional.

//  Type:
//  default:  Basic dialog, prevents scrolling, and closes when
//            background layer is clicked.
//  lightbox: Adds a Close button, prevents scrolling, and closes
//            when background layer is clicked.
//  alert:    Adds an Ok button, prevents scrolling, and calls
//            options.callback when the Ok button is clicked.
//  confirm:  Adds Ok and Cancel buttons, prevents scrolling, and
//            calls options.callback when the Ok button is clicked.

//  Options:
//  wrapClass: Classes to add to background layer.
//  class: Classes to add to popup content box.

//  Events:
//  activate
//	deactivate

(function(jQuery, undefined){
	var debug = (window.console && console.log);
	
	var doc = jQuery(document),
		
	    docElem = jQuery(document.documentElement),

	    text = {
	    	ok: 'Ok',
	    	cancel: 'Cancel',
	    	close: 'Close'
	    },

	    types = {
	    	'default': {
	    		options: {
	    			wrapClass: 'dialog_layer layer',
	    			'class': 'dialog'
	    		},
	    		create: function(elem, layer, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css });

	    			layer.html(
	    				dialog.html(elem)
	    			);

	    			return layer;
	    		},
	    		activate: function(e) {
	    			var layer = e.data.layer;
	    			layer.on("click.dialog", layer, click);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer.layer;
	    			layer.off('click', click);
	    			enableScroll();
	    		}
	    	},

	    	'lightbox': {
	    		options: {
	    			wrapClass: 'lightbox_dialog_layer dialog_layer layer',
	    			'class': 'lightbox_dialog dialog',
	    		},
	    		create: function(elem, layer, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css }),

	    				// If we don't create the close button this way - if we write out the html
	    				// and have the browser parse it, IE7 cocks up the href, adding the whole
	    				// path in front of it first. Not what we want.
	    				button = jQuery('<a/>', { 'class': "close_button button", href: "#close", html: text.close });

	    			layer.html(
	    				dialog
	    				.html(elem)
	    				.append(button)
	    			);

	    			return layer;
	    		},
	    		activate: function(e) {
	    			var layer = e.data.layer;
	    			layer.bind('click.dialog', layer, click);
	    			layer.on('click tap', '.close_button', layer, close);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer;
	    			layer.unbind('click', click);
	    			layer.off('click tap', close);
	    			enableScroll();
	    		}
	    	},

	    	'alert': {
	    		options: {
	    			wrapClass: 'alert_dialog_layer dialog_layer layer',
	    			'class': 'alert_dialog dialog',
	    		},
	    		create: function(elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css }),
	    				actions = '<ul class="actions_index index">' +
	    					'<li><a class="confirm_button button" href="#confirm">' + text.ok + '</a></li>' +
	    					'</ul>';

	    			layer.html(
	    				dialog
	    				.html(elem)
	    				.append(actions)
	    			);

	    			return layer;
	    		},
	    		activate: function(e) {
	    			var layer = e.data.layer;
	    			layer.on('click tap', '.confirm_button', layer, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer;
	    			layer.off('click tap', confirm);
	    			enableScroll();
	    		}
	    	},

	    	'confirm': {
	    		options: {
	    			wrapClass: 'confirm_dialog_layer dialog_layer layer',
	    			'class': 'confirm_dialog dialog',
	    		},
	    		create: function(elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css }),
	    				actions = '<ul class="actions_index index">' +
	    					'<li><a class="cancel_button button" href="#cancel">' + text.cancel + '</a></li>' +
	    					'<li><a class="confirm_button button" href="#confirm">' + text.ok + '</a></li>' +
	    					'</ul>';

	    			layer.html(
	    				dialog
	    				.html(elem)
	    				.append(actions)
	    			);

	    			return layer;
	    		},
	    		activate: function(e) {
	    			var layer = e.data.layer;
	    			layer.on('click tap', '.cancel_button', layer, close);
	    			layer.on('click tap', '.confirm_button', layer, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer;
	    			layer.off('click tap', close);
	    			layer.off('click tap', confirm);
	    			enableScroll();
	    		}
	    	}
	    };
	
	function click(e){
		if ( e.currentTarget !== e.target ) { return; }
		
		var layer = e.data.layer;
		
		layer.trigger('deactivate');
		e.preventDefault();
	}
	
	function clickClose(e) {
		var layer = e.data.layer;
		
		layer.trigger('deactivate');
		e.preventDefault();
	}

	function disableScroll() {
		var scrollLeft = docElem.scrollLeft(),
			scrollTop = docElem.scrollTop();
		
		// Remove scrollbars from the documentElement
		docElem.css({ overflow: 'hidden' });
		
		// FF has a nasty habit of linking the scroll parameters
		// of document with the documentElement, causing the page
		// to jump when overflow is hidden on the documentElement.
		// Reset the scroll position.
		if (scrollTop) { docElem.scrollTop(scrollTop); }
		if (scrollLeft) { docElem.scrollLeft(scrollLeft); }
	}

	function enableScroll() {
		var scrollLeft = docElem.scrollLeft(),
			scrollTop = docElem.scrollTop();
		
		// Put scrollbars back onto docElem
		docElem.css({ overflow: '' });
		
		// FF fix. Reset the scroll position.
		if (scrollTop) { docElem.scrollTop(scrollTop); }
		if (scrollLeft) { docElem.scrollLeft(scrollLeft); }
	}
	
	function deactivateend(e) {
		if (e.currentTarget !== e.target) { return; }
		
		var layer = e.data.layer;
		
		layer
		.off('deactivateend', deactivateend)
		.remove();
	}
	
	jQuery.fn.dialog = function(type, options){
		var options, dialog, box;

		if (typeof type !== 'string') {
			options = type;
			type = 'default';
		}

		if (debug) { console.log(type, options, jQuery.fn.dialog.types[type]); }

		obj = types[type];
		options = jQuery.extend({}, obj.options, options);
		options.layer = jQuery('<div/>', { 'class': options.wrapClass, css: options.wrapCss });
		obj.create(this, layer, options);

		options.layer
		.appendTo('body')
		.on('activate.dialog', options, obj.activate)
		.on('deactivate.dialog', options, obj.deactivate)
		.trigger('activate');

		return this;
	};

	// Expose
	jQuery.fn.dialog.types = types;
	jQuery.fn.dialog.text = text;
})(jQuery);