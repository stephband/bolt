// jquery.event.activate.dialog
// 
// Provides activate and deactivate events for controlling
// on/off state of dialogs.

(function(jQuery, undefined){
	var docElem = jQuery(document.documentElement),

	    add = jQuery.event.add,
	   
	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

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
	}

	jQuery.extend(jQuery.event.special.activate.classes, {
		lightbox_dialog_layer: {
			activate: function(e, data, fn) {
				add(e.target, 'click.dialog tap.dialog', click);
				add(e.target, 'click.dialog tap.dialog', close, 'close', '.close_button');
				disableScroll();
				count++;
				fn();
			},

			deactivate: function(e, data, fn) {
				remove(e.target, 'click tap', click);
				remove(e.target, 'click tap', close);
				fn();
			},

			deactivateend: deactivateend
		},

		alert_dialog_layer: {
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
		},

		confirm_dialog_layer: {
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
		},

		dialog_layer: {
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
		}
	});
})(jQuery);