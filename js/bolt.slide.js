// bolt.class.slide
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
			
			add(target, 'movestart', movestartSlide, siblings);
			add(target, 'move', moveSlide, siblings);
			add(target, 'moveend', moveendSlide, siblings);
			add(target, 'swiperight', jump, siblings.prev);
			add(target, 'swipeleft',  jump, siblings.next);
			add(target, 'click tap',  jump, panes[(panes.index(target) - 1) % panes.length], 'a[href="#prev"]');
			add(target, 'click tap',  jump, panes[(panes.index(target) + 1) % panes.length], 'a[href="#next"]');

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
			
			remove(e.target, 'click tap swiperight swipeleft', jump);
			remove(e.target, 'movestart', movestartSlide);
			remove(e.target, 'move', moveSlide);
			remove(e.target, 'moveend', moveendSlide);

			fn();
		}
	});
});