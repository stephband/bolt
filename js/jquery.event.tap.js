// jquery.event.tap
// 
// 0.5.2
// 
// Emits a tap event as soon as touchend is heard, as long as it's related
// touchstart was less than a certain time ago.
// 
// This script makes an attempt to normalise touch events and the way browsers
// simulate mouse events. The point is to do away with simulated mouse events
// on touch devices, so that a site's touch interaction model can be treated
// differently from it's mouse interaction model. This kind of thing is fraut
// with danger. Check out PPK's round-up of touch event support, and my own
// touch event compatibility table:
// http://www.quirksmode.org/mobile/tableTouch.html
// http://labs.cruncher.ch/touch-events-compatibility-table/
// 
// Simulated mouse events are prevented by:
// Android: cancelling them in the capture phase
// iOS: preventDefault on touchend
// 
// Also, in iOS labels don't check or focus their associated checkboxes. This
// is normalised for checkboxes and radio buttons, but there is no known
// workaround for text inputs.


// Make jQuery copy touch event properties over to the jQuery event
// object, if they are not already listed.
(function(jQuery, undefined){
	var props = ["touches", "targetTouches", "changedTouches"],
	    l = props.length;
	
	while (l--) {
		if (jQuery.event.props.indexOf(props[l]) === -1) {
			jQuery.event.props.push(props[l]);
		}
	}
})(jQuery);


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = true;//false;
	
	var duration = 280,
	    distance = 144,
	    mouseEvents = true,
	    cache = {},
	    rjavascript = /^javascript/;
	
	function returnTrue() {
		return true;
	}

	function setImmediate(fn) {
		setTimeout(fn, 0);
	}
	
	function amputateMouseEvent(e) {
		// If mouse events are enabled, don't go stopping them.
		if (mouseEvents) { return; }

		// Android browsers really don't like you messing with select boxes.
		if (e.target.tagName.toLowerCase() === 'select') {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
	}

	function enableMouse() {
		if (debug) console.log('Mouse events enabled');
		mouseEvents = true;
	}

	function disableMouse() {
		if (debug) console.log('Mouse events disabled');
		mouseEvents = false;
	}

	function disableMouseTemp() {
		disableMouse();
		setTimeout(enableMouse, 500);
	}

	function closest(node, tag) {
		return node === document ? false :
			node.tagName.toLowerCase() === tag ? node :
			closest(node.parentNode, tag);
	}
	
	function touchstart(e) {
		if (!e.changedTouches) {
			if (debug) { console.log('This event object has no changedTouches array.', e); }
			return;
		}
		
		jQuery.each(e.changedTouches, function(i, startTouch) {
			cache[startTouch.identifier] = {
				target: e.target,
				clientX: startTouch.clientX,
				clientY: startTouch.clientY,
				// Some browsers report timeStamp as a date object. Convert to ms.
				timeStamp: +e.timeStamp,
				preventDefault: e.preventDefault,
				checked: e.target.checked
			};
		});
	}
	
	function touchend(e) {
		jQuery.each(e.changedTouches, function(i, endTouch) {
			var startTouch = cache[endTouch.identifier],
			    node;
			
			delete cache[endTouch.identifier];
			
			if (// If time since startTouch is less than duration
				+e.timeStamp < (startTouch.timeStamp + duration) &&
				
				// If targets are the same
				e.target === startTouch.target &&
				
				// If the touch has not moved more than 12px
				(Math.pow(endTouch.clientX - startTouch.clientX, 2) + Math.pow(endTouch.clientY - startTouch.clientY, 2)) < distance
			) {
				// Trigger a tap event after this touchend event
				setImmediate(function() {
					jQuery(e.target).trigger({ type: 'tap' });
				});
				
				if (// If the target is, or is in, an anchor tag.
					(node = closest(e.target, 'a')) &&

					// If the href attribute has javascript in it.
					rjavascript.test(node.href)
				) {
					if (debug) console.log('Crap. The href has javascript in it.', node);

					// We're probably dealing with some legacy crap or an
					// external library like Harvest's Chosen, and it's probably
					// better not to disable mouse events. Probably. Maybe.
					return;
				}

				// Stop simulated mouse events in iOS, except select boxes,
				// which require them for focus.
				if (e.target.tagName.toLowerCase() !== 'select') {
					e.preventDefault();
				}
				
				// Android only cancels mouse events if preventDefault has been
				// called on touchstart. We can't do that. That stops scroll and
				// other gestures. Pants. Also, the default Android browser
				// sends simulated mouse events whatever you do. These browsers
				// have something in common: their identifiers are always 0.
				if (endTouch.identifier === 0) {
					disableMouseTemp();
				}
			}
		});
	}
	
	var actions = {
		a: function(target) {
			if (debug) { console.log(target.href); }

			// If the href contains JS, ignore
			if (rjavascript.test(target.href)) {
				if (debug) console.log('Ugh! Someone\'s put some JS in an href attribute.', target);
				return;
			}

			window.location = target.href;
		},
		
		input: function(target) {
			if (debug) { console.log('input type="'+target.type+'"'); }
			
			// Won't work in iOS, but does elsewhere.
			target.focus();
			
			if (target.type === "checkbox") {
				target.checked = !target.checked;
			}
			else if (target.type === "radio" && !target.checked) {
				target.checked = true;
			}
			else if (target.type === 'submit') {
				jQuery(target).closest('form').submit();
			}
			else { return; }
			
			// Dumb browsers send a change event. They are not supposed to
			// when an input is changed programmatically. I suspect it's
			// part of the mouse event simulation. I'm not really worried
			// enough to fix it right now, though, and we do need to make
			// sure a change is sent in iOS, so trigger one anyway, after
			// touchend.
			setTimeout(function(){
			  var e = document.createEvent("HTMLEvents");
			  
			  // type, bubbling, cancelable
			  e.initEvent('change', true, false );
			  target.dispatchEvent(e);
			}, 0);
		},
		
		textarea: function(target) {
			target.focus();
		},

		select: function(target) {
			target.focus();
		},
		
		label: function(target) {
			var input = document.getElementById( target.getAttribute("for") );
			actions[input.tagName.toLowerCase()](input);
		}
	};

	jQuery.event.special.tap = {
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,

		_default: function(e) {
			var target = jQuery(e.target).closest('a[href], label, input, select, textarea');
			
			// Ignore if the tap is not on an interactive element
			if (target.length === 0) { return; }
			
			actions[target[0].tagName.toLowerCase()](target[0]);
		}
	};
		
	// Protect this from being applied to old IE
	if (!document.addEventListener) { return; }
	
	jQuery(document)
	.on('touchstart', touchstart)
	.on('touchend', touchend);

	// It's a bit extreme, but stopping simulated events in the capture phase is
	// a way of getting dumb browsers to appear not to emit them.
	document.addEventListener('mousedown', amputateMouseEvent, true);
	document.addEventListener('mousemove', amputateMouseEvent, true);
	document.addEventListener('mouseup',   amputateMouseEvent, true);
	document.addEventListener('click',     amputateMouseEvent, true);
});
