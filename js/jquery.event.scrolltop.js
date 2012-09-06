// jquery.event.scrolltop
//
// 0.3
//
// 'scrolltop' and 'scrollbottom' events fire when the user has reached the top
// or bottom scroll limit.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	
	function scrollhandler(e) {
		var elem = e.data,
				scrollTop, scrollHeight;
		
		if (this === window) {
			scrollTop = (document.documentElement.scrollTop || document.body.scrollTop);
			scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		}
		else {
			scrollTop = this.scrollTop;
			scrollHeight = this.scrollHeight - this.clientHeight;
		}
		
		if (scrollTop === 0) {
			e.type = "scrolltop";
		}
		else if (scrollTop === scrollHeight) {
			e.type = "scrollbottom";
		}
		else {
			return;
		}
		
		// let jQuery handle the triggering
		jQuery.event.handle.apply(this, arguments);
	}
	
	function getData(node) {
		var data = jQuery.data(node, 'event.scrolltop');
		
		if (!data) {
			data = { count: 0 };
			jQuery.data(node, 'event.scrolltop', data);
		}
		
		return data;
	}
	
	function setup(data, namespaces, eventHandle) {
		var elem = jQuery(this),
		    data = getData(this);
		
		// Don't bind the scroll handler if it is already bound by the
		// other scroll event.
		if (data.count++ > 0) { return; }
		
		elem.bind('scroll', elem, scrollhandler);
	}
	
	function teardown(namespace) {
		var elem = jQuery(this),
			data = getData(this);

		// If another swipe event is still setup, don't teardown.
		if (--data.count > 0) { return; }
		
		elem.unbind('scroll', scrollhandler);
	}
		
	jQuery.event.special.scrolltop =
	jQuery.event.special.scrollbottom = {
		setup: setup,
		teardown: teardown
	};
});