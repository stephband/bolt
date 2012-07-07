// jQuery.event.activate.tip
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on elements
// with various classes.

(function(jQuery, undefined){
	var add = jQuery.event.add,
	    
	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    };

	function identify(node) {
		var id = node.id;

		if (!id) {
			do { id = Math.ceil(Math.random() * 1000000); }
			while (document.getElementById(id));
			node.id = id;
		}

		return id;
	}

	jQuery.event.special.activate.classes.tip = {
		activate: function (e, data, fn) {
			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = identify(e.target);

			elem.css(relatedTarget.offset());
			add(document, 'tap.' + id, function() {
				trigger(e.target, 'deactivate');
			});
			
			fn();
		},

		deactivate: function (e, data, fn) {
			var id = identify(e.target);

			remove(document, '.' + id);
			fn();
		}
	};
})(jQuery);