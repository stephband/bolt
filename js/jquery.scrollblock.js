// jQuery.fn.blockScroll
// 
// Prevent scroll events on this node if this node has come
// to the limit of it's scroll travel.
//
// When scrolling a target inside this element, we check all
// nodes up the DOM tree until we hit the current one, making
// sure they have all hit their limits before preventing the
// scroll events.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	function preventScroll(e) {
		var target = e.target,
		    delta = e.wheelDelta !== undefined ? -e.wheelDelta : e.detail,
		    scrollMax, scrollNow;
		
		if (delta < 0) {
			// We're trying to scroll up. Climb down the DOM tree
			// until we hit the current node to see if any nodes
			// have not yet hit 0.
			
			while (target !== e.currentTarget.parentNode) {
				if (target.scrollTop > 0) {
					break;
				}
				
				if (target === e.currentTarget) {
					e.preventDefault();
					break;
				}
				
				target = target.parentNode;
			}
		}
		else {
			// We're trying to scroll down. Climb down the DOM
			// tree until we hit the current node to see if any
			// nodes are not yet at their lower limit.
			
			while (target !== e.currentTarget.parentNode) {
				scrollNow = target.scrollTop;
				target.scrollTop = 999999;
				scrollMax = target.scrollTop;
				target.scrollTop = scrollNow;
				
				if (target.scrollTop < scrollMax) {
					break;
				}
				
				if (target === e.currentTarget) {
					e.preventDefault();
					break;
				}
				
				target = target.parentNode;
			}
		}
	}
	
	jQuery.fn.scrollblock = function(){
		return this.bind('mousewheel DOMMouseScroll', preventScroll);
	};
	
	jQuery.fn.unscrollblock = function(){
		return this.unbind('mousewheel DOMMouseScroll', preventScroll);
	};
});