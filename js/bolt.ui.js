// bolt.ui.js

// Run jQuery without aliasing it to $

jQuery.noConflict();


// Add and remove style flag classes on the document element
(function(jQuery, undefined){
	var support = jQuery.support,
			classes = [],
			docElem = jQuery(document.documentElement);
	
	classes.push('min-height_'+support.css.minHeight);
	classes.push('min-width_'+support.css.minWidth);
	
	docElem.addClass(classes.join(' '));

	// When DOM is ready, remove loading classes from document element
	jQuery(document).ready(function() {
		docElem.removeClass('notransition loading');
	});
})(jQuery);


// Select boxes that act as navigation
jQuery(document)
.on('change', '.nav_select', function(e) {
	var value = e.currentTarget.value;
	window.location = value;
});