// ui.site.js
//
// Makes ui components work (ONLY ui things that are NOT dependent
// on the application).

// Handle dropdowns, popups, popdowns and tabs

(function(undefined){
	
	var debug = (window.console && console.log);
	
	var doc = jQuery(document),
			
			clickIndex = 0,
			
			// Store jQuery objects
			objects = {},
			
			handlers = {
				dropdown: openObject,
				popdown: openObject,
				tab: tabHandler
			};
	
	// FUNCTIONS
	
	function closeObject( dropdown ){
		dropdown.state = false;
		dropdown.obj.removeTransitionClass("active");
		dropdown.button.removeClass("active");
	}
	
	function openObject( dropdown ){
		dropdown.state = true;
		dropdown.obj.addTransitionClass("active");
		dropdown.button.addClass("active");
		
		clickIndex++;
		
		doc.bind( 'click.'+clickIndex, clickIndex, function(e){
			var target = jQuery(e.target),
					clickIndex = e.data;
			
			// If this is a popdown and the click is
			// inside it, do nothing.
			if (dropdown.type === 'popdown' &&
			  	jQuery.contains( dropdown.obj[0], e.target )) {
			  return;
			}
			
			// If this is a dropdown, and we've clicked on a file
			// input inside it, wait for the input to change. This
			// is a fix for file inputs not firing change events
			// when they're made invisible. Deserves further investigation.
			if (dropdown.type === 'dropdown' &&
					jQuery.contains( dropdown.obj[0], e.target ) &&
					target.is('input[type="file"]') ) {
				
				target.bind('change', function(e){
					closeObject( dropdown );
					doc.unbind('.'+clickIndex);
				});
				
				return;
			}
			
			closeObject( dropdown );
			doc.unbind('.'+clickIndex);
		});
		
		dropdown.obj.bind( 'deactivate', function(e){
			// Check that the event is coming form this node
			if (e.target !== e.currentTarget) {
				return;
			}
			
			closeObject( dropdown );
			doc.unbind('.'+clickIndex);
		});
	}
	
	function tabHandler( dropdown ){
		var obj = dropdown.obj;
		
		obj.trigger('activate');
	}
	
	function contentHandler( dropdown ){
		var button = dropdown.button,
				obj = dropdown.obj,
				data = dropdown.data,
				buttons, selector, all;
		
		if ( data ) {
			// Ignore clicks on an already active button
			if ( data.activeContent[0] === obj[0] ) { return; }
			
			if ( button.length ) { data.activeButton.removeClass('active'); }
			data.activeContent.removeClass('active');
		}
		else {
			data = {};
			selector = obj.attr('data-tab-selector');
			all = selector ? jQuery(selector) : obj.add( obj.siblings('.tab_content') );
			
			// Give data to all tabs in this tab index
			all.each(function(i){
				var elem = jQuery(this),
						href = '#' + this.id;
				
				dropdown = objects[href];
				
				// Cache the obj against the selector
				if ( dropdown === undefined ) {
					storeObject( href, elem, 'tab' );
					dropdown = objects[href];
				}
				
				dropdown.data = data;
				
				dropdown.button.removeClass('active');
				elem.removeClass('active');
			});
		}
		
		if ( button.length ) { data.activeButton = button; }
		data.activeContent = obj;
		
		button.addClass('active');
		obj.addClass('active');
	};
	
	function storeObject( href, obj, typ ){
		var object = obj || jQuery(href);
		
		// Cache the obj against the selector, or false when
		// there is no object. Buttons can have a many-to-one
		// relationship to objects, so we search for them all.
		
		objects[href] = object.length ? {
			button: jQuery('a[href='+href+']'),
			state: false,
			type: typ || ( object.hasClass('dropdown') ? 'dropdown' :
				object.hasClass('tab_content') ? 'tab' :
				object.hasClass('popdown') ? 'popdown' :
				false
			),
			obj: object
		} : false ;
	}
	
	// RUN
	
	doc
	.delegate('a', 'click', function(e){
		var button = jQuery( e.currentTarget ),
				href = button.attr('href'),
				hashRefFlag = /^#/.test( href ),
				dropdown;
		
		// Don't even bother if the clicked link isn't a hash ref
		if ( !hashRefFlag ) { return; }
		
		// Store the object if it is not already stored
		if ( objects[href] === undefined ) {
			storeObject( href );
		}
		
		dropdown = objects[href];
		
		// Go no further when there is no object to open
		if ( !dropdown || !dropdown.type ) { return; }
		
		// Open the object if is not already open
		if ( !dropdown.state ) { handlers[ dropdown.type ]( dropdown ); }
		
		// Don't let the click do anything browsery.
		e.preventDefault();
	})
	
	.delegate('.tab_content, .popup, .popdown, .dropdown', 'activate', function(e){
		var id = e.currentTarget.id,
				href = '#'+id,
				dropdown = objects[href];
		
		// Store the object if it is not already stored
		if ( dropdown === undefined ) {
			storeObject( href, jQuery( e.currentTarget ) );
			dropdown = objects[href];
		}
		
		contentHandler( dropdown );
	})
	
	// Deactivate popups and popdowns when their close button
	// is clicked.
	
	.delegate('a[href="#close"]', 'click', function(e){
		var dropdown = jQuery(e.target).closest(".popdown, .popup");
		
		if (dropdown.length === 0) {
			return;
		}
		
		dropdown.trigger({ type: "deactivate" });
	})
	
	// Activate the node that corresponds to the hashref
	// in the location bar. 
	
	.ready(function(){
		var href = window.location.hash;
		
		// Check if it's an alphanumeric id selector,
		// not a hash bang.
		if (href && (/^#[a-zA-Z0-9]/.exec(href)) ) {
			// Store the object if it is not already stored
			if ( objects[href] === undefined ) {
				storeObject( href );
			}
			
			dropdown = objects[href];
			
			// Go no further when there is no object to open
			if ( !dropdown || !dropdown.type ) { return; }
			
			// Open the object if is not already open
			if ( !dropdown.state ) { handlers[ dropdown.type ]( dropdown ); }
		}
	});
})();



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
		
		.ready((function(){
			function identify(node){
				// Generate an id, apply it to the input node
				// and return it.
				return (node.id = 'input_' + parseInt(Math.random() * 100000000));
			}
			
			return function(){
				jQuery('textarea[placeholder], input[placeholder]').each(function(i){
					var input = jQuery(this),
							id = this.id || identify(this),
							value = input.val(),
							height = input.outerHeight(),
							position = input.position(),
							text = input.attr('placeholder'),
							placeholder = jQuery('<label/>', {
								html: text,
								'for': id, 
								'class': 'placeholder',
								
								// It's not really my style to be setting CSS in
								// JavaScript, but it seems to make sense here.
								// Let's see how this plays out.
								css: {
									left: position.left,
									height: height,
									lineHeight: height + 'px',
									paddingLeft: input.css('paddingLeft'),
									paddingRight: input.css('paddingRight')
								}
							});
					
					input.after( placeholder );
					
					if ( !value || !value.length ) {
						input.addClass('empty');
					};
				});
			};
		})());
	}
})(document);