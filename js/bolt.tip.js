// bolt.classes.tip
//
// Extends the default behaviour of events for the .tip class.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './bolt', './jquery.event.activate'], module);
	} else {
		// Browser globals
		module(jQuery, jQuery.bolt);
	}
})(function(jQuery, bolt, undefined){
	var add = jQuery.event.add,
	    remove = jQuery.event.remove,
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    };

	function tapHandler(e) {
		var target = e.data;
		
		trigger(target, 'deactivate');
	}

	bolt('tip', {
		activate: function (e, data, fn) {
			if (data.active) { return; }
			data.active = true;
			
			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = bolt.identify(e.target),
			    relatedOffset = relatedTarget.offset(),
			    marginTop = elem.css('marginTop'),
			    marginLeft = elem.css('marginLeft');
			
			elem.css({
				marginTop: 0,
				marginLeft: 0
			});
			
			var offset = elem.offset(),
			    position = elem.position();
			
			elem.css({
				marginTop: '',
				marginLeft: '',
				// Round the number to get round a sub-pixel rendering error in Chrome
				left: Math.floor(relatedOffset.left + position.left - offset.left),
				top:  Math.floor(relatedOffset.top  + position.top  - offset.top)
			});
			
			add(document, 'tap.' + id, tapHandler, e.target);
			fn();
		},

		deactivate: function (e, data, fn) {
			if (!data.active) { return; }
			data.active = false;
			
			var id = bolt.identify(e.target);

			remove(document, '.' + id, tapHandler);
			fn();
		}
	});
});