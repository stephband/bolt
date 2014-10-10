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
			// dailog was opened.
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
	
	bolt('slides_dialog_layer', {
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

	bolt('lightbox-dialog_layer', {
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

	bolt('alert_dialog_layer', {
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

	bolt('confirm_dialog_layer', {
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

	bolt('dialog_layer', {
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