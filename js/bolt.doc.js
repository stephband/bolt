// bolt.ui.js

// Run jQuery without aliasing it to $

jQuery.noConflict();


// Add and remove style flag classes on the document element
(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var doc = jQuery(document),
		docElem = jQuery(document.documentElement);
	
	jQuery(document)
	
	// Remove loading classes from document element
	.ready(function() {
		docElem.removeClass('notransition loading');
	})
	
	// Select boxes that act as navigation
	.on('change', '.nav_select', function(e) {
		var value = e.currentTarget.value;
		window.location = value;
	});
});