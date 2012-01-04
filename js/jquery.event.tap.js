// jquery.event.tap
// 
// 0.1
// 
// Emits a tap event as soon as touchend is heard, or a taphold. This is better than simulated
// click events on touch devices, which wait ~300ms before firing, in case they
// should be interpreted as double clicks.

// TODO: Track multi touches.

(function(jQuery, undefined){

	function touchstart(e) {
		var target = e.target,
				currentTarget = e.currentTarget,
				elem = jQuery(e.currentTarget),
				type = "tap",
				duration = 480,
				startTime = +new Date(),
				timer = setTimeout(timeout, duration);
		
		function timeout() {
			clearTimer();
			unbindHandlers();
			
			e.type = "taphold";
			jQuery.event.handle.call(currentTarget, e);
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
			var _type = e.type;
			
			unbindHandlers();
			
			// Ignore if the end target is not the same as the start target.
			if (e.target !== target) { return; }
			
			// Double check that the required time has passed. iOS appears to
			// suspend the timer while a page is gestured, causing a tap event
			// to fire at the end of a scroll. By checking the time we can
			// mitigate this.
			if ((+new Date() - startTime) > duration) { return; }
			
			e.type = 'tap';
			jQuery.event.handle.call(currentTarget, e);
			e.type = _type;
		}

		bindHandlers();
	}

	jQuery.event.special.tap = {
		setup: function setup() {
			jQuery.event.add(this, "touchstart", touchstart);
		},
		
		teardown: function teardown() {
			jQuery.event.remove(this, "touchstart", touchstart);
		}
	};

	// Delegate taphold events to tap events, seeing as that is where
	// they originate.
	jQuery.event.special.taphold = {
		setup: function() {
			jQuery.event.add(this, 'tap', jQuery.noop);
		},
		
		teardown: function() {
			jQuery.event.remove(this, 'tap', jQuery.noop);
		}
	}
})(jQuery);