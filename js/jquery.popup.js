//	jquery.popup.js
//	0.2
//	Stephen Band
//	
//	Adds a three plugins to the jQuery namespace, giving three
//	flavours of popup dialogue.
//	
//	popup( options )
//	Displays this jQuery object in a popup.
//	
//	alert( options )
//	Displays this jQuery object in a popup, adding an OK button
//	that closes the popup like a close button.
//	
//	confirm( fn, options )
//	Displays this jQuery object in a popup, adding OK and Cancel
//	buttons. The first parameter is a callback that is fired
//	when the OK button is clicked, or when a 'confirm' event is
//	triggered on the popup.
//	
//	Options:
//	popupClass: str - classes to add to the popup's wrapper.
//	showCallback: fn - called when popup is appended to the DOM.
//	hideCallback: fn - called when popup is removed from the DOM.
//	confirmCallback: fn - called when a #confirm button is clicked.
//	
//	Events:
//	Programmatically close or confirm a popup by triggering these
//	events on it:
//	'close'
//	'confirm'

(function(jQuery, undefined){
	var debug = (window.console && console.log);
	
	var plugin = 'popup',
			
			options = {
				layerClass: 'popup_layer layer',
				popupClass: 'popup'
			};
	
	function show( popup, fn, context ) {
		popup
		.appendTo('body')
		.addTransitionClass('active');
		
		return fn && fn.call( context );
	}
	
	function hide( popup, fn, context ) {
		popup
		.removeTransitionClass('active', function(){
			popup.remove();
			fn && fn.call( context );
		});
	}
	
	// .popup() wraps this collection in a layer that acts as
	// a screen behind the popup, then appends it to the body.
	
	jQuery.fn[plugin] = function(o){
		var options = jQuery.extend({
		      context: this
		    }, jQuery.fn[plugin].options, o),
				layer = jQuery('<div/>', {
					'class': options.layerClass
				}),
				wrap = jQuery('<div/>', {
				  'class': options.popupClass
				});
		
		layer
		.data('popup', options)
		.html(
			wrap.html( this )
		);
		
		show( layer, options.showCallback, this );
		
		return this;
	};
	
	// .alert() automatically adds an 'OK' button to this 
	// collection, then calls .popup() on it.
	
	jQuery.fn.alert = function(o){
		return this
		.add('<ul class="horizontal buttons_index index"><li><a class="confirm_button medium_button level1_button button" href="#close">OK</a></li></ul>')
		.popup(o);
	};
	
	// .confirm() automatically adds 'OK' and 'Cancel' buttons
	// to this collection, then calls .popup() on it.
	
	jQuery.fn.confirm = function(fn, o){
		var options = jQuery.extend({
					confirmCallback: fn,
					confirmButtonText: "OK",
					confirmButtonClass: ""
				}, o);
		
		return this
		.add('<ul class="horizontal buttons_index index"><li><a class="'+options.confirmButtonClass+'confirm_button medium_button level1_button button" href="#confirm">'+options.confirmButtonText+'</a></li><li><a class="cancel_button button" href="#close">Cancel</a></li></ul>')
		.popup(options);
	};
	
	// Listen for events coming from popup buttons and the
	// popup_layer.
	//
	// TODO: This is all a bit verbose, we can probably
	// factor this a bit...
	
	jQuery(document)
	.delegate(".popup_layer", "click.popup", function(e){
		var layer = jQuery( e.currentTarget ),
				options = layer.data('popup');
		
		if ( e.currentTarget !== e.target ) { return };
		 
		hide( layer, options.hideCallback, options.context );
		e.preventDefault();
	})
	.delegate(".popup_layer", "close.popup", function(e){
		var layer = jQuery( e.currentTarget ),
				options = layer.data('popup');
		
		hide( layer, options.hideCallback, options.context );
		e.preventDefault();
	})
	.delegate(".popup a[href='#close']", "click.popup", function(e){
		var layer = jQuery(this).closest('.popup_layer'),
				options = layer.data('popup');
		
		hide( layer, options.hideCallback, options.context );
		e.preventDefault();
	})
	.delegate(".popup_layer", "confirm.popup", function(e){
		var layer = jQuery( e.currentTarget ),
				options = layer.data('popup');
		
		options && options.confirmCallback && options.confirmCallback.call( options.context );
		hide( layer, options.hideCallback, options.context );
		e.preventDefault();
	})
	.delegate(".popup a[href='#confirm']", "click.popup", function(e){
		var layer = jQuery(this).closest('.popup_layer'),
				options = layer.data('popup');
		
		options && options.confirmCallback && options.confirmCallback.call( options.context );
		hide( layer, options.hideCallback, options.context );
		e.preventDefault();
	}).keypress(function(e){
    if(e.keyCode==27){
      var layer   = jQuery(".popup_layer.layer.active"),
				  options = layer.data('popup');
				if (layer.length !== 0) {
		      hide( layer, options.hideCallback, options.context );
		    }
    }
  });
  
	// Expose
	jQuery.fn[plugin].options = options;
	
})(jQuery);