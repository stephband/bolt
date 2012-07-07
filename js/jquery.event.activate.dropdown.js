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