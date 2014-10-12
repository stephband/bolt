//  jquery.dialog.js
//  1.1
//  Stephen Band

//  Dependencies
//  jquery.event.activate
//  jquery.event.activate.dialog
  
//  .dialog(role, options)
//  Displays current jQuery object in a dialog. Both role and options
//  are optional.

//  role:
//  default:  Basic dialog, prevents scrolling, and closes when
//            background layer is clicked.
//  lightbox: Adds a Close button, prevents scrolling, and closes
//            when background layer is clicked.
//  alert:    Adds an Ok button, prevents scrolling, and calls
//            options.callback when the Ok button is clicked.
//  confirm:  Adds Ok and Cancel buttons, prevents scrolling, and
//            calls options.callback when the Ok button is clicked.

//  options:
//  layerClass: Classes to add to background layer.
//  layerCss: CSS to add to background layer.
//  class: Classes to add to dialog box.
//  css: CSS to add to dialog box.

//  Events:
//  activate
//	deactivate

//  Text for buttons is localisable via jQuery.fn.dialog.text.
//  Dialog roles can by added to jQuery.fn.dialog.roles.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.event.activate'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false; //(window.console && console.log);
	
	var text = {
	    	ok: 'Ok',
	    	cancel: 'Cancel',
	    	close: 'Close'
	    },

	    roles = {
	    	_default: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'dialog'
	    		    });

	    		return box.html(elem);
	    	},

	    	slides: function(elem, options) {
					var box = jQuery('<div/>', {
					    	'class': options['class'] || 'slides_dialog dialog'
					    }),
					
					    button = jQuery.fn.dialog.closeButton.clone();

					return box.html(elem).append(button);
	    	},

	    	lightbox: function(elem, options) {
					var box = jQuery('<div/>', {
					    	'class': options['class'] || 'lightbox_dialog dialog'
					    }),
					    
					    button = jQuery.fn.dialog.closeButton.clone();

					return box.html(elem).append(button);
	    	},

	    	alert: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'alert_dialog dialog'
	    		    }),

	    		    actions = '<ul class="action-index index">' +
	    		    	'<li><button class="confirm_button button">' + text.ok + '</button></li>' +
	    		    	'</ul>';

	    		return box.html(elem).append(actions);
	    	},

	    	confirm: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'confirm_dialog dialog'
	    		    }),

	    		    actions = '<ul class="action-index index">' +
	    		    	'<li><a class="cancel_button button" href="#cancel">' + text.cancel + '</a></li>' +
	    		    	'<li><a class="confirm_button button" href="#confirm">' + text.ok + '</a></li>' +
	    		    	'</ul>';

	    		return box.html(elem).append(actions);
	    	}
	    };

	function deactivate(e) {
		if (e.currentTarget !== e.target) { return; }

		var options = e.data;

		return (options.callback && e.dialogAction && e.dialogAction === 'confirm') ?
			options.callback() :
			undefined ;
	}

	function deactivateend(e) {
		if (e.currentTarget !== e.target) { return; }

		jQuery(e.target)
		.off('deactivateend', deactivateend)
		.remove();
	}
	
	jQuery.fn.dialog = function(role, options){
		var dialog, box;

		if (typeof role !== 'string') {
			options = role;
			role = undefined;
		}

		if (debug) { console.log(role, options); }

		if (role !== undefined && !roles[role]) {
			if (debug) { console.log('[dialog] Invalid dialog role \'' + role + '\'. Using default dialog.'); }
			role = undefined;
		}

		options = jQuery.extend({}, options);

		dialog = jQuery('<div/>', {
			'class': options.layerClass || ((role ? (role + '_dialog_layer dialog_layer') : 'dialog_layer') + ' layer')
		});

		box = roles[role || '_default'](this, options);
		
		box
		.attr('tabindex', '-1')
		.attr('role', 'dialog');
		
		dialog
		.html(box)
		.appendTo('body')
		.on('deactivate.dialog', options, deactivate)
		.on('deactivateend.dialog', deactivateend)
		// data.elem is also used by jquery.event.activate. Might
		// as well keep it.
		.data('elem', dialog)
		.trigger({ type: 'activate', relatedTarget: options.relatedTarget });

		return dialog;
	};

	// Expose
	jQuery.fn.dialog.roles = roles;
	jQuery.fn.dialog.text = text;
	
	// If we don't create the close button this way - if we write out the html
	// and have the browser parse it, IE7 cocks up the href, adding the whole
	// path in front of it first. Not what we want.
	jQuery.fn.dialog.closeButton = jQuery('<a/>', {
		'class': "close-thumb thumb",
		'href': "#close",
		'html': text.close
	});
});