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
// jQuery.event.special.activate.settings.cache = false;

(function(jQuery, undefined){
	var debug = false, //(window.debug === undefined ? (window.console && window.console.log) : window.debug),
	    
	    classes = {},
	    
	    settings = {
	    	cache: true
	    };
	
	function returnTrue() {
		return true;
	}
	
	function getRoleClass(node) {
		var classList = node.className.split(/\s+/),
		    l = classList.length,
		    i = -1;

		while (i++ < l) {
			if (classes[classList[i]]) {
				return classList[i];
			}
		}
	}

	function cacheData(target) {
		var data = jQuery.data(target, 'active'),
		    id;
		
		if (!data) {
			id = target.id;

			data = {
				elem: jQuery(target),
				buttons: settings.cache && id && jQuery('a[href="#'+id+'"]')
			};
			
			data.role = data.elem.data('role') || getRoleClass(target);
			
			jQuery.data(target, 'active', data);
		}
		
		return data;
	}

	function findButtons(data, fn) {
		var id = data.elem[0].id,
		    buttons = ((settings.cache && data.buttons) || (id && jQuery('a[href="#' + id + '"]')));
		
		if (buttons && buttons.length) { fn(buttons); }
	}

	jQuery.event.special.activate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    role = data.role,
			    obj = classes[role];
			
			function activate() {
				elem.addTransitionClass('active', function() {
					elem.trigger('activateend');
					if (obj && obj.activateend) { obj.activateend(e, data); }
				});
				
				findButtons(data, function(buttons) {
					buttons.addClass('active');
				});

				data.state = true;
			}

			// Don't do anything if elem is already active
			if (data.state) { return; }
			
			if (debug) { console.log('[activate] default | target:', e.target.id, 'data:', data, classes); }
			
			if (obj && obj.activate) {
				obj.activate(e, data, activate);
			}
			else {
				activate();
			}
		},
		
		settings: settings,
		classes: classes
	};
	
	jQuery.event.special.deactivate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    role = data.role,
			    obj = classes[role];

			function deactivate() {
				data.state = false;
				
				elem.removeTransitionClass('active', function() {
					elem.trigger('deactivateend');
					if (obj && obj.deactivateend) { obj.deactivateend(e, data); }
				});
	
				findButtons(data, function(buttons) {
					buttons.removeClass('active');
				});
			}

			// Don't do anything if elem is already inactive
			if (!data.state) { return; }

			if (debug) { console.log('[deactivate] default | target:', e.target.id, 'active:', data.state); }

			if (obj && obj.deactivate) {
				obj.deactivate(e, data, deactivate);
			}
			else {
				deactivate();
			}
		},
		
		settings: settings,
		classes: classes
	};
	
	jQuery(document).ready(function(){
		var id = window.location.hash,
		    classArray = Object.keys(classes),
		    classList;

		if (classArray.length) {
			// Setup all things that should start out active. By limiting
			// this to only special classes, we avoid buttons sending out
			// activate events.
			classList = '.' + classArray.join('.active, .') + '.active';
			jQuery(classList).trigger('activate');
		}

		// Activate the node that corresponds to the hashref
		// in the location bar, checking if it's an alphanumeric
		// id selector (not a hash bang).
		if (!id || !(/^#[\w\d]/.test(id))) { return; }

		jQuery(id).trigger('activate');
	});
})(jQuery);