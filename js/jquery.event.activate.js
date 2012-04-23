// jquery.event.activate
// 
// Provides activate and deactivate special events for controlling
// active state of dropdowns, tabs, dialogs and other on/off state
// interface elements. Elements with special functions can be added
// to the list of classes by extending the object:
// 
// jQuery.event.special.activate.classes
// 
// For dynamic apps where buttons are added and removed from the
// DOM, turn element caching off:
// 
// jQuery.event.special.activate.cache = false;

(function(jQuery, undefined){
	var debug = true, //(window.debug === undefined ? (window.console && window.console.log) : window.debug),
	    
	    classes = {},
	    
	    options = {
	    	cache: true
	    };
	
	function returnTrue() {
		return true;
	}
	
	function cacheData(target) {
		var id = target.id,
		    data = jQuery.data(target, 'active'),
		    c;
		
		if (!data) {
			data = {
				elem: jQuery(target),
				buttons: options.cache && id && jQuery('a[href="#'+id+'"]')
			};
			
			for (c in classes) {
				if (data.elem.hasClass(c)) {
					data.type = c;
				}
			}
			
			jQuery.data(target, 'active', data);
		}
		
		return data;
	}

	jQuery.event.special.activate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;
			
			function activate() {
				elem.addTransitionClass('active', function() {
					elem.trigger('activateend');
				});
				
				buttons = ((options.cache && data.buttons) || (e.target.id && jQuery('a[href="#'+e.target.id+'"]')));
				
				if (buttons) {
					buttons.addClass('active');
				}

				data.state = true;
			}

			// Don't do anything if elem is already active
			if (data.state) { return; }
			
			if (debug) { console.log('[activate] default | target:', e.target.id, 'data:', data, classes); }
			
			if (classes[data.type] && classes[data.type].activate) {
				classes[data.type].activate(e, data, activate);
			}
			else {
				activate();
			}
		},
		
		options: options,
		classes: classes
	};
	
	jQuery.event.special.deactivate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;

			function deactivate() {
				data.state = false;
				
				elem.removeTransitionClass('active', function() {
					elem.trigger('deactivateend');
				});
	
				buttons = ((options.cache && data.buttons) || (e.target.id && jQuery('a[href="#'+e.target.id+'"]')));
				
				if (buttons) {
					buttons.removeClass('active');
				}
			}

			// Don't do anything if elem is already inactive
			if (!data.state) { return; }

			if (debug) { console.log('[deactivate] default | target:', e.target.id, 'active:', data.state); }

			if (classes[data.type] && classes[data.type].deactivate) {
				classes[data.type].deactivate(e, data, deactivate);
			}
			else {
				deactivate();
			}

		},
		
		options: options,
		classes: classes
	};
	
	jQuery(document).ready(function(){
		var id = window.location.hash,
		    classlist = '.' + Object.keys(classes).join('.active, .') + '.active';
		
		// Setup all things that should start out active. By limiting
		// this to only special classes, we avoid buttons sending out
		// activate events.
		jQuery(classlist).trigger('activate');
		
		// Activate the node that corresponds to the hashref
		// in the location bar, checking if it's an alphanumeric
		// id selector (not a hash bang).
		if (!id || !(/^#[\w\d]/.test(id))) { return; }
		
		jQuery(id).trigger('activate');
	});
})(jQuery);