// bolt.classes.bubble
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
	var add = jQuery.event.add;
	var remove = jQuery.event.remove;
	var trigger = function(node, type, data) {
		jQuery.event.trigger(type, data, node);
	};

	var keymap = {
		27: function escape(e) {
			trigger(e.data, 'deactivate');
		}
	};

	function click(e) {
		if (e.data.contains(e.target) || e.data === e.target) { return; }
		trigger(e.data, 'deactivate');
	}

	function keydown(e) {
		var fn = keymap[e.keyCode];
		if (!fn) { return; }
		fn(e);
		e.preventDefault();
	}

	bolt('pop-action', {
		activate: function (e, data, fn) {
			if (data.active) { return; }
			data.active = true;

			var elem = data.elem;
			var relatedTarget = jQuery(e.relatedTarget);
			var relatedOffset = relatedTarget.offset();

			elem
			.addClass('notransition')
			.css({
				marginTop: 0,
				marginLeft: 0
			});

			var offset = elem.offset();
			var position = elem.position();

			elem
			.css({
				marginTop: '',
				marginLeft: '',
				// Round the number to get round a sub-pixel rendering error in Chrome
				left: Math.floor(relatedOffset.left + position.left - offset.left),
				top:  Math.floor(relatedOffset.top  + position.top  - offset.top)
			});

			elem.width();
			elem.removeClass('notransition');

			requestAnimationFrame(function() {
				add(document, 'click', click, e.target);
				add(document, 'keydown', keydown, e.target);
			});

			fn();
		},

		deactivate: function (e, data, fn) {
			if (!data.active) { return; }
			data.active = false;

			remove(document, 'click', click);
			remove(document, 'keydown', keydown);

			fn();
		}
	});
});
