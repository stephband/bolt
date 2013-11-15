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

	if (!jQuery.easing['ease-out']) {
		// eaeOutQuad
		jQuery.easing['ease-out'] = function (x, t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		};
	}

	jQuery.fn.scrollTo = function(fn) {
		var elem = this,
		    options = {
		    	duration: 600,
		    	easing: 'ease-out',
		    	done: fn
		    },
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

		obj = {'scrollTop': offset.top - 48};

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