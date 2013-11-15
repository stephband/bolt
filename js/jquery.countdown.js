// jquery.countdown.js
// 
// jQuery(selector).countdown(date, callback);
// 
// Takes an elem with descendants .d_count, .h_count, .m_count
// and .s_count, adn fills them with numbers counting down to
// date, at which point the callback is called.

(function(jQuery, undefined){
	var debug = false;
	
	function doubleDigits(n) {
		return (n < 10 ? '0' : '') + n;
	}

	function renderTime(targetMs, days, hours, mins, secs) {
		var date = new Date(),
			ms = targetMs - date.getTime(),
			d = Math.floor(ms/86400000),
			dms = ms - d * 86400000,
			h = Math.floor(dms/3600000),
			hms = dms - h * 3600000,
			m = Math.floor(hms/60000),
			mms = hms - m * 60000,
			s = Math.floor(mms/1000),
			t;
	
		if (days) { days.html(doubleDigits(d)); }
		if (hours) { hours.html(doubleDigits(h)); }
		if (mins) { mins.html(doubleDigits(m)); }
		if (secs) { secs.html(doubleDigits(s)); }
	}

	
	jQuery.fn.countdown = function(date, fn) {
		this.each(function () {
			var elem = jQuery(this),
			    days = elem.find('.d_count'),
			    hours = jQuery('.h_count'),
			    mins = jQuery('.m_count'),
			    secs = jQuery('.s_count'),
			    now = new Date(),
			    interval;
			
			function tick() {
				if (date <= (new Date()).getTime()) {
					clearInterval(interval);
					interval = null;
					return fn && fn();
				}
				
				renderTime(date, days, hours, mins, secs);
			}
			
			if (date instanceof Date) {
				date = date.getTime();
			}
			
			interval = setInterval(tick, 1000);
			
			tick();
		});
	};
})(jQuery);