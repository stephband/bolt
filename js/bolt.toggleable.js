// bolt.map
//
// Controls the map dropdown at the top of the body

(function(window) {
	"use strict";

	var jQuery = window.jQuery;
	var bolt   = jQuery.bolt;

	var isLeftButton = bolt.isLeftButton;

	var add = jQuery.event.add,
	    remove = jQuery.event.remove,
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    };

	function click(e) {
		var activeTarget = e.data;

		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }
		if (!isLeftButton(e)) { return; }

		var node = e.currentTarget;
		if (!node) { return; }

		trigger(activeTarget, { type: 'deactivate', relatedTarget: e.target });
		e.preventDefault();
	}

	bolt('toggleable', {
		activate: function(e, data, fn) {
			// Don't do anything if elem is already active
			if (data.active) { return; }
			data.active = true;
			var id = bolt.identify(e.target);
			jQuery('[href$="#' + id + '"]').on('click', e.target, click);
			fn();
		},

		deactivate: function(e, data, fn) {
			// Don't do anything if elem is already inactive
			if (!data.active) { return; }
			data.active = false;
			var id = bolt.identify(e.target);
			jQuery('[href$="#' + id + '"]').off('click', click);
			fn();
		}
	});
})(this);
