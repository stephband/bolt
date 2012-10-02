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
	var docElem = jQuery(document.documentElement),

	    win = jQuery(window),

	    add = jQuery.event.add,  // elem, types, handler, data, selector

	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    resizeEvent = ("onorientationchange" in window) ? "orientationchange" : "resize" ,
	    
	    count = 0;

	function preventDefault(e) {
		e.preventDefault();
	}

	function disableScroll() {
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
		add(document, 'touchmove', preventDefault);
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
		remove(document, 'touchmove', preventDefault);
	}

	function preventDefaultOutside(e) {
		var node = e.data,
		    target = e.target;
		
		if (node === target || jQuery.contains(node, target)) { return; }
		
		e.preventDefault();
	}

	function disableActivate(dialog) {
		add(document, 'deactivate', preventDefaultOutside, dialog, '.popdown, .dropdown');
	}

	function enableActivate(dialog) {
		remove(document, 'deactivate', preventDefaultOutside);
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
			disableScroll();

			add(e.target, 'click.dialog tap.dialog', click);
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.close_button');
			add(e.target, 'click.dialog tap.dialog', prev, slides, '.prev_button');
			add(e.target, 'click.dialog tap.dialog', next, slides, '.next_button');
			add(window, resizeEvent + '.dialog_' + count, rescale, data);
			
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

			fn();
		},

		deactivateend: deactivateend
	});

	bolt('lightbox_dialog_layer', {
		activate: function(e, data, fn) {
			add(e.target, 'click.dialog tap.dialog', click);
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.close_button');
			disableScroll();
			disableActivate(e.target);
			count++;
			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', click);
			remove(e.target, 'click tap', close);
			fn();
		},

		deactivateend: deactivateend
	});

	bolt('alert_dialog_layer', {
		activate: function(e, data, fn) {
			add(e.target, 'click.dialog tap.dialog', close, 'confirm', '.confirm_button');
			disableScroll();
			count++;
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
			add(e.target, 'click.dialog tap.dialog', close, 'close', '.cancel_button');
			add(e.target, 'click.dialog tap.dialog', close, 'confirm', '.confirm_button');
			disableScroll();
			count++;
			fn();
		},

		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', close);
			fn();
		},

		deactivateend: deactivateend
	});

	bolt('dialog_layer', {
		activate: function(e, data, fn) {
			add(e.target, 'click.dialog tap.dialog', click);
			disableScroll();
			count++;
			fn();
		},
		
		deactivate: function(e, data, fn) {
			remove(e.target, 'click tap', click);
			fn();
		},

		deactivateend: deactivateend
	});
});