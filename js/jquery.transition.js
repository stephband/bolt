// Fallback support for jQuery.fn.addTransitionClass. Also can
// be used in cases where low file size is a proirity.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.support.transition'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery) {
	var debug = false;//true;
	
	jQuery.fn.addTransitionClass = function(classes, callback) {
		if (debug) { console.log('jquery.addTransitionClass', classes, !!callback); }
		
		this.transition(function() {
			this.addClass(classes);
		}, callback);
	};
	
	jQuery.fn.removeTransitionClass = function(classes, callback) {
		if (debug) { console.log('jquery.removeTransitionClass', classes, !!callback); }
		
		this.transition(function() {
			this.removeClass(classes);
		}, callback);
	};
	
	jQuery.fn.transition = function(fn, callback) {
		if (debug) { console.log('jquery.transition', !!fn, !!callback); }
		
		var elem = this;
		
		if (callback && jQuery.support.transition) {
			elem.on(jQuery.support.transitionEnd, function transitionend(e) {
				elem.off(jQuery.support.transitionEnd, transitionend);
				callback.apply(elem);
			});
		}
		
		fn.apply(this);
		
		if (callback && !jQuery.support.transition) {
			callback.apply(elem);
		}
	};
});