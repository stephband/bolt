// jQuery.event.activate.tip
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on elements
// with various classes.

(function(jQuery, jQuery.bolt, undefined){
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

	bolt.classify('tip', {
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
	});
})(jQuery, jQuery.bolt);



(function(jQuery, bolt, undefined){
	var // Keep a log of event types that have been bolted.
	    types = {},
	    
	    // Keep a log of classes.
	    classes = {};


	function classify(node) {
		var classList = node.className.split(/\s+/),
		    l = classList.length,
		    i = -1;

		while (i++ < l) {
			if (classes[classList[i]]) {
				return classList[i];
			}
		}
	}

	function cacheData(target) {
		var data = jQuery.data(target, 'bolt');
		
		if (!data) {
			data = {};
			jQuery.data(target, 'bolt', data);
		}
		
		if (!data['class']) {
			data['class'] = classify(target)
		}
		
		return data;
	}


	function boltEvent(event, classes) {
		var _default = event._default;

		// Replace the event's default handler with bolt's.
		event._default = function(e) {
			var data = cacheData(e.target),
			    fn = classes[ data['class'] ];

			if (fn) {
				// Call bolt's default handler for this class and event.
				return fn(e, data, _default);
			}

			// Call the original default handler.
			return _default && _default.apply(this, arguments);
		};
	}


	bolt.classify = function(name, obj) {
		var type, event;
		
		classes[name] = obj;
		
		for (type in obj) {
			event = jQuery.event.special[type];
			
			// If the event is not defined, there's no point in going on.
			if (!event) { return; }
			
			// If this event type is already bolted, no need to do it again.
			if (types[type]) {
				types[type][name] = obj[type];
				return;
			}
			
			types[type] = {};
			types[type][name] = obj[type];
			
			boltEvent(event, types[type]);
		}
	}
})(jQuery, jQuery.bolt);