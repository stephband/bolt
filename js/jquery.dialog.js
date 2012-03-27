//  jquery.dialog.js
//  1.0
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

//  Text for buttons is localisable via jQuery.fn.dialog.text.
//  Other types of dialog can by added to jQuery.fn.dialog.types. A
//  dialog type requires an options property and the methods create,
//  activate and deactivate.

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
	    		create: function(elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css });

	    			options.layer.html(
	    				dialog.html(elem)
	    			);
	    		},
	    		activate: function(e) {
	    			var layer = e.data.layer;
	    			layer.on("click.dialog", e.data, click);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer;
	    			layer.off('click', click);
	    			enableScroll();
	    		}
	    	},

	    	'lightbox': {
	    		options: {
	    			wrapClass: 'lightbox_dialog_layer dialog_layer layer',
	    			'class': 'lightbox_dialog dialog',
	    		},
	    		create: function(elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css }),

	    				// If we don't create the close button this way - if we write out the html
	    				// and have the browser parse it, IE7 cocks up the href, adding the whole
	    				// path in front of it first. Not what we want.
	    				button = jQuery('<a/>', { 'class': "close_button button", href: "#close", html: text.close });

	    			options.layer.html(
	    				dialog
	    				.html(elem)
	    				.append(button)
	    			);
	    		},
	    		activate: function(e) {
	    			var options = e.data,
	    			    layer = options.layer;

	    			layer.on('click.dialog', options, click);
	    			layer.on('click tap', '.close_button', options, close);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var layer = e.data.layer;
	    			layer.off('click', click);
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
	    					'<li><button class="confirm_button button">' + text.ok + '</button></li>' +
	    					'</ul>';

	    			options.layer.html(
	    				dialog
	    				.html(elem)
	    				.append(actions)
	    			);
	    		},
	    		activate: function(e) {
	    			var options = e.data,
	    			    layer = options.layer;

	    			layer.on('click tap', '.confirm_button', options, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var options = e.data,
	    			    layer = options.layer;
	    			
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

	    			options.layer.html(
	    				dialog
	    				.html(elem)
	    				.append(actions)
	    			);
	    		},
	    		activate: function(e) {
	    			var options = e.data,
	    			    layer = options.layer;

	    			layer.on('click tap', '.cancel_button', options, close);
	    			layer.on('click tap', '.confirm_button', options, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(e) {
	    			var options = e.data,
	    			    layer = options.layer;

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
	
	function close(e) {
		var layer = e.data.layer;
		
		layer.trigger('deactivate');
		e.preventDefault();
	}

	function confirm(e) {
		var options = e.data,
		    layer = options.layer;
		
		e.preventDefault();

		// Should there be a callback that returns false, that means cancel
		// the deactivation of the dialog.
		if (options.callback && options.callback.apply(layer[0]) === false) {
			return;
		};

		layer.trigger('deactivate');
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
		obj.create(this, options);

		options.layer
		.appendTo('body')
		.on('activate.dialog', options, obj.activate)
		.on('deactivate.dialog', options, obj.deactivate)
		.on('deactivateend.dialog', options, deactivateend)
		.trigger('activate');

		return this;
	};

	// Expose
	jQuery.fn.dialog.types = types;
	jQuery.fn.dialog.text = text;
})(jQuery);