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
	    		create: function(layer, elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css });

	    			layer.html(
	    				dialog.html(elem)
	    			);
	    		},
	    		activate: function(layer, options) {
	    			layer.on("click.dialog", layer, click);
	    			disableScroll();
	    		},
	    		deactivate: function(layer, options) {
	    			layer.off('click', click);
	    			enableScroll();
	    		}
	    	},

	    	'lightbox': {
	    		options: {
	    			wrapClass: 'lightbox_dialog_layer dialog_layer layer',
	    			'class': 'lightbox_dialog dialog',
	    		},
	    		create: function(layer, elem, options) {
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
	    		},
	    		activate: function(layer, options) {
	    			layer.on('click.dialog', layer, click);
	    			layer.on('click.dialog tap.dialog', '.close_button', layer, close);
	    			disableScroll();
	    		},
	    		deactivate: function(layer, options) {
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
	    		create: function(layer, elem, options) {
	    			var dialog = jQuery('<div/>', { 'class': options['class'], css: options.css }),
	    				actions = '<ul class="actions_index index">' +
	    					'<li><button class="confirm_button button">' + text.ok + '</button></li>' +
	    					'</ul>';

	    			layer.html(
	    				dialog
	    				.html(elem)
	    				.append(actions)
	    			);
	    		},
	    		activate: function(layer, options) {
	    			layer.on('click tap', '.confirm_button', {layer: layer, callback: options.callback}, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(layer, options) {
	    			layer.off('click tap', confirm);
	    			enableScroll();
	    		}
	    	},

	    	'confirm': {
	    		options: {
	    			wrapClass: 'confirm_dialog_layer dialog_layer layer',
	    			'class': 'confirm_dialog dialog',
	    		},
	    		create: function(layer, elem, options) {
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
	    		},
	    		activate: function(layer, options) {
	    			layer.on('click tap', '.cancel_button', layer, close);
	    			layer.on('click tap', '.confirm_button', {layer: layer, callback: options.callback}, confirm);
	    			disableScroll();
	    		},
	    		deactivate: function(layer, options) {
	    			layer.off('click tap', close);
	    			layer.off('click tap', confirm);
	    			enableScroll();
	    		}
	    	}
	    };
	
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

	function click(e){
		if ( e.currentTarget !== e.target ) { return; }
		
		var layer = e.data;
		
		layer.trigger('deactivate');
		e.preventDefault();
	}
	
	function close(e) {
		var layer = e.data;
		
		layer.trigger('deactivate');
		e.preventDefault();
	}

	function confirm(e) {
		var layer = e.data.layer,
		    callback = e.data.callback;
		
		e.preventDefault();

		// Should there be a callback that returns false, that means cancel
		// the deactivation of the dialog.
		if (callback && callback.apply(layer[0]) === false) {
			return;
		};

		layer.trigger('deactivate');
	}
	
	function activate(e) {
		if (e.currentTarget !== e.target) { return; }

		var options = e.data.options,
		    layer = e.data.layer,
		    type = e.data.type;

		types[type].activate(layer, options);
	}
	
	function deactivate(e) {
		if (e.currentTarget !== e.target) { return; }

		var options = e.data.options,
		    layer = e.data.layer,
		    type = e.data.type;

		types[type].deactivate(layer, options);
	}

	function deactivateend(e) {
		if (e.currentTarget !== e.target) { return; }
		
		var layer = e.data.layer;
		
		layer
		.off('deactivateend', deactivateend)
		.remove();
	}
	
	jQuery.fn.dialog = function(type, options){
		var data, layer, obj;

		if (typeof type !== 'string') {
			options = type;
			type = 'default';
		}

		if (debug) { console.log(type, options); }

		data = {};
		data.type = type;
		data.options = jQuery.extend({}, types[type].options, options);
		data.layer = jQuery('<div/>', { 'class': data.options.wrapClass, css: data.options.wrapCss });

		types[type].create(data.layer, this, data.options);

		data.layer
		.appendTo('body')
		.on('activate.dialog', data, activate)
		.on('deactivate.dialog', data, deactivate)
		.on('deactivateend.dialog', data, deactivateend)
		.trigger('activate');

		return this;
	};

	// Expose
	jQuery.fn.dialog.types = types;
	jQuery.fn.dialog.text = text;
})(jQuery);