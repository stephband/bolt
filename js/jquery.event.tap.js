// jquery.event.tap
// 
// 0.0
// 
// Emits a tap event as soon as touchend is heard. This is better than simulated
// click events on touch devices, which wait ~300ms before firing, in case they
// should be interpreted as double clicks.

// TODO: NOT IMPLEMENTED!

(function(jQuery, undefined){
	
	function setup(data, namespaces, eventHandle) {
		var elem = jQuery(this);
	}
	
	function teardown(namespace) {
		var elem = jQuery(this);
	}
		
	jQuery.event.special.tap = {
		setup: setup,
		teardown: teardown
	};
	
})(jQuery);