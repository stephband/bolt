// jQuery.event.activate.classes
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on elements
// with various classes.

(function( jQuery, undefined ){
	var add = jQuery.event.add,
	    
	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    };


	function identify(node) {
		var id = node.id;

		if (!id) {
			do { id = Math.ceil(Math.random() * 1000000); }
			while (document.getElementById(id));
			node.id = id;
		}

		return id;
	}

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function mousedown(e) {
		var activeTarget = e.data;

		// Ignore mousedowns from all but the left button.
		if (e.type === 'mousedown' && !isLeftButton(e)) { return; }
	
		// If event is in it or on it, do nothing.
		if (activeTarget === e.target || jQuery.contains(activeTarget, e.target)) { return; }
	
		trigger(activeTarget, {type: 'deactivate', relatedTarget: e.target});
	}

	function click(e) {
		var target = e.currentTarget;
		
		// If we've clicked on a file input inside it, wait
		// for the input to change. This is a fix for file
		// inputs not firing change events when they're made
		// invisible. Deserves further investigation.
		if (e.target.nodeName.toLowerCase() === 'input' && document.getAttribute('type') === 'file') {
			jQuery.event.add(e.target, 'change', function(e){
				trigger(target, 'deactivate');
			});
			
			return;
		}
		
		trigger(target, 'deactivate');
	}

	function close(e) {
		var activeTarget = e.data;

		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }
	
		trigger(activeTarget, {type: 'deactivate', relatedTarget: e.target});
		e.preventDefault();
	}

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
		var panes = jQuery.data(target, 'activePane'),
		    l;

	  if (!panes) {
			// Choose all sibling panes of the same class

			panes = data.elem.siblings('.' + data.role).add(target);
			
			// Attach the panes object to each of the panes
			l = panes.length;
			while (l--) {
				jQuery.data(panes[l], 'activePane', panes);
			}
	  }

	  return panes;
	}

	jQuery.extend(jQuery.event.special.activate.classes, {
		tip: {
			activate: function (e, data, fn) {
				var elem = data.elem,
				    relatedTarget = jQuery(e.relatedTarget),
				    id = identify(e.target);
						
				elem.css(relatedTarget.offset());
				add(document, 'tap.' + id, function() {
					trigger(e.target, 'deactivate');
				});

				fn();
	    },

	    deactivate: function (e, data, fn) {
				var id = identify(e.target);

				remove(document, '.' + id);
				fn();
	    }
	  },

		tab: {
			activate: function activatePane(e, data, fn) {
				var target = e.target,
				    panes = cachePaneData(e.target, data),
				    active;

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
				remove(e.target, 'click tap swiperight swipeleft', jump);
				fn();
			}
		},

		slide: {
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
				remove(e.target, 'click tap swiperight swipeleft', jump);
				remove(e.target, 'movestart', movestartSlide);
				remove(e.target, 'move', moveSlide);
				remove(e.target, 'moveend', moveendSlide);

				fn();
			}
		},

		popdown: {
			activate: function(e, data, fn) {
				var id = identify(e.target);

				// Namespace delegated events with the id of the target so that
				// we can easily unbind them again on deactivate.
				add(e.target, 'click tap', close, e.target, 'a[href="#close"]');
				add(document, 'mousedown.' + id + ' tap.' + id, mousedown, e.target);

				fn();
			},

			deactivate: function(e, data, fn) {
				var id = identify(e.target);

				remove(e.target, 'click tap', close);
				remove(document, '.' + id);

				fn();
			}
		},
	  
		dropdown: {
			activate: function(e, data, fn) {
				var id = identify(e.target);

				// Namespace delegated events with the id of the target so that
				// we can easily unbind them again on deactivate.
				add(e.target, 'click tap', click);
				add(document, 'mousedown.' + id + ' tap.' + id, mousedown, e.target);

				fn();
			},

			deactivate: function(e, data, fn) {
				var id = identify(e.target);

				remove(e.target, 'click tap', click);
				remove(document, '.' + id);

				fn();
			}
		}
	});
})(jQuery);