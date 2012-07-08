// bolt.classes.tip
//
// Extends the default behaviour of events for the .tip class.

(function(jQuery, bolt, undefined){
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

	function tapHandler(e) {
		var target = e.data;
		
		trigger(target, 'deactivate');
	}

	bolt.defineClass('tip', {
		activate: function (e, data, fn) {
			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = identify(e.target);

			elem.css(relatedTarget.offset());
			add(document, 'tap.' + id, tapHandler, e.target);
			
			fn();
		},

		deactivate: function (e, data, fn) {
			var id = identify(e.target);

			remove(document, '.' + id, tapHandler);
			fn();
		}
	});
})(jQuery, jQuery.bolt);