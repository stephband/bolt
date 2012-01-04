// jquery.event.tap
// 
// 0.1
// 
// Emits a tap event as soon as touchend is heard. This is better than simulated
// click events on touch devices, which wait ~300ms before firing, in case they
// should be interpreted as double clicks.

// TODO: Track multi touches.

(function(jQuery, undefined){

	function touchstart(e) {
		var target = e.target,
				currentTarget = e.currentTarget,
				elem = jQuery(e.currentTarget),
				timer = setTimeout(timeout, 480);

		function timeout() {
			clearTimer();
			unbindHandlers();
		}

		function clearTimer() {
			clearTimeout(timer);
		}

		function bindHandlers() {
			jQuery.event.add(currentTarget, "touchcancel", unbindHandlers);
			jQuery.event.add(currentTarget, "touchend", clearTimer);
			jQuery.event.add(currentTarget, "touchend", touchend);
		}

		function unbindHandlers() {
			jQuery.event.remove(currentTarget, "touchcancel", unbindHandlers);
			jQuery.event.remove(currentTarget, "touchend", clearTimer);
			jQuery.event.remove(currentTarget, "touchend", touchend);
		}

		function touchend(e) {
			var type = e.type;
			
			unbindHandlers();
			
			e.type = "tap";
			jQuery.event.handle.call(currentTarget, e);
			e.type = type;
		}

		bindHandlers();
	}

	function setup(data, namespaces, eventHandle) {
		jQuery.event.add(this, "touchstart", touchstart);
	}

	function teardown(namespace) {
		jQuery.event.remove(this, "touchstart", touchstart);
	}

	jQuery.event.special.tap = {
		setup: setup,
		teardown: teardown
	};
})(jQuery);