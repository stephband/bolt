// bolt.toggle
//
// Simple active/inactive behaviour.

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

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function preventDefault(e) {
		remove(e.currentTarget, 'click', preventDefault);
		e.preventDefault();
	}

	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			add(e.currentTarget, 'click', preventDefault);
		}
	}

	function close(e) {
		var activeTarget = e.data;

		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }

		if (e.type === 'mousedown' && !isLeftButton(e)) { return; }

		trigger(activeTarget, {type: 'deactivate', relatedTarget: e.target});
		e.preventDefault();
		preventClick(e);
	}

	bolt('toggle', {
		activate: function(e, data, fn) {
			// Don't do anything if elem is already active
			if (data.active) { return; }
			data.active = true;

			var id = bolt.identify(e.target);

			jQuery('[href="#' + id + '"]').on('mousedown tap', e.target, close);

			fn();
		},

		deactivate: function(e, data, fn) {
			// Don't do anything if elem is already inactive
			if (!data.active) { return; }
			data.active = false;

			var id = bolt.identify(e.target);

			jQuery('[href="#' + id + '"]').off('mousedown tap', close);

			fn();
		}
	});
});
