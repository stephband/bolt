// Infer transitionend event from CSS transition prefix and add
// it's name as jQuery.support.transitionEnd.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.prefix'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function( jQuery, undefined ){
	var end = {
	    	KhtmlTransition: false,
	    	OTransition: 'oTransitionEnd',
	    	MozTransition: 'transitionend',
	    	WebkitTransition: 'webkitTransitionEnd',
	    	msTransition: 'MSTransitionEnd',
	    	transition: 'transitionend'
	    },
	    
	    prefixed = jQuery.prefix('transition');
	
	jQuery.support.transition = prefixed || false;
	jQuery.support.transitionEnd = (prefixed && end[prefixed]);
});