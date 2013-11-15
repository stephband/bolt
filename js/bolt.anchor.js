// bolt.anchor
//
// Links scroll to anchors on the page. Could be done better, Isn't.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './bolt', './jquery.event.activate'], module);
	} else {
		// Browser globals
		module(jQuery, jQuery.bolt);
	}
})(function(jQuery, bolt, undefined){
	// Only one anchor can be active at once. Keep track of it.
	var activeNode;
	
	bolt('[id]', {
		activate: function(e, data, fn) {
			if (data.active) { return; }
			data.active = true;
			
			if (elem) { elem.trigger('deactivate'); }
			
			activeNode = e.target;
			elem.scrollTo();
			location.hash = bolt.identify(e.target);
			
			fn();
		},

		deactivate: function(e, data, fn) {
			if (!data.active) { return; }
			data.active = false;
			activeNode = undefined;
			fn();
		}
	}, {
		'a[href]': {
			'click': function(e, node, data) {
				if (activeNode === node) { return; }
				trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
			}
		}
	});
});