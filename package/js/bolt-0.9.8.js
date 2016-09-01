/* bolt 0.9.8 JS */

// Detect whether different types of html5 form elements have native UI implemented
// and store boolean in jQuery.support.inputTypes[type]. For now, types not used in
// webdoc are commented out.
// You may find inspiration at Mike Taylor's site, here:
// http://www.miketaylr.com/code/html5-forms-ui-support.html

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
    var types = jQuery.support.inputTypes = {
          //datetime: false,
          date: false,
          //month: false,
          //week: false,
          time: false,
          //'datetime-local': false,
          number: false,
          range: false
        };
    
    var testValue = '::',
        input, type;
    
    // Loop over types
    for (type in types) {
      // Set the input type, then check to see if it still behaves like a text
      // input, or if the type is still that to which it was set.
      input = document.createElement('input');
      input.setAttribute('type', type);
      input.setAttribute('value', testValue);
      
      types[type] = input.value !== testValue || input.type === type;
    }
    
    // Detect support for the input placeholder attribute.
    jQuery.support.placeholder = 'placeholder' in input;
});
// jquery.event.move
//
// 1.3.1
//
// Stephen Band
//
// Triggers 'movestart', 'move' and 'moveend' events after
// mousemoves following a mousedown cross a distance threshold,
// similar to the native 'dragstart', 'drag' and 'dragend' events.
// Move events are throttled to animation frames. Move event objects
// have the properties:
//
// pageX:
// pageY:   Page coordinates of pointer.
// startX:
// startY:  Page coordinates of pointer at movestart.
// distX:
// distY:  Distance the pointer has moved since movestart.
// deltaX:
// deltaY:  Distance the finger has moved since last event.
// velocityX:
// velocityY:  Average velocity over last few events.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){

	var // Number of pixels a pressed pointer travels before movestart
	    // event is fired.
	    threshold = 6,
	
	    add = jQuery.event.add,
	
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    // Shim for requestAnimationFrame, falling back to timer. See:
	    // see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	    requestFrame = (function(){
	    	return (
	    		window.requestAnimationFrame ||
	    		window.webkitRequestAnimationFrame ||
	    		window.mozRequestAnimationFrame ||
	    		window.oRequestAnimationFrame ||
	    		window.msRequestAnimationFrame ||
	    		function(fn, element){
	    			return window.setTimeout(function(){
	    				fn();
	    			}, 25);
	    		}
	    	);
	    })(),
	    
	    ignoreTags = {
	    	textarea: true,
	    	input: true,
	    	select: true,
	    	button: true
	    },
	    
	    mouseevents = {
	    	move: 'mousemove',
	    	cancel: 'mouseup dragstart',
	    	end: 'mouseup'
	    },
	    
	    touchevents = {
	    	move: 'touchmove',
	    	cancel: 'touchend',
	    	end: 'touchend'
	    };


	// Constructors
	
	function Timer(fn){
		var callback = fn,
				active = false,
				running = false;
		
		function trigger(time) {
			if (active){
				callback();
				requestFrame(trigger);
				running = true;
				active = false;
			}
			else {
				running = false;
			}
		}
		
		this.kick = function(fn) {
			active = true;
			if (!running) { trigger(); }
		};
		
		this.end = function(fn) {
			var cb = callback;
			
			if (!fn) { return; }
			
			// If the timer is not running, simply call the end callback.
			if (!running) {
				fn();
			}
			// If the timer is running, and has been kicked lately, then
			// queue up the current callback and the end callback, otherwise
			// just the end callback.
			else {
				callback = active ?
					function(){ cb(); fn(); } : 
					fn ;
				
				active = true;
			}
		};
	}


	// Functions
	
	function returnTrue() {
		return true;
	}
	
	function returnFalse() {
		return false;
	}
	
	function preventDefault(e) {
		e.preventDefault();
	}
	
	function preventIgnoreTags(e) {
		// Don't prevent interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }
		
		e.preventDefault();
	}

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, event) {
		var touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === event.pageX && touch.pageY === event.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered
	
	function mousedown(e){
		var data;

		if (!isLeftButton(e)) { return; }

		data = {
			target: e.target,
			startX: e.pageX,
			startY: e.pageY,
			timeStamp: e.timeStamp
		};

		add(document, mouseevents.move, mousemove, data);
		add(document, mouseevents.cancel, mouseend, data);
	}

	function mousemove(e){
		var data = e.data;

		checkThreshold(e, data, e, removeMouse);
	}

	function mouseend(e) {
		removeMouse();
	}

	function removeMouse() {
		remove(document, mouseevents.move, mousemove);
		remove(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		var touch, template;

		// Don't get in the way of interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }

		touch = e.changedTouches[0];
		
		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		template = {
			target: touch.target,
			startX: touch.pageX,
			startY: touch.pageY,
			timeStamp: e.timeStamp,
			identifier: touch.identifier
		};

		// Use the touch identifier as a namespace, so that we can later
		// remove handlers pertaining only to this touch.
		add(document, touchevents.move + '.' + touch.identifier, touchmove, template);
		add(document, touchevents.cancel + '.' + touch.identifier, touchend, template);
	}

	function touchmove(e){
		var data = e.data,
		    touch = changedTouch(e, data);

		if (!touch) { return; }

		checkThreshold(e, data, touch, removeTouch);
	}

	function touchend(e) {
		var template = e.data,
		    touch = identifiedTouch(e.changedTouches, template.identifier);

		if (!touch) { return; }

		removeTouch(template.identifier);
	}

	function removeTouch(identifier) {
		remove(document, '.' + identifier, touchmove);
		remove(document, '.' + identifier, touchend);
	}


	// Logic for deciding when to trigger a movestart.

	function checkThreshold(e, template, touch, fn) {
		var distX = touch.pageX - template.startX,
		    distY = touch.pageY - template.startY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		triggerStart(e, template, touch, distX, distY, fn);
	}

	function handled() {
		// this._handled should return false once, and after return true.
		this._handled = returnTrue;
		return false;
	}

	function flagAsHandled(e) {
		e._handled();
	}

	function triggerStart(e, template, touch, distX, distY, fn) {
		var node = template.target,
		    touches, time;

		touches = e.targetTouches;
		time = e.timeStamp - template.timeStamp;

		// Create a movestart object with some special properties that
		// are passed only to the movestart handlers.
		template.type = 'movestart';
		template.altKey = e.altKey;
		template.ctrlKey = e.ctrlKey;
		template.shiftKey = e.shiftKey;
		template.distX = distX;
		template.distY = distY;
		template.deltaX = distX;
		template.deltaY = distY;
		template.pageX = touch.pageX;
		template.pageY = touch.pageY;
		template.velocityX = distX / time;
		template.velocityY = distY / time;
		template.targetTouches = touches;
		template.finger = touches ?
			touches.length :
			1 ;

		// The _handled method is fired to tell the default movestart
		// handler that one of the move events is bound.
		template._handled = handled;
			
		// Pass the touchmove event so it can be prevented if or when
		// movestart is handled.
		template._preventTouchmoveDefault = function() {
			e.preventDefault();
		};

		// Trigger the movestart event.
		trigger(template.target, template);

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(template.identifier);
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e) {
		var event = e.data.event,
		    timer = e.data.timer;

		updateEvent(event, e, e.timeStamp, timer);
	}

	function activeMouseend(e) {
		var event = e.data.event,
		    timer = e.data.timer;
		
		removeActiveMouse();

		endEvent(event, timer, function() {
			// Unbind the click suppressor, waiting until after mouseup
			// has been handled.
			setTimeout(function(){
				remove(event.target, 'click', returnFalse);
			}, 0);
		});
	}

	function removeActiveMouse(event) {
		remove(document, mouseevents.move, activeMousemove);
		remove(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = changedTouch(e, event);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		event.targetTouches = e.targetTouches;
		updateEvent(event, touch, e.timeStamp, timer);
	}

	function activeTouchend(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(event);
		endEvent(event, timer);
	}

	function removeActiveTouch(event) {
		remove(document, '.' + event.identifier, activeTouchmove);
		remove(document, '.' + event.identifier, activeTouchend);
	}


	// Logic for triggering move and moveend events

	function updateEvent(event, touch, timeStamp, timer) {
		var time = timeStamp - event.timeStamp;

		event.type = 'move';
		event.distX =  touch.pageX - event.startX;
		event.distY =  touch.pageY - event.startY;
		event.deltaX = touch.pageX - event.pageX;
		event.deltaY = touch.pageY - event.pageY;
		
		// Average the velocity of the last few events using a decay
		// curve to even out spurious jumps in values.
		event.velocityX = 0.3 * event.velocityX + 0.7 * event.deltaX / time;
		event.velocityY = 0.3 * event.velocityY + 0.7 * event.deltaY / time;
		event.pageX =  touch.pageX;
		event.pageY =  touch.pageY;

		timer.kick();
	}

	function endEvent(event, timer, fn) {
		timer.end(function(){
			event.type = 'moveend';

			trigger(event.target, event);
			
			return fn && fn();
		});
	}


	// jQuery special event definition

	function setup(data, namespaces, eventHandle) {
		// Stop the node from being dragged
		//add(this, 'dragstart.move drag.move', preventDefault);
		
		// Prevent text selection and touch interface scrolling
		//add(this, 'mousedown.move', preventIgnoreTags);
		
		// Tell movestart default handler that we've handled this
		add(this, 'movestart.move', flagAsHandled);

		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function teardown(namespaces) {
		remove(this, 'dragstart drag', preventDefault);
		remove(this, 'mousedown touchstart', preventIgnoreTags);
		remove(this, 'movestart', flagAsHandled);
		
		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function addMethod(handleObj) {
		// We're not interested in preventing defaults for handlers that
		// come from internal move or moveend bindings
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		// Stop the node from being dragged
		add(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid, preventDefault, undefined, handleObj.selector);
		
		// Prevent text selection and touch interface scrolling
		add(this, 'mousedown.' + handleObj.guid, preventIgnoreTags, undefined, handleObj.selector);
	}
	
	function removeMethod(handleObj) {
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		remove(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid);
		remove(this, 'mousedown.' + handleObj.guid);
	}
	
	jQuery.event.special.movestart = {
		setup: setup,
		teardown: teardown,
		add: addMethod,
		remove: removeMethod,

		_default: function(e) {
			var template, data;
			
			// If no move events were bound to any ancestors of this
			// target, high tail it out of here.
			if (!e._handled()) { return; }

			template = {
				target: e.target,
				startX: e.startX,
				startY: e.startY,
				pageX: e.pageX,
				pageY: e.pageY,
				distX: e.distX,
				distY: e.distY,
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				velocityX: e.velocityX,
				velocityY: e.velocityY,
				timeStamp: e.timeStamp,
				identifier: e.identifier,
				targetTouches: e.targetTouches,
				finger: e.finger
			};

			data = {
				event: template,
				timer: new Timer(function(time){
					trigger(e.target, template);
				})
			};
			
			if (e.identifier === undefined) {
				// We're dealing with a mouse
				// Stop clicks from propagating during a move
				add(e.target, 'click', returnFalse);
				add(document, mouseevents.move, activeMousemove, data);
				add(document, mouseevents.end, activeMouseend, data);
			}
			else {
				// We're dealing with a touch. Stop touchmove doing
				// anything defaulty.
				e._preventTouchmoveDefault();
				add(document, touchevents.move + '.' + e.identifier, activeTouchmove, data);
				add(document, touchevents.end + '.' + e.identifier, activeTouchend, data);
			}
		}
	};

	jQuery.event.special.move = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.move', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.move', jQuery.noop);
		}
	};
	
	jQuery.event.special.moveend = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.moveend', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.moveend', jQuery.noop);
		}
	};

	add(document, 'mousedown.move', mousedown);
	add(document, 'touchstart.move', touchstart);

	// Make jQuery copy touch event properties over to the jQuery event
	// object, if they are not already listed. But only do the ones we
	// really need. IE7/8 do not have Array#indexOf(), but nor do they
	// have touch events, so let's assume we can ignore them.
	if (typeof Array.prototype.indexOf === 'function') {
		(function(jQuery, undefined){
			var props = ["changedTouches", "targetTouches"],
			    l = props.length;
			
			while (l--) {
				if (jQuery.event.props.indexOf(props[l]) === -1) {
					jQuery.event.props.push(props[l]);
				}
			}
		})(jQuery);
	};
});

// jQuery.event.swipe
// 0.5
// Stephen Band

// Dependencies
// jQuery.event.move 1.2

// One of swipeleft, swiperight, swipeup or swipedown is triggered on
// moveend, when the move has covered a threshold ratio of the dimension
// of the target node, or has gone really fast. Threshold and velocity
// sensitivity changed with:
//
// jQuery.event.special.swipe.settings.threshold
// jQuery.event.special.swipe.settings.sensitivity

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var add = jQuery.event.add,
	   
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    settings = {
	    	// Ratio of distance over target finger must travel to be
	    	// considered a swipe.
	    	threshold: 0.4,
	    	// Faster fingers can travel shorter distances to be considered
	    	// swipes. 'sensitivity' controls how much. Bigger is shorter.
	    	sensitivity: 6
	    };

	function moveend(e) {
		var w, h, event;

		w = e.target.offsetWidth;
		h = e.target.offsetHeight;

		// Copy over some useful properties from the move event
		event = {
			distX: e.distX,
			distY: e.distY,
			velocityX: e.velocityX,
			velocityY: e.velocityY,
			finger: e.finger
		};

		// Find out which of the four directions was swiped
		if (e.distX > e.distY) {
			if (e.distX > -e.distY) {
				if (e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swiperight';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipeup';
					trigger(e.currentTarget, event);
				}
			}
		}
		else {
			if (e.distX > -e.distY) {
				if (e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipedown';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swipeleft';
					trigger(e.currentTarget, event);
				}
			}
		}
	}

	function getData(node) {
		var data = jQuery.data(node, 'event_swipe');
		
		if (!data) {
			data = { count: 0 };
			jQuery.data(node, 'event_swipe', data);
		}
		
		return data;
	}

	jQuery.event.special.swipe =
	jQuery.event.special.swipeleft =
	jQuery.event.special.swiperight =
	jQuery.event.special.swipeup =
	jQuery.event.special.swipedown = {
		setup: function( data, namespaces, eventHandle ) {
			var data = getData(this);

			// If another swipe event is already setup, don't setup again.
			if (data.count++ > 0) { return; }

			add(this, 'moveend', moveend);

			return true;
		},

		teardown: function() {
			var data = getData(this);

			// If another swipe event is still setup, don't teardown.
			if (--data.count > 0) { return; }

			remove(this, 'moveend', moveend);

			return true;
		},

		settings: settings
	};
});
// jquery.event.activate
// 
// Provides activate and deactivate special events for controlling
// active state of dropdowns, tabs, dialogs and other on/off state
// of buttons.
// 
// For dynamic apps where buttons are added and removed from the
// DOM, turn element caching off:
// 
// jQuery.event.special.activate.settings.cache = false;

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([
			'jquery',
			(window.ie7 || window.ie8 || window.ie9) ?
				'./jquery.transition.ie' :
				'./jquery.transition.fallback'
		], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false;//true;
	var activeClass = "active";
	var onClass = "on";
	var location = window.location;
	var id = location.hash;
	var settings = {
	    	cache: true
	    };

	function returnTrue() {
		return true;
	}
	
	function prefixSlash(str) {
		return (/^\//.test(str) ? '' : '/') + str ;
	}

	function sameOrigin() {
		var node = this;
		
		//     IE gives us the port on node.host, even where it is not
		//     specified. Use node.hostname.
		return location.hostname === node.hostname &&
		//     IE gives us node.pathname without a leading slash, so
		//     add one before comparing.
		       location.pathname === prefixSlash(node.pathname);
	}

	function findButtons(id) {
		return jQuery('a[href$="#' + id + '"]')
			.filter(sameOrigin)
			.add('[data-href="#' + id + '"]');
	}

	function cacheData(target) {
		var data = jQuery.data(target),
		    id = target.id;
		
		if (!data.elem) { data.elem = jQuery(target); }
		if (!data.buttons) { data.buttons = settings.cache && id && findButtons(id); }
		
		return data;
	}

	function getButtons(data) {
		return (settings.cache && data.buttons) || (data.elem[0].id && findButtons(data.elem[0].id));
	}

	jQuery.event.special.activate = {
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;
			
			// Don't do anything if elem is already active
			if (data.active) { return; }
			data.active = true;
			
			if (debug) { console.log('[activate] default | target:', e.target.id, 'data:', data); }
			
			elem.addTransitionClass(activeClass, function() {
				elem.trigger('activateend');
			});
			
			buttons = getButtons(data);
			
			if (buttons) {
				buttons.addClass(onClass);
			}
		},
		
		settings: settings
	};
	
	jQuery.event.special.deactivate = {
		// Don't use the DOM for this event
		setup: returnTrue,
		teardown: returnTrue,
		_default: function(e) {
			var data = cacheData(e.target),
			    elem = data.elem,
			    buttons;

			// Don't do anything if elem is already inactive
			if (!data.active) { return; }
			data.active = false;
			
			if (debug) { console.log('[deactivate] default | target:', e.target.id, 'data:', data); }
			
			elem.removeTransitionClass(activeClass, function() {
				elem.trigger('deactivateend');
			});

			buttons = getButtons(data);
			
			if (buttons) {
				buttons.removeClass(onClass);
			}
		},
		
		settings: settings
	};


	jQuery(document)
	.ready(function(){
		// Setup all things that should start out active.
		jQuery('.' + activeClass).trigger('activate');

		// Activate the node that corresponds to the hashref in
		// location.hash, checking if it's an alphanumeric id selector
		// (not a hash bang).
		if (!id || !(/^#\S+$/.test(id))) { return; }
		
		// The id may be perfectly valid, yet not be supported by jQuery,
		// such as ids with a ':' character, so try...catch it.
		try {
			jQuery(id).trigger('activate');
		}
		catch (e) {
			if (debug) console.log('Error caught: id hash ' + id + ' is throwing an error in jQuery');
		}
	});
});
//  jquery.dialog.js
//  1.1
//  Stephen Band

//  Dependencies
//  jquery.event.activate
//  jquery.event.activate.dialog

//  .dialog(role, options)
//  Displays current jQuery object in a dialog. Both role and options
//  are optional.

//  role:
//  default:  Basic dialog, prevents scrolling, and closes when
//            background layer is clicked.
//  lightbox: Adds a Close button, prevents scrolling, and closes
//            when background layer is clicked.
//  alert:    Adds an Ok button, prevents scrolling, and calls
//            options.callback when the Ok button is clicked.
//  confirm:  Adds Ok and Cancel buttons, prevents scrolling, and
//            calls options.callback when the Ok button is clicked.

//  options:
//  layerClass: Classes to add to background layer.
//  layerCss: CSS to add to background layer.
//  class: Classes to add to dialog box.
//  css: CSS to add to dialog box.

//  Events:
//  activate
//	deactivate

//  Text for buttons is localisable via jQuery.fn.dialog.text.
//  Dialog roles can by added to jQuery.fn.dialog.roles.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.event.activate'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false; //(window.console && console.log);

	var text = {
	    	ok: 'Ok',
	    	cancel: 'Cancel',
	    	close: 'Close'
	    },

	    roles = {
	    	_default: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'dialog'
	    		    });

	    		return box.html(elem);
	    	},

	    	slides: function(elem, options) {
					var box = jQuery('<div/>', {
					    	'class': options['class'] || 'slides-dialog dialog'
					    }),

					    button = jQuery.fn.dialog.closeButton.clone();

					return box.html(elem).append(button);
	    	},

	    	lightbox: function(elem, options) {
					var box = jQuery('<div/>', {
					    	'class': options['class'] || 'lightbox-dialog dialog'
					    }),

					    button = jQuery.fn.dialog.closeButton.clone();

					return box.html(elem).append(button);
	    	},

	    	alert: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'alert-dialog dialog'
	    		    }),

	    		    actions = '<ul class="action-index index">' +
	    		    	'<li><button class="confirm_button button">' + text.ok + '</button></li>' +
	    		    	'</ul>';

	    		return box.html(elem).append(actions);
	    	},

	    	confirm: function(elem, options) {
	    		var box = jQuery('<div/>', {
	    		    	'class': options['class'] || 'confirm-dialog dialog'
	    		    }),

	    		    actions = '<ul class="action-index index">' +
	    		    	'<li><a class="cancel_button button" href="#cancel">' + text.cancel + '</a></li>' +
	    		    	'<li><a class="confirm_button button" href="#confirm">' + text.ok + '</a></li>' +
	    		    	'</ul>';

	    		return box.html(elem).append(actions);
	    	}
	    };

	function deactivate(e) {
		if (e.currentTarget !== e.target) { return; }

		var options = e.data;

		return (options.callback && e.dialogAction && e.dialogAction === 'confirm') ?
			options.callback() :
			undefined ;
	}

	function deactivateend(e) {
		if (e.currentTarget !== e.target) { return; }

		jQuery(e.target)
		.off('deactivateend', deactivateend)
		.remove();
	}

	jQuery.fn.dialog = function(role, options){
		var dialog, box;

		if (typeof role !== 'string') {
			options = role;
			role = undefined;
		}

		if (debug) { console.log(role, options); }

		if (role !== undefined && !roles[role]) {
			if (debug) { console.log('[dialog] Invalid dialog role \'' + role + '\'. Using default dialog.'); }
			role = undefined;
		}

		options = jQuery.extend({}, options);

		dialog = jQuery('<div/>', {
			'class': options.layerClass || ((role ? (role + '-dialog-layer dialog-layer') : 'dialog-layer') + ' layer')
		});

		box = roles[role || '_default'](this, options);

		box
		.attr('tabindex', '-1')
		.attr('role', 'dialog');

		dialog
		.html(box)
		.appendTo('body')
		.on('deactivate.dialog', options, deactivate)
		.on('deactivateend.dialog', deactivateend)
		// data.elem is also used by jquery.event.activate. Might
		// as well keep it.
		.data('elem', dialog)
		.trigger({ type: 'activate', relatedTarget: options.relatedTarget });

		return dialog;
	};

	// Expose
	jQuery.fn.dialog.roles = roles;
	jQuery.fn.dialog.text = text;

	// If we don't create the close button this way - if we write out the html
	// and have the browser parse it, IE7 cocks up the href, adding the whole
	// path in front of it first. Not what we want.
	jQuery.fn.dialog.closeButton = jQuery('<a/>', {
		'class': "close-thumb thumb",
		'href': "#close",
		'html': text.close
	});
});

// Fallback support for jQuery.fn.addTransitionClass. Also can
// be used in cases where low file size is a proirity.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.support.transition'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery) {
	var debug = false;//true;
	
	jQuery.fn.addTransitionClass = function(classes, callback) {
		if (debug) { console.log('jquery.addTransitionClass', classes, !!callback); }
		
		this.transition(function() {
			this.addClass(classes);
		}, callback);
	};
	
	jQuery.fn.removeTransitionClass = function(classes, callback) {
		if (debug) { console.log('jquery.removeTransitionClass', classes, !!callback); }
		
		this.transition(function() {
			this.removeClass(classes);
		}, callback);
	};
	
	jQuery.fn.transition = function(fn, callback) {
		if (debug) { console.log('jquery.transition', !!fn, !!callback); }
		
		var elem = this;
		
		if (callback && jQuery.support.transition) {
			elem.on(jQuery.support.transitionEnd, function transitionend(e) {
				elem.off(jQuery.support.transitionEnd, transitionend);
				callback.apply(elem);
			});
		}
		
		fn.apply(this);
		
		if (callback && !jQuery.support.transition) {
			callback.apply(elem);
		}
	};
});
// jquery.validate.js
//
// 0.9.1
//
// Stephen Band
//
// Parts of this plugin are inspired by jquery.validate.js (Jörn Zaefferer) -
// indeed some regex is borrowed from there.
//
// Options:
//
// errorSelector - Selector for the closest element to a failed field where
//                 errorClass is added. By default this is the input or
//                 textarea field itself.
// errorClass    - Class that is applied to the errorSelector node when the
//                 the field fails validation. Default is 'error'.
// errorNode     - A jQuery object that is cloned and used as a container
//                 for all error messages.
// autocomplete	 - Overides the form's own autocomplete attribute, which is
//                 useful when validating on keyup events.
//
// Rules are depend on a field's attributes. To define a new rule, add an
// attribute to test for:
//
// jQuery.fn.validate.attributes['data-attribute'] = function(value, attributeValue, passFn, failFn) {
//	 // Validation logic
//	 return pass( newValue [optional] ) or fail( errorMessage [optional] )
// }

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = (window.console && window.console.log && window.console.groupCollapsed);

	var options = {
	    	errorClass: "error",
	    	errorNode: jQuery('<label/>', { 'class': 'error_label' }),
	    	errorSelector: "input, textarea"
	    },

	    errorMessages = {
	    	// Types
	    	url: 'That doesn\'t look like a valid URL',
	    	email: 'Enter a valid email',
	    	number: 'That\'s not a number.',

	    	// Attributes
	    	required: 'Required',
	    	minlength: 'At least {{attr}} characters',
	    	maxlength: 'No more than {{attr}} characters',
	    	min: 'Minimum {{attr}}',
	    	max: 'Maximum {{attr}}'
	    },

	    regex = {
	    	url:		/^([a-z][\w\.\-\+]*\:\/\/)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,6}/,
	    	email:		/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
	    	number:		/^(\-?\d*\.?\d+)$/,
	    	color:		/^#([0-9a-fA-F]{6})$/
	    },

	    // html5 input types
	    types = {
	    	url: {
	    		test: function( value ) { return regex.url.test(value); },
	    		autocomplete: function( value ) {
	    			var autovalue = 'http://' + value;
	    			return regex.url.test(autovalue) ? autovalue : undefined ;
	    		}
	    	},
	    	email: {
	    		test: function( value ) { return regex.email.test(value); }
	    	},
	    	number: {
	    		test: function( value ) { return regex.number.test(value); }
	    	},
	    	color: {
	    		test: function( value ) { return regex.color.test(value); }
	    	}
	    	//datetime: {},
	    	//date: {},
	    	//month: {},
	    	//week: {},
	    	//time: {},
	    	//'datetime-local': {},
	    	//range: {},
	    	//tel: {},
	    	//search: {},
	    },

	    attributes = {
	    	type: function( value, type, pass, fail, autocomplete ){
	    		var autovalue;
	    		//console.log( value, type, pass, fail, autocomplete );
	    		return (
	    			(!value || !types[type] || types[type].test(value)) ? pass() :
	    			autocomplete && ( autovalue = types[type].autocomplete(value) ) ? pass(autovalue) :
	    			fail( errorMessages[type] )
	    		);
	    	},

	    	required: function( value, attr, pass, fail ) {
	    		return ( !!value ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.required, {attr: attr}) ) ;
	    	},

	    	minlength: function( value, attr, pass, fail ) {
	    		return ( !value || value.length >= parseInt(attr) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.minlength, {attr: attr}) ) ;
	    	},

	    	maxlength: function( value, attr, pass, fail ) {
	    		var number = parseInt( attr );

	    		// Be careful, if there is no value maxlength is implicitly there
	    		// whether it's in the html or not, and sometimes it's -1
	    		return ( !value || number === -1 || value.length <= number ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.maxlength, {attr: attr}) ) ;
	    	},

	    	min: function( value, attr, pass, fail ) {
	    		return ( !value || parseFloat(attr) <= parseFloat(value) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.min, {attr: attr}) ) ;
	    	},

	    	max: function( value, attr, pass, fail ) {
	    		return ( !value || parseFloat(attr) >= parseFloat(value) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.max, {attr: attr}) ) ;
	    	}
	    	//pattern: function( value, attr, pass, fail ) {
	    	//	return ( !value );
	    	//}
	    };

	function removeError(data, attr) {
		data[attr] = true;
		data.errorNode.remove();
	}

	function removeErrors(node) {
		var field = jQuery(node),
		    data = field.data('validate'),
		    attr;

		for (attr in attributes) {
			if (data && data[attr] === false) {
				removeError(data, attr);
			}
		}
	}

	// Here's the meat and potatoes
	function validateInput(node, options){
		var field = jQuery(node),
		    value = jQuery.trim(field.val()),
		    data = field.data('validate'),
		    // Adding this option as a quick fix for unwanted autocompletion
		    // happening on the change event. In reality, we may have to
		    // rethink autocomplete a bit.
		    autocomplete = (options.autocomplete !== undefined) ? options.autocomplete : field.attr( 'autocomplete' ) === 'on' ,
		    passFlag = true,
		    stopTestFlag = false,
		    attr, attrval, rule, response;

		if (debug) { console.groupCollapsed('[jquery.validate]', node.id, value); }

		for (attr in attributes) {
			// We use getAttribute rather than .attr(), because
			// it returns the original value of the attribute rather
			// than the browser's interpretation.
			attrval = field[0].getAttribute(attr);

			if (attrval) {
				if (debug) { console.log(attr, attrval); }

				attributes[attr](value, attrval, function(autoval){
					// The test has passed
					if (autoval) {
						value = autoval;
						field.val(autoval);
					}

					// Remove the error message
					if (data && data[attr] === false) {
						removeError(data, attr);
					}
				}, function(message){
					// The test has failed

					var response = options.fail && options.fail.call(node, value, message);

					if (debug) { console.warn('FAIL', attr, message, response); }

					// If the fail callback returns a value, override the
					// failure, and put that value in the field.
					if (response) {
						value = response;
						field.val(response);

						// Remove the error message
						if ( data && data[attr] === false ) {
							removeError(data, attr);
						}
					}
					// Otherwise, it's the end of the road for this one
					else {
						if (!data) {
							data = {
								errorNode: options.errorNode
									.clone()
									.attr("for", field.attr("id") || "" )
							};
							field.data('validate', data);
						}

						// If there is an error message on the node, use that.
						message = node.getAttribute('data-error-' + attr) || message;

						data.errorNode.html(message);

						data[attr] = false;

						field
						.before(data.errorNode)
						.closest(options.errorSelector)
						.addClass(options.errorClass);

						passFlag = false;
					}

					stopTestFlag = true;
				}, autocomplete );
			}

			// If we've been told to stop testing,
			// break out of this loop.
			if (stopTestFlag) {
				break;
			}
		}

		if (debug) { console.groupEnd(); }

		if (passFlag) {
			// Remove error class
			field
			.closest( '.' + options.errorClass )
			.removeClass( options.errorClass );

			// Fire callback with input as context and arguments
			// value (string), checked (boolean)
			options.pass && options.pass.call(node, value, field.attr('checked'));

			return true;
		}
	}

	// Call .validate() on each of a form's inputs
	// and textareas, and call pass if everything
	// passed and fail if at least one thing failed
	function validateForm(node, options){
		var failCount = 0;

		jQuery(node)
		.find("input, textarea, select")
		.validate({
			fail: function(value){
				failCount++;
			}
		});

		if (failCount) {
			options.fail && options.fail.call(this);
		}
		else {
			options.pass && options.pass.call(this);
		}
	}

	function validateTrueForm(node){
		jQuery(node)
		.find("input, textarea")
		.each(function() {
			removeErrors(this);
		});
	}

	function validateTrue() {
		var tagName = this.nodeName.toLowerCase();

		if (tagName === 'form') {
			validateTrueForm(this);
			return;
		}

		if (tagName === 'input' || tagName === 'textarea') {
			removeErrors(this);
			return;
		}
	}

	jQuery.fn.validate = function(o){
		if (o === true) {
			return this.each(validateTrue);
		}

		var options = jQuery.extend({}, jQuery.fn.validate.options, o);

		return this.each(function validate() {
			var tagName = this.nodeName.toLowerCase();

			if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
				if (this.disabled) { return; }
				validateInput(this, options);
				return;
			}
			else {
				validateForm(this, options);
				return;
			}
		});
	};

	options.errorMessages = errorMessages;

	jQuery.fn.validate.regex = regex;
	jQuery.fn.validate.options = jQuery.fn.validate.options = options;
	jQuery.fn.validate.attributes = attributes;
});

// bolt
//
// bolt(name, obj)
// 
// name: the name of the class
// obj: a list of event types defining default handlers for the class
// 
// bolt.identify(node)
// Returns the node's id. If the node does not have an id, bolt
// generates a new and unused id, sets it on the node and returns it.
// 
// bolt.classify(node)
// Gets the first bolt registered class in the node's classList and
// returns it, or undefined.
// 
// bolt.has(class, [type])
// Query bolt to see if it has a handlers for the given class, and
// optionally for the given event type.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	"use strict";

	var debug = false,//true,
	    
	    // Keep a log of event types that have been bolted.
	    types = {},
	    
	    // Keep a log of classes.
	    classes = {};

	function identify(node) {
		var id = node.id;

		if (!id) {
			do { id = Math.ceil(Math.random() * 100000); }
			while (document.getElementById(id));
			node.id = id;
		}

		return id;
	}

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

	function hasClass(className, type) {
		return !!(classes[className] && (type === undefined || classes[className][type]));
	}

	function cacheData(target) {
		var data = jQuery.data(target, 'bolt');
		
		if (!data) {
			data = {
				'elem': jQuery(target),
				'class': classify(target)
			};
			
			jQuery.data(target, 'bolt', data);
		}
		
		return data;
	}


	function boltEvent(event, classes) {
		var _default = event._default;

		// Replace the event's default handler with bolt's.
		event._default = function(e) {
			var self = this,
			    args = arguments,
			    data = cacheData(e.target),
			    fn = classes[ data['class'] ],
			    handler = _default ?
			    	_default.bind(this, e) :
			    	jQuery.noop ;

			if (fn) {
				// Call bolt's default handler for this class and event.
				return fn(e, data, handler);
			}

			// Call the original default handler.
			return handler();
		};
	}

	function bolt(className, obj) {
		var type, event;
		
		classes[className] = obj;
		
		for (type in obj) {
			event = jQuery.event.special[type];
			
			if (debug) console.log('[bolt] register class:', className, type, event);
			
			// If the event is not defined, create a placholder for it.
			if (!event) {
				event = jQuery.event.special[type] = {};
			}
			
			// If this event type is not already bolted, do it now.
			if (!types[type]) {
				types[type] = {};
				boltEvent(event, types[type]);
			}
			
			// Finally, add our class handler to the event type object.
			types[type][className] = obj[type];
		}
	}
	
	bolt.identify = identify;
	bolt.classify = classify;
	bolt.has = hasClass;
	
	jQuery.bolt = bolt;
	
	return bolt;
});
// Hijax user actions that must trigger dropdowns, popdowns slides
// and tabs and handle sending activate events to them.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './bolt', './jquery.prefix'], module);
	} else {
		// Browser globals
		module(jQuery, jQuery.bolt);
	}
})(function(jQuery, bolt, undefined){
	"use strict";

	var debug = window.console && console.log;

	var doc = jQuery(document),
	    docElem = jQuery(document.documentElement),

	    add = jQuery.event.add,
	    remove = jQuery.event.remove,
	    trigger = function(node, type, data) {
	        jQuery.event.trigger(type, data, node);
	    },

	    rImage = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/,
	    rYouTube = /youtube\.com/,

	    nodeCache = {},

	    targets = {
	    	dialog: function(e) {
	    		var href = e.currentTarget.getAttribute('data-href') || e.currentTarget.hash || e.currentTarget.href;
	    		var id = href.substring(1);
	    		var node, parts, item;

	    		if (!id) { return loadResource(e, href); }

	    		if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
	    			id = parts[1];
	    		}

	    		node = nodeCache[id] || document.getElementById(id);

	    		if (!node) { return loadResource(e, href); }

	    		e.preventDefault();

	    		// If the node is html hidden inside a text/html script tag,
	    		// extract the html.
	    		if (node.getAttribute && node.getAttribute('type') === 'text/html') {
	    			// TODO: jQuery 1.9.1 and 2.0.0b2 are failing because html
	    			// needs to be whitespace trimmed.
	    			node = jQuery(node).html();
	    		}

	    		// If it's a template...
	    		if (node.tagName && node.tagName.toLowerCase() === 'template') {
	    			// If it is not inert (like in IE), remove it from the DOM to
	    			// stop ids in it clashing with ids in the rendered result.
	    			if (!node.content) { jQuery(node).remove(); }
	    			node = nodeCache[id] = jQuery(node).html();
	    		}

	    		jQuery(node).dialog('lightbox');

	    		if (parts) {
	    			item = jQuery('#' + parts[2]);

	    			item
	    			.addClass('notransition')
	    			.trigger('activate')
	    			.width();

	    			item
	    			.removeClass('notransition');
	    		}
	    	}
	    };

	function isDefined(value) {
		return value !== undefined && value !== null ;
	}

	function loadResource(e, href) {
		var link = e.currentTarget,
		    path = link.pathname,
		    node, elem, dialog;

		if (rImage.test(link.pathname)) {
			e.preventDefault();

			node = new Image();
			elem = jQuery(node);

			elem.dialog('lightbox');

			dialog = elem.parent();

			if (dialog.addLoadingIcon) {
				dialog.addLoadingIcon();

				elem.on('load', function() {
					dialog.removeLoadingIcon();
				});
			}

			node.src = href;

			return;
		}

		if (rYouTube.test(link.hostname)) {
			e.preventDefault();

			// We don't need a loading indicator because youtube comes with
			// it's own.
			elem = jQuery('<iframe class="youtube_iframe" width="560" height="315" src="' + href + '" frameborder="0" allowfullscreen></iframe>');
			node = elem[0];

			elem.dialog('lightbox');

			return;
		}
	}

	function prefixSlash(str) {
		return (/^\//.test(str) ? '' : '/') + str ;
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

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or
		// primary) mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function isIgnorable(e) {
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.isDefaultPrevented()) { return true; }

		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (e.type === 'mousedown' && !isLeftButton(e)) { return true; }

		// Ignore key presses other than the enter key
		if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
	}

	function isExternalLink(e) {
		var location = window.location,
		    link = e.currentTarget;

		// IE does not give us a .hostname for links to xxx.xxx.xxx.xxx URLs.
		if (!link.hostname) { return false; }

		// IE gives us the port on link.host, even where it is not specified.
		// Use link.hostname.
		if (location.hostname !== link.hostname) { return true; }

		// IE gives us link.pathname without a leading slash, so add
		// one before comparing.
		if (location.pathname !== prefixSlash(link.pathname)) { return true; }
	}

	function boltData(node) {
		// Get the bolt data that may have been created by a previous
		// activate event.
		var data = jQuery.data(node);
		var elem, clas;

		// Decide what class this object is.
		if (data.bolt && data.bolt['class']) {
			// It does no harm to cache data.elem here while we have it.
			// It's used later by the activate event.
			elem = data.bolt.elem;
			clas = data.bolt['class'];
		}
		else {
			elem = jQuery(node);
			clas = bolt.classify(node);

			// It does no harm to cache elem here while we have it. It's
			// used later by the activate event.
			data.elem = elem;
		}

		// If it has no bolt registered class, we have no business trying
		// to activate it on mousedown.
		if (!clas) { return; }

		// Attach bolt's data to the target
		if (!data.bolt) {
			data.bolt = {
				'elem': elem,
				'class': clas
			};
		}

		return data;
	}

	function activate(e, node, data) {
		e.preventDefault();

		if (e.type === 'mousedown') {
			preventClick(e);
		}

		if (!bolt.has(data.bolt['class'], 'activate')) { return; }

		if (data.active === undefined ?
				data.bolt.elem.hasClass('active') :
				data.active ) {
			return;
		}

		trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
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

	function activateHref(e, fn) {
		var id, node, name, data, elem, clas;

		if (isIgnorable(e)) { return; }

		id = e.currentTarget.getAttribute('data-href').substring(1);
		node = document.getElementById(id);

		// This link does not point to an id in the DOM. No action required.
		if (!node) { return; }

		data = boltData(node);

		if (!data) { return; }

		//if (!bolt.has(clas, 'activate')) { return; }

		fn(node, data);
	}

	function activateHash(e, fn) {
		var id, node, data;

		if (isIgnorable(e)) { return; }
		if (isExternalLink(e)) { return; }

		// A bit of a quick fix to avoid triggering hrefs inside hrefs
		if (jQuery(e.target).closest('[href]')[0] !== e.currentTarget) { return; }

		id = (isDefined(e.currentTarget.hash) ?
			e.currentTarget.hash :
			e.currentTarget.getAttribute('href'))
		.substring(1);

		node = document.getElementById(id);

		// This link does not point to an id in the DOM. No action required.
		if (!node) { return; }

		data = boltData(node);

		if (!data) { return; }

		fn(e, node, data);
	}

	function activateTarget(e) {
		var target = e.currentTarget.target;

		if (isIgnorable(e)) { return; }

		// If the target is not listed, ignore
		if (!targets[target]) { return; }

		if (e.type === 'mousedown') { preventClick(e); }

		return targets[target](e);
	}

	function changeHref(e) {
		activateHref(e, function(node, data) {
			if (e.target.checked) {
				trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
			}
			else {
				trigger(node, { type: 'deactivate', relatedTarget: e.currentTarget });
			}
		});
	}

	function mousedownHref(e) {
		// We have change handlers to listen to inputs
		if (e.target.tagName.toLowerCase() === 'input') { return; }

		activateHref(e, function(node, data) {
			e.preventDefault();

			if (e.type === 'mousedown') {
				preventClick(e);
			}

			//if (!bolt.has(clas, 'activate')) { return; }

			if (data.active === undefined ?
					data.bolt.elem.hasClass('active') :
					data.active ) {
				return;
			}

			trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
		});
	}

	function mousedownHash(e) {
		activateHash(e, activate);
	}

	// Run jQuery without aliasing it to $
	jQuery.noConflict();


	doc

	// Remove loading classes from document element
	.ready(function() {
		docElem.removeClass('notransition loading');
	})

	// Select boxes that act as navigation
	.on('change', '.nav-select', function(e) {
		var value = e.currentTarget.value;
		window.location = value;
	})

	// Clicks on close buttons deactivate the thing they are inside
	.on('click tap', '.close-thumb, .close_button, .cancel_button', function(e) {
		var elem = jQuery(e.currentTarget).closest('.popdown, .dialog-layer');

		if (!elem.length) { return; }

		elem.trigger({
			type: 'deactivate',
			relatedTarget: e.currentTarget
		});

		e.preventDefault();
	})

	// Mousedown on buttons toggle activate on their targets
	.on('mousedown tap keydown', 'a[target]', activateTarget)

	// Changing input[data-href] controls target
	.on('change valuechange', '[data-href]', changeHref)

	// Mousedown on buttons toggle activate on their hrefs
	.on('mousedown tap keydown', '[data-href]', mousedownHref)

	// Mousedown on buttons toggle activate on their hash
	.on('mousedown tap keydown', '[href]', mousedownHash)

	// Mouseover on tip links toggle activate on their targets
	.on('mouseover mouseout tap focusin focusout', 'a[href^="#"], [data-tip]', function(e) {
		var href, node, elem, data, clas, tag;

		tag = e.target.tagName.toLowerCase();

		// Input fields should only show tips when focused
		if (tag === 'input' && (e.type === 'mouseover' || e.type === 'mouseout' || e.type === 'tap')) {
			return;
		}

		href = e.currentTarget.getAttribute('data-tip');

		if (href && !(/^#/.test(href))) {
			// The data-tip attribute holds text. Create a tip node and
			// stick it in the DOM
			elem = jQuery('<div/>', {
				'class': 'tip',
				'text': href
			});
			node = elem[0];
			clas = 'tip';
			e.currentTarget.setAttribute('data-tip', '#' + bolt.identify(node));
			document.body.appendChild(node);
		}
		else {
			if (!href) {
				href = e.currentTarget.hash;
			}

			node = href.substring(1) && document.getElementById(href.substring(1));

			// If there is no node, there's no need to continue. Thanks.
			if (!node) { return; }

			// Get the bolt data that may have been created by a previous
			// activate event.
			data = jQuery.data(node, 'bolt');

			elem = (data && data.elem) || jQuery(node);
		}

		// Decide what class this object is.
		if (!clas) {
			clas = data && data['class'] ?
				data['class'] :
				bolt.classify(node) ;
		}

		if (clas && !data) {
		  jQuery.data(elem[0], 'bolt', { 'class': clas, elem: elem });
		}

		// If it has not the class 'tip', we have no business trying to
		// activate it on hover.
		if (clas !== 'tip' && clas !== 'top_tip') { return; }

		// Tap events should make tips show immediately
		if (e.type === 'tap') {
			elem.css(jQuery.prefix('transition')+'Delay', '0');
		}

		elem.trigger(e.type === 'mouseout' || e.type === 'focusout' ?
			{ type: 'deactivate' } :
			{ type: 'activate', relatedTarget: e.currentTarget }) ;
	});
});

// jquery.event.activate.dialog
// 
// Provides activate and deactivate events for controlling
// on/off state of dialogs.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './bolt', './jquery.event.activate'], module);
	} else {
		// Browser globals
		module(jQuery, jQuery.bolt);
	}
})(function(jQuery, bolt, undefined){
	var debug = window.console && console.log,

	    docElem = jQuery(document.documentElement),

	    win = jQuery(window),

	    add = jQuery.event.add,  // elem, types, handler, data, selector

	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    resizeEvent = ("onorientationchange" in window) ? "orientationchange" : "resize" ,
	    
	    count = 0;

	var mapkey = (function(codes){
	    	return function(e) {
	    		var code = codes[e.keyCode]
	    		    fn = e.data && e.data[code];
	    		
	    		if (debug) console.log('[bolt.dialog] mapkey', e.keyCode, code);
	    		
	    		if (fn) {
	    			fn(document.activeElement);
	    			e.preventDefault();
	    		}
	    	}
	    })({
	    	8:  'backspace',
	    	9:  'tab',
	    	13: 'enter',
	    	27: 'escape',
	    	37: 'left',
	    	38: 'up',
	    	39: 'right',
	    	40: 'down',
	    	46: 'delete'
	    });

	function preventDefault(e) {
		e.preventDefault();
	}
	
	function preventDefaultOutside(e) {
		var node = e.data;
		
		if (jQuery.contains(node, e.target)) { return; }
		
		e.preventDefault();
	}

	function disableScroll(layer) {
		var scrollLeft = docElem.scrollLeft(),
		    scrollTop = docElem.scrollTop();
		
		// Remove scrollbars from the documentElement
		docElem.css({ overflow: 'hidden' });
		
		// FF has a nasty habit of linking the scroll parameters
		// of document with the documentElement, causing the page
		// to jump when overflow is hidden on the documentElement.
		// Reset the scroll position.
		if (scrollTop) { docElem.scrollTop(scrollTop); }
		if (scrollLeft) { docElem.scrollLeft(scrollLeft); }

		// Disable gestures on touch devices
		add(document, 'touchmove', preventDefaultOutside, layer);
	}
	
	function enableScroll() {
		var scrollLeft = docElem.scrollLeft(),
		    scrollTop = docElem.scrollTop();
		
		// Put scrollbars back onto docElem
		docElem.css({ overflow: '' });
		
		// FF fix. Reset the scroll position.
		if (scrollTop) { docElem.scrollTop(scrollTop); }
		if (scrollLeft) { docElem.scrollLeft(scrollLeft); }

		// Enable gestures on touch devices
		remove(document, 'touchmove', preventDefaultOutside);
	}
	
	function trapFocus(node, focusNode) {
		// Trap focus as described by Nikolas Zachas:
		// http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/
		
		// Find the first focusable thing.
		var firstNode = jQuery('[tabindex], a, input, textarea, button', node)[0];

		if (!firstNode) { return; }

		focusNode = focusNode || document.body;

		function preventFocus(e) {
			// If trying to focus outside node, set the focus back
			// to the first thing inside.
			if (!node.contains(e.target)) {
				e.stopPropagation();
				firstNode.focus();
			}
		}

		setTimeout(function() { firstNode.focus(); }, 0);

		// Prevent focus in capture phase
		if (document.addEventListener) {
			document.addEventListener("focus", preventFocus, true);
		}

		add(node, 'deactivate', function deactivate() {
			// Set focus back to the thing that was last focused when the
			// dialog was opened.
			setTimeout(function() { focusNode.focus(); }, 0);
			remove(node, 'deactivate', deactivate);

			if (document.addEventListener && document.removeEventListener) {
				document.removeEventListener('focus', preventFocus);
			}
		});
	}
	
	function deactivateFocus(e) {
		var focusNode = e.data;
		
		focusNode.focus();
		remove(e.target, 'deactivate', deactivateFocus);
	}

	function preventDefaultOutside(e) {
		var node = e.data,
		    target = e.target;
		
		if (node === target || jQuery.contains(node, target)) { return; }
		
		e.preventDefault();
	}

	function disableActivate(dialog) {
		add(document.body, 'deactivate', preventDefaultOutside, dialog, '.popdown, .dropdown');
	}

	function enableActivate(dialog) {
		remove(document.body, 'deactivate', preventDefaultOutside);
	}

	function maxHeight(data) {
		var images = data.dialogImages,
		    height = data.dialogLayer.height() - data.dialogBox.outerHeight() + data.dialogBox.height() - 140;

		// Add max-height to images. Max height needs to be less than the
		// window height to account for UI around the slides.
		images.css({ maxHeight: height });
	}

	// Event handlers

	function click(e){
		if ( e.currentTarget !== e.target ) { return; }
		
		trigger(e.target, 'deactivate');
		e.preventDefault();
	}
	
	function close(e) {
		trigger(e.delegateTarget, {
			type: 'deactivate',
			dialogAction: e.data,
			relatedTarget: e.currentTarget
		});

		e.preventDefault();
	}

	function deactivateend(e, data) {
		count--;
		if (count) { return; }
		enableScroll();
		enableActivate(e.target);
	}

	function prev(e) {
		var slides = e.data,
		    slide = slides.filter('.active').prev('.slide');

		if (!slide.length) {
			slide = slides.find('.slide').last();
		}

		slide.trigger('activate');
		e.preventDefault();
	}
	
	function next(e) {
		var slides = e.data,
		    slide = slides.filter('.active').next('.slide');

		if (!slide.length) {
			slide = slides.find('.slide').first();
		}

		slide.trigger('activate');
		e.preventDefault();
	}

	function rescale(e) {
		var data = e.data;

		maxHeight(data);
	}
	
	bolt('slides-dialog-layer', {
		activate: function(e, data, fn) {
			var slides = jQuery('.slide', e.target),
			    images = slides.filter('img, iframe, object, embed').add(slides.find('img, iframe, object, embed')),
			    active, id;

			data.dialogSlides = slides;
			data.dialogImages = images;

			if (e.relatedTarget) {
				id = jQuery(e.relatedTarget).data('slide');
			}

			active = id ? jQuery('#' + id) : slides.filter('.active');

			if (!active.length) {
				active = slides.first();
			}

			count++;
			disableScroll(e.target);
			trapFocus(e.target, document.activeElement);

			add(e.target, 'click.dialog tap.dialog', click);
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.close_button');
			add(e.target, 'click.dialog tap.dialog', prev, slides, '.prev_button');
			add(e.target, 'click.dialog tap.dialog', next, slides, '.next_button');
			add(window, resizeEvent + '.dialog_' + count, rescale, data);
			add(document, 'keyup.dialog' + count, mapkey, {
				'escape': function() { data.elem.trigger('deactivate'); }
			});
			
			data.elem.addClass('notransition');
			maxHeight(data);
			active.trigger('activate');
			data.elem.removeClass('notransition');

			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', click);
			remove(e.target, 'click tap', close);
			remove(e.target, 'click tap', prev);
			remove(e.target, 'click tap', next);
			remove(window, resizeEvent + '.dialog_' + count, rescale);
			remove(document, 'keyup.dialog' + count, mapkey);

			fn();
		},

		deactivateend: deactivateend
	});

	bolt('lightbox-dialog-layer', {
		activate: function(e, data, fn) {
			count++;
			add(e.target, 'click.dialog tap.dialog', click);
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.close_button');
			add(document, 'keyup.dialog' + count, mapkey, {
				'escape': function() { data.elem.trigger('deactivate'); }
			});
			
			disableScroll(e.target);
			disableActivate(e.target);
			trapFocus(e.target, document.activeElement);
			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', click);
			remove(e.target, 'click tap', close);
			remove(document, 'keyup.dialog' + count, mapkey);
			fn();
		},

		deactivateend: deactivateend
	});

	bolt('alert-dialog-layer', {
		activate: function(e, data, fn) {
			count++;
			add(e.target, 'click.dialog tap.dialog', close, 'confirm', '.confirm_button');
			disableScroll(e.target);
			trapFocus(e.target, document.activeElement);
			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', close);
			fn();
		},

		deactivateend: deactivateend
	});

	bolt('confirm-dialog-layer', {
		activate: function(e, data, fn) {
			count++;
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.cancel_button');
			add(e.target, 'click.dialog tap.dialog', close, 'confirm', '.confirm_button');
			add(document, 'keyup.dialog' + count, mapkey, {
				'escape': function() { data.elem.trigger('deactivate'); }
			});
			
			disableScroll(e.target);
			trapFocus(e.target, document.activeElement);
			
			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', close);
			remove(document, 'keyup.dialog' + count, mapkey);
			fn();
		},

		deactivateend: deactivateend
	});

	bolt('dialog-layer', {
		activate: function(e, data, fn) {
			count++;
			add(e.target, 'click.dialog tap.dialog', click);
			add(document, 'keyup.dialog' + count, mapkey, {
				'escape': function() { data.elem.trigger('deactivate'); }
			});
			
			disableScroll(e.target);
			trapFocus(e.target, document.activeElement);
			
			fn();
		},
		
		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', click);
			remove(document, 'keyup.dialog' + count, mapkey);
			fn();
		},

		deactivateend: deactivateend
	});
});
// Handle form elements

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var doc = jQuery(document);

	function setImmediate(fn) {
		setTimeout(fn, 0);
	}

	function thru(value) {
		return value;
	}

	function fieldData(target) {
		var data = jQuery.data(target, 'field'),
		    field, name;

		if (!data){
			field = jQuery(target);
			name = field.attr('name');

			data = {
				field: field,
				label: jQuery('label[for="'+target.id+'"]')
			};

			// Store reference to label that is a direct wrap of the
			// target node.
			data.wrap = data.label.filter(function() {
				return (target.parentNode === this);
			});

			if (name) {
				data.fields = jQuery('input[name="'+name+'"]');
			}

			jQuery.data(target, 'field', data);
		}

		return data;
	}

	function name(obj) {
		return obj.name;
	}

	function removeText(elem) {
		// Remove text nodes only
		elem
		.contents()
		.filter(function() {
			return this.nodeType === (window.Node ? window.Node.TEXT_NODE : 3);
		})
		.remove();
	}

	function updateFileLabel(node) {
		// Take a select node and put it's selected option content
		// in the associated label.
		var view = fieldData(node),
		    files = node.files,
		    html = Array.prototype.map.call(files, name).join('<br/>');

		// Remove text nodes from the button
		removeText(view.wrap);

		view.wrap.prepend(html);
	}

	function updateRadioLabel() {
		var node = this,
		    data = fieldData(node);

		if (this.checked) {
		    data.label.addClass('on');
		}
		else {
		    data.label.removeClass('on');
		}
	}


	doc

	// Readonly inputs have their text selected when you click
	// on them.

	.on('focus click', 'input[readonly]', function(e) {
		jQuery(e.currentTarget).select();
	})

	// Extend the events emitted by input[type='range']
	// nodes with changestart and changeend events.

	.on('mousedown touchstart', 'input[type="range"]', (function(){
		var endTypes = {
			mousedown: 'mouseup',
			touchstart: 'touchend'
		};

		function change(e){
			jQuery(e.target)
			.trigger({ type: 'changestart' })
			.unbind('change', change);
		}

		function mouseup(e){
			jQuery(e.target)
			.trigger({ type: 'changeend' })
			.unbind('mouseup', mouseup);
		}

		return function(e){
			jQuery(e.target)
			.bind('change', change)
			.bind(endTypes[ e.type ], mouseup);
		};
	})())

	// Global form validation
	.on('change', 'input, textarea', function(e) {
		// Don't make this script require jQuery.fn.validate
		if (!jQuery.fn.validate) { return; }

		jQuery(this).validate({
			fail: function(){ e.preventDefault(); }
		});
	})

	.on('valuechange', 'input, textarea', function(e) {
		// Don't make this script require jQuery.fn.validate
		if (!jQuery.fn.validate) { return; }

		jQuery(this).validate(true);
	})

	.on('input', 'input, textarea', function(e) {
		jQuery.event.trigger('valuechange', null, e.target);
	})

	// Active classes for radio input labels
	.on('change valuechange', 'input[type="radio"]', function(e){
		var data = fieldData(e.target);

		if (data.fields) {
			data.fields.each(updateRadioLabel);
		}
	})

	// Active classes for checkbox input labels
	.on('change valuechange', 'input[type="checkbox"]', function(e) {
		var data = fieldData(e.target);

		if (data.field.prop('checked')) {
			data.label.addClass('on');
		}
		else {
			data.label.removeClass('on');
		}
	})

	// For browsers that don't understand it, prevent changes on
	// disabled form elements.
	.on('change', '[disabled]', function(e) {
		// The nuclear approach
		e.preventDefault();
		e.stopPropagation();
		return false;
	})

	.on('focusin focusout', '.button > select, .button > input', function(e) {
		var view = fieldData(e.target);

		if (e.type === 'focusin') {
			view.wrap.addClass('focus');
		}
		else {
			view.wrap.removeClass('focus');
		}
	})

	// Value display for file inputs that are wrapped in buttons
	// for style. Value is set as the text content of the button.
	.on('change valuechange', '.button > input[type="file"]', function(e) {
		updateFileLabel(e.target);
	})

	// If a form is reset, trigger a re-evaluation of the values
	// of custom form elements.
	.on('reset', 'form', function(e) {
		if (e.isDefaultPrevented()) { return; }

		var fields = jQuery('input, textarea, select', e.target);

		function reset() {
			fields.trigger('valuechange');
		}

		setImmediate(reset);
	})

	.ready(function() {
		jQuery('input:checked').each(function() {
			var data = fieldData(this);
			data.label.addClass('on');
		});

		// Loop over .error_labels already in the DOM, and listen for
		// changes on their associated inputs to remove them.
		jQuery('.error_label').each(function(i, label) {
			var id = label.getAttribute('for');

			if (!id) { return; }

			var input = jQuery('#' + id);

			function remove() {
				input.off('change valuechange', remove);
				label.parentNode.removeChild(label);
			}

			input.on('change valuechange', remove);
		});
	});
});

// Create placeholder labels when browser does not
// natively support placeholder attribute.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function( jQuery, undefined ){
	var store = {},
			a = 0;
	
	function identify(fly){
	  // Generate an id, apply it to the input node
	  // and return it.
	  var id = 'input_' + a++ ;
	  
	  fly.id = id;
	  return id;
	}
	
	function changeHandler(e) {
		var input = e.target,
		  	value = input.value,
		  	placeholder = store[input.id];
		
		if ( !value || !value.length ) {
		  placeholder.css({ display: 'block' });
		}
		else {
		  placeholder.css({ display: 'none' });
		};
	}
	
	function focusHandler(e) {
		var input = e.target,
		  	placeholder = store[input.id];
		
		placeholder.css({ display: 'none' });
	}
	
	// Feature detect placeholder support, and when there is no
	// support create placeholder labels to simulate placeholder
	// attributes, and delegate event handlers.
	
	if (!jQuery.support.placeholder) {
		
		// Delegate events coming from inputs and texareas with placeholders.
		
		jQuery(document)
		.on('change focusout', 'textarea[placeholder], input[placeholder]', changeHandler)
		.on('focusin', 'textarea[placeholder], input[placeholder]', focusHandler)
		
		// Create placeholder labels.
		
		.ready(function() {
			var elem = jQuery('textarea[placeholder], input[placeholder]');
			
			elem.each(function(i){
				var input = this,
				    elem = jQuery(this),
				    id = input.id || identify(input),
				    val = input.value,
				    css = elem.position(),
				    height = input.nodeName.toLowerCase() === 'input' ? elem.height() : elem.css('lineHeight'),
				    text = input.getAttribute('placeholder'),
				    placeholder = jQuery('<label/>', {
				    	'class': 'placeholder',
				    	'for': id,
				    	'text': text
				    });

				jQuery.extend(css, {
					height: height + 'px',
					lineHeight: height + 'px',
					fontSize: elem.css('font-size'),
					paddingLeft: elem.css('padding-left'),
					paddingRight: elem.css('padding-right')
				});

				placeholder
				.css(css)
				.insertAfter(elem);

				store[id] = placeholder;

				if (!val || !val.length) {
					placeholder.css({ display: 'block' });
				};
			});
		});
	}
});

// bolt.slide
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on slides.

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

	function jump(e) {
		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }

		// e.data is the pane to jump to.
		trigger(e.data, 'activate');
		e.preventDefault();
	}

	function movestartSlide(e) {
		var panes = e.data;

		// If the movestart heads off in a upwards or downwards direction,
		// 
		if ((e.distX > e.distY && e.distX < -e.distY) ||
			(e.distX < e.distY && e.distX > -e.distY)) {
			e.preventDefault();
			return;
		}

		panes.elem.parent().addClass('notransition');
		
		if (panes.next) {
			panes.next.style.height = 'auto';
		}
		if (panes.prev) {
			panes.prev.style.height = 'auto';
		}
	}

	function moveSlide(e) {
		var panes = e.data,
		    left = 100 * e.distX/panes.pane.offsetWidth;

		
		// This gets the slide effect roughly right. By the time
		// overflow is hidden, we'll never notice.
		if (e.distX < 0) {
			if (panes.next) {
				panes.pane.style.left = left + '%';
				panes.next.style.left = (left+100)+'%';
				//panes.next.style.height = 'auto';
				}
			else {
				panes.pane.style.left = left/5 + '%';
			}
		}
		if (e.distX > 0) {
			if (panes.prev) {
				panes.pane.style.left = left + '%';
				panes.prev.style.left = (left-100)+'%';
				//panes.prev.style.height = 'auto';
				}
			else {
				panes.pane.style.left = left/5 + '%';
			}
		}
	}

	function moveendSlide(e) {
		var panes = e.data;

		panes.elem.parent().removeClass('notransition');
		
		setTimeout( function() {
			panes.pane.style.left = '';
			if (panes.next) {
				panes.next.style.left = '';
				panes.next.style.height = '';
			}
			if (panes.prev) {
				panes.prev.style.left = '';
				panes.prev.style.height = '';
			}
		}, 0);
	}

	function cachePaneData(target, data) {
		var slides = jQuery.data(target, 'slides'),
		    l;

		if (!slides) {
			// Choose all sibling panes of the same class
			slides = data.elem.siblings('.' + data['class']).add(target);
			
			// Attach the panes object to each of the panes
			l = slides.length;
			while (l--) {
				jQuery.data(slides[l], 'slides', slides);
			}
		}

		return slides;
	}

	bolt('slide', {
		activate: function activatePane(e, data, fn) {
			var target = e.target,
			    pane = data.elem,
			    panes = cachePaneData(e.target, data),
			    siblings = {
			    	next: panes[panes.index(target) + 1],
			    	prev: panes[panes.index(target) - 1],
			    	pane: target,
			    	elem: pane
			    },
			    active;
			
			if (data.active) { return; }
			data.active = true;
			
			if (!data.setup) {
				data.setup = true;
				
				add(target, 'movestart', movestartSlide, siblings);
				add(target, 'move', moveSlide, siblings);
				add(target, 'moveend', moveendSlide, siblings);
				
				if (siblings.prev) { add(target, 'swiperight', jump, siblings.prev); }
				if (siblings.next) { add(target, 'swipeleft',  jump, siblings.next); }
				
				add(target, 'click tap',  jump, panes[(panes.index(target) - 1) % panes.length], 'a[href="#prev"]');
				add(target, 'click tap',  jump, panes[(panes.index(target) + 1) % panes.length], 'a[href="#next"]');
			}
			
			active = panes.not(target).filter('.active');

			fn();

			// Deactivate the previous active pane AFTER this pane has been
			// activated. It's important for panes who's style depends on the
			// current active pane, eg: .slide.active ~ .slide
			active.trigger('deactivate');
		},

		deactivate: function(e, data, fn) {
			if (!data.active) { return; }
			data.active = false;
			
			//remove(e.target, 'click tap swiperight swipeleft', jump);
			//remove(e.target, 'movestart', movestartSlide);
			//remove(e.target, 'move', moveSlide);
			//remove(e.target, 'moveend', moveendSlide);

			fn();
		}
	});
});
// bolt.class.tab
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on tabs.

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

	function jump(e) {
		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }

		// e.data is the pane to jump to.
		trigger(e.data, 'activate');
		e.preventDefault();
	}

	function cacheTabs(target, data) {
		var tabs = jQuery.data(target, 'tabs'),
		    l;

		if (!tabs) {
			// Choose all sibling panes of the same class
			tabs = data.elem.siblings('.' + data['class']).add(target);
			
			// Attach the panes object to each of the panes
			l = tabs.length;
			while (l--) {
				jQuery.data(tabs[l], 'tabs', tabs);
			}
		}

		return tabs;
	}

	bolt('tab', {
		activate: function activatePane(e, data, fn) {
			var target = e.target,
			    tabs = cacheTabs(e.target, data),
			    active;

			if (data.active) { return; }
			data.active = true;
			
			add(target, 'click tap',  jump, tabs[(tabs.index(target) - 1) % tabs.length], 'a[href="#prev"]');
			add(target, 'click tap',  jump, tabs[(tabs.index(target) + 1) % tabs.length], 'a[href="#next"]');

			active = tabs.not(target).filter('.active');

			fn();

			// Deactivate the previous active pane AFTER this pane has been
			// activated. It's important for panes who's style depends on the
			// current active pane, eg: .slide.active ~ .slide
			active.trigger('deactivate');
		},

		deactivate: function(e, data, fn) {
			if (!data.active) { return; }
			data.active = false;
			
			remove(e.target, 'click tap swiperight swipeleft', jump);
			fn();
		}
	});
});
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

	bolt('top-tip', {
		activate: function (e, data, fn) {
			if (data.active) { return; }
			data.active = true;

			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = bolt.identify(e.target),
			    relatedOffset = relatedTarget.offset(),
			    relatedHeight = relatedTarget.outerHeight();

			elem
			.addClass('notransition')
			.css({
				margin: 0
			});

			var offset = elem.offset(),
			    position = elem.position(),
			    height = elem.outerHeight();

			elem
			.css({
				margin: '',
				// Round the number to get round a sub-pixel rendering error in Chrome
				left: Math.floor(relatedOffset.left + position.left - offset.left),
				top:  Math.floor(relatedOffset.top + position.top  - offset.top - height)
			});

			elem.width();
			elem.removeClass('notransition');

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


	bolt('right-tip', {
		activate: function (e, data, fn) {
			console.log('RIGHT');
			if (data.active) { return; }
			data.active = true;

			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = bolt.identify(e.target),
			    relatedOffset = relatedTarget.offset(),
			    relatedWidth = relatedTarget.outerWidth();

			elem
			.addClass('notransition')
			.css({
				margin: 0
			});

			var offset = elem.offset(),
			    position = elem.position(),
			    height = elem.outerHeight();

			elem
			.css({
				margin: '',
				// Round the number to get round a sub-pixel rendering error in Chrome
				left: Math.floor(relatedOffset.left + relatedWidth + position.left - offset.left),
				top:  Math.floor(relatedOffset.top + (relatedHeight / 2) + position.top - offset.top - (height / 2))
			});

			elem.width();
			elem.removeClass('notransition');

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

	bolt('tip', {
		activate: function (e, data, fn) {
			if (data.active) { return; }
			data.active = true;
			
			var elem = data.elem,
			    relatedTarget = jQuery(e.relatedTarget),
			    id = bolt.identify(e.target),
			    relatedOffset = relatedTarget.offset();

			elem
			.addClass('notransition')
			.css({
				marginTop: 0,
				marginLeft: 0
			});

			var offset = elem.offset(),
			    position = elem.position();

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
