// bolt.classes.tip
//
// Extends the default behaviour of events for the .tip class.

(function(jQuery, bolt, undefined){
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
			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = bolt.identify(e.target);
console.log('AC');
			elem.css(relatedTarget.offset());
			add(document, 'tap.' + id, tapHandler, e.target);
			fn();
		},

		deactivate: function (e, data, fn) {
			var id = bolt.identify(e.target);
console.log('DEACTIVATE');
			remove(document, '.' + id, tapHandler);
			fn();
		}
	});

	if (typeof define === 'function' && define.amd) {
		define(['jquery', 'bolt'], function(jQuery) { return; });
	}
})(jQuery, jQuery.bolt);