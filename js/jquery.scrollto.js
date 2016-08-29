(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined) {
	var node;

	var defaults = {
	    	duration: 600,
	    	easing: 'ease-out',
	    	offset: 48,
	    	done: undefined
	};

	if (!jQuery.easing['ease-out']) {
		// eaeOutQuad
		jQuery.easing['ease-out'] = function (x, t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		};
	}

	jQuery.fn.scrollTo = function(settings) {
		var elem = this,
		    options = jQuery.extend({}, defaults, settings),
		    offset, obj;

		if (elem.length === 0) { return this; }

		offset = elem.offset();

		// Find scrollTop, in the process caching where scrollTop comes from.
		if (!node) {
			node = (document.documentElement.scrollTop && document.documentElement) ||
			       (document.body.scrollTop && document.body) ||
			       false;

			if (node) {
				node = jQuery(node);
			}
		}

		obj = {'scrollTop': offset.top - options.offset};

		if (node) {
			node.animate(obj, options);
		}
		else {
			jQuery(document.documentElement).animate(obj, options);
			jQuery(document.body).animate(obj, options);
		}

		return this;
	};
});