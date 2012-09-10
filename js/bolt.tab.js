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