// jQuery.loop
// 
// Takes a jQuery collection and activates the nodes in sequence.
// 
// Dependencies:
// jquery.event.activate

(function(jQuery, undefined){
	var settings = {
	    	duration: 6000,
	    	delay: 0,
	    	pauseOnHover: true
	    };
	
	jQuery.fn.loop = function(options) {
		var items = this,
		    length = items.length,
		    l = length,
		    i = -1,
		    timer, fn, activeItem;
		
		options = jQuery.extend({}, settings, options);
		
		function activate() {
			fn((i+1)%length);
		}
		
		function activateItem(i) {
			activeItem && activeItem.trigger('deactivate');
			activeItem = items.eq(i).trigger('activate');
		}
		
		function clearTimer() {
			clearTimeout(timer);
			timer = null;
		}
		
		items
		.bind('activate', function(e) {
			var duration = parseInt(e.target.getAttribute('data-duration'), 10) || options.duration;
			
			// Keep index up to date if tab buttons (or anything else)
			// causes a news tab to activate.
			i = items.index(this);
			clearTimer();
			timer = setTimeout(activate, duration);
		});

		if (options.pauseOnHover) {
			items
			.hover(function(e) {
				fn = clearTimer;
			}, function() {
				fn = activateItem;
				// If the timer has stopped, kick it off again
				if (!timer) { activate(); }
			});
		}
		
		// Set the ball rolling
		fn = activateItem;
		timer = setTimeout(activate, options.delay);
		
		return this;
	};
})(jQuery);