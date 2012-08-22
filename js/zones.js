(function() {
	var win = jQuery(window),
	    
	    zones = {
	    	'a_zone': {
	    		min: 200,
	    		max: 600
	    	},
	    	'b_zone': {
	    		min: 500,
	    		max: 1200
	    	}
	    },
	    
	    body;

	function assignBody() {
		body = jQuery(document.body);
	}

	win
	.on('scroll', function() {
		var scrollTop = node.scrollTop,
		    zone, obj;
		
		for (zone in zones) {
			obj = zones[zone];
			
			if (scrollTop < obj.max && scrollTop >= obj.min) {
				if (obj.active) { break; }
				if (!body) { assignBody(); }
				
				elem.addClass(zone);
				obj.active = true;
			}
			else {
				if (!obj.active) { break; }
				if (!body) { assignBody(); }
				
				elem.removeClass(zone);
				obj.active = false;
			}
		}
	});
})();