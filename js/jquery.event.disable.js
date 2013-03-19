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
		define(['jquery', module]);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false,//true,
	    
	    disabledSelector = "[disabled]";
	
	function returnTrue() {
		return true;
	}

	jQuery.event.special.enable = {
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			e.target.removeAttribute('disabled');
			
			if (e.target.id) {
				jQuery('[for="' + e.target.id + '"]').removeClass('disabled');
			}
		}
	};
	
	jQuery.event.special.disable = {
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			e.target.setAttribute('disabled', 'disabled');
			
			if (e.target.id) {
				jQuery('[for="' + e.target.id + '"]').addClass('disabled');
			}
		}
	};
	
	jQuery(document).ready(function(){
		var id = window.location.hash;
		
		// Setup all things that should start out active.
		jQuery(disabledSelector).trigger('disable');
	});
});