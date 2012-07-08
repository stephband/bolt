// bolt.classify
//
// bolt.classify(name, obj)
// 
// name: the name of the class
// obj: a list of event types defining default handlers for the class


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