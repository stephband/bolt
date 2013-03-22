// jquery.event.activate
// 
// Provides activate and deactivate special events for controlling
// active state of dropdowns, tabs, dialogs and other on/off state
// of buttons.
// 
// For dynamic apps where buttons are added and removed from the
// DOM, turn element caching off:
// 
// jQuery.event.special.activate.settings.cache = false;

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([
			'jquery',
			(window.ie7 || window.ie8 || window.ie9) ?
				'./jquery.transition.ie' :
				'./jquery.transition.fallback'
		], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false,//true,
	    
	    activeClass = "active",
	    onClass = "on",
	    
	    location = window.location,
	    
	    settings = {
	    	cache: true
	    };
	
	function returnTrue() {
		return true;
	}

	function sameOrigin() {
		var node = this;
		
		return node.host === location.host &&
		       // IE gives us node.pathname without a leading slash, so
		       // lop it off location.pathname before comparing.
		       node.pathname === location.pathname.replace(/^\//, '');
	}

	function findButtons(id) {
		return jQuery('a[href$="#' + id + '"]').filter(sameOrigin);
	}

	function cacheData(target) {
		var data = jQuery.data(target),
		    id = target.id;
		
		if (!data.elem) { data.elem = jQuery(target); }
		if (!data.buttons) { data.buttons = settings.cache && id && findButtons(id); }
		
		return data;
	}

	function getButtons(data) {
		return (settings.cache && data.buttons) || (data.elem[0].id && findButtons(data.elem[0].id));
	}

	jQuery.event.special.activate = {
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;
			
			// Don't do anything if elem is already active
			if (data.active) { return; }
			data.active = true;
			
			if (debug) { console.log('[activate] default | target:', e.target.id, 'data:', data); }
			
			elem.addTransitionClass(activeClass, function() {
				elem.trigger('activateend');
			});
			
			buttons = getButtons(data);
			
			if (buttons) {
				buttons.addClass(onClass);
			}
		},
		
		settings: settings
	};
	
	jQuery.event.special.deactivate = {
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;

			// Don't do anything if elem is already inactive
			if (!data.active) { return; }
			data.active = false;
			
			if (debug) { console.log('[deactivate] default | target:', e.target.id, 'data:', data); }
			
			elem.removeTransitionClass(activeClass, function() {
				elem.trigger('deactivateend');
			});

			buttons = getButtons(data);
			
			if (buttons) {
				buttons.removeClass(onClass);
			}
		},
		
		settings: settings
	};
	
	jQuery(document).ready(function(){
		var id = window.location.hash;
		
		// Setup all things that should start out active.
		jQuery('.' + activeClass).trigger('activate');

		// Activate the node that corresponds to the hashref in
		// location.hash, checking if it's an alphanumeric id selector
		// (not a hash bang).
		if (!id || !(/^#\S+$/.test(id))) { return; }
		
		// The id may be perfectly valid, yet not be supported by jQuery,
		// such as ids with a ':' character, so try...catch it.
		try {
			jQuery(id).trigger('activate');
		}
		catch (e) {
			if (debug) console.log('Error caught: id hash ' + id + ' is throwing an error in jQuery');
		}
	});
});