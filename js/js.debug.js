// This file should be the first javascript included
// on the page.

// Store properties of the window object and check
// against them later to see what we have left lying
// around in the global namespace.

(function(window){
	var obj = {},
			key;
	
	for (key in window) {
		if (window.hasOwnProperty(key)) {
			obj[key] = true;
		}
	}
	
	window.debug = {
		globals: function() {
			for (key in window) {
				if (window.hasOwnProperty(key) && !obj[key]) {
					console.log(key);
				}
			}
		};
	};
})(window);