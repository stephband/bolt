// jquery.event.keys
//
// Creates several special events for listening to the keyboard,
// where the name of the key is used in the event type:
//
// jQuery(node).on('key[enter]', fn);
//
// These events do not bubble.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false;

	var add = jQuery.event.add;
	var remove = jQuery.event.remove;
	var trigger = function(node, type, data, handlersOnly) {
			jQuery.event.trigger(type, data, node, handlersOnly);
		};

	var nodesUp = new WeakMap();
	var nodesDown = new WeakMap();

	var keymap = {
			8:  'backspace',
			9:  'tab',
			13: 'enter',
			16: 'shift',
			17: 'ctrl',
			18: 'alt',
			27: 'escape',
			32: 'space',
			37: 'left',
			38: 'up',
			39: 'right',
			40: 'down',
			46: 'delete',
			48: '0',
			49: '1',
			50: '2',
			51: '3',
			52: '4',
			53: '5',
			54: '6',
			55: '7',
			56: '8',
			57: '9',
			65: 'a',
			66: 'b',
			67: 'c',
			68: 'd',
			69: 'e',
			70: 'f',
			71: 'g',
			72: 'h',
			73: 'i',
			74: 'j',
			75: 'k',
			76: 'l',
			77: 'm',
			78: 'n',
			79: 'o',
			80: 'p',
			81: 'q',
			82: 'r',
			83: 's',
			84: 't',
			85: 'u',
			86: 'v',
			87: 'w',
			88: 'x',
			89: 'y',
			90: 'z',
			// Mac Chrome left CMD
			91: 'cmd',
			// Mac Chrome right CMD
			93: 'cmd',
			// Mac FF
			224: 'cmd'
		};

	var keyupDef = {
		setup: function(data, namespaces, eventHandle) {
			var n = nodesUp.get(this) || 0;
			nodesUp.set(this, ++n);

			// Setup this node once
			if (n === 1) { add(this, 'keyup', keyup); }
			return true;
		},

		teardown: function(namespaces) {
			var n = nodesUp.get(this) || 0;
			nodesUp.set(this, --n);

			// Teardown when last listener is unbound
			if (n < 1) {
				nodesUp.delete(this);
				remove(this, 'keyup', keyup);
			}

			return true;
		}
	};

	var keydownDef = {
		setup: function(data, namespaces, eventHandle) {
			var n = nodesDown.get(this) || 0;
			nodesDown.set(this, ++n);

			// Setup this node once
			if (n === 1) { add(this, 'keydown', keydown); }
			return true;
		},

		teardown: function(namespaces) {
			var n = nodesDown.get(this) || 0;
			nodesDown.set(this, --n);

			// Teardown when last listener is unbound
			if (n < 1) {
				nodesDown.delete(this);
				remove(this, 'keydown', keydown);
			}

			return true;
		}
	};

	function keydown(e) {
		var key = keymap[e.keyCode];

		if (debug) console.log('[jquery.event.keys]', e.keyCode, key);

		// Reuse the keydown event as the keydown[x] event, but check
		// first to make sure we have not already done it
		if (e.type === 'keydown') { e.type = 'keydown[' + key + ']'; }
		trigger(e.currentTarget, e, null, true);
	}

	function keyup(e) {
		var key = keymap[e.keyCode];

		if (debug) console.log('[jquery.event.keys]', e.keyCode, key);

		// Reuse the keyup event as the keyup[x] event, but check
		// first to make sure we have not already done it
		if (e.type === 'keyup') { e.type = 'keyup[' + key + ']'; }
		trigger(e.currentTarget, e, null, true);
	}

	var code;

	for (code in keymap) {
		jQuery.event.special['keydown[' + keymap[code] + ']'] = keydownDef;
		jQuery.event.special['keyup[' + keymap[code] + ']'] = keyupDef;
	}
});
