// template.ui.js

// Run jQuery without aliasing it to $

jQuery.noConflict();


// Add css support classes to html, remove notransition class

(function(jQuery, undefined){
	var support = jQuery.support,
			classes = [];
	
	classes.push('min-height_'+support.css.minHeight);
	classes.push('min-width_'+support.css.minWidth);
	
	jQuery(document.documentElement).addClass(classes.join(' '));

	jQuery(document).ready(function() {
		jQuery(document.documentElement).removeClass('notransition');
	});
})(jQuery);

alert('TEST');