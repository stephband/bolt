// jQuery.event.activate.tab
//
// Extends the default behaviour of the activate and deactivate
// events with things to do when they are triggered on tabs.

(function(jQuery, undefined){
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
		}
	});
})(jQuery);