(function(jQuery, undefined) {
	var node;

	jQuery.fn.scrollTo = function() {
		var elem = this,
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
			node.animate(obj, 400, 'ease-out');
		}
		else {
			jQuery(document.documentElement).animate(obj, 400, 'ease-out');
			jQuery(document.body).animate(obj, 400, 'ease-out');
		}

		return this;
	};
})(jQuery);