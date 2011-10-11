// jquery.event.activate
// 
// Provides activate and deactivate events for controlling
// on/off state of dropdowns, tabs, popups or whatever else
// can be enabled by adding the class 'active'.

(function(jQuery, undefined){
	var debug = (window.console && window.console.log);
	
	function returnTrue() {
		return true;
	}
	
	function cacheData(target) {
		var id = target.id,
		    data = jQuery.data(target, 'active');
		
		if (!data) {
			data = {
<<<<<<< HEAD
			  elem: jQuery(target),
			  
			  // Don't store buttons if the id is falsy
			  buttons: id && jQuery('a[href="#'+id+'"]')
			}
=======
				elem: jQuery(target)
			};
>>>>>>> 256e23d... Removes caching of links that point to activate able nodes. Good for dynamic content. Bad for speed. Speed should not really be an issue unless we have hundreds and hundreds of links on a page.
			
			jQuery.data(target, 'active', data);
		}
		
		return data;
	}
	
	jQuery.event.special.activate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target);
			
			if (debug) { console.log('[activate] default | target:', e.target.id, 'active:', data.state); }
			
			// Don't do anything if elem is already active
			if (data.state) { return; }
			
<<<<<<< HEAD
			data.elem.addTransitionClass('active');
			data.buttons && data.buttons.addClass('active');
=======
>>>>>>> 256e23d... Removes caching of links that point to activate able nodes. Good for dynamic content. Bad for speed. Speed should not really be an issue unless we have hundreds and hundreds of links on a page.
			data.state = true;
			data.elem.addTransitionClass('active');
			jQuery('a[href="#'+e.target.id+'"]').addClass('active');
		}
	};
	
	jQuery.event.special.deactivate = {
		
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		
		_default: function(e) {
			var data = cacheData(e.target);
			
			if (debug) { console.log('[deactivate] default | target:', e.target.id, 'active:', data.state); }
			
			// Don't do anything if elem is already inactive
			if (!data.state) { return; }
			
<<<<<<< HEAD
			if (debug) { console.log('[deactivate] default | target:', e.target.id); }
			
			data.elem.removeTransitionClass('active');
			data.buttons && data.buttons.removeClass('active');
=======
>>>>>>> 256e23d... Removes caching of links that point to activate able nodes. Good for dynamic content. Bad for speed. Speed should not really be an issue unless we have hundreds and hundreds of links on a page.
			data.state = false;
			data.elem.removeTransitionClass('active');
			jQuery('a[href="#'+e.target.id+'"]').removeClass('active');
		}
	};
	
	jQuery(document).ready(function(){
		var id = window.location.hash;
		
		// Setup all things that start should start out active
		jQuery('.active').trigger('activate');
		
		// Activate the node that corresponds to the hashref
		// in the location bar, checking if it's an alphanumeric
		// id selector (not a hash bang).
		if (!id || !(/^#[\w\d]/.test(id))) { return; }
		
		jQuery(id).trigger('activate');
	});
})(jQuery);