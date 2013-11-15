// jQuery.support.canvas
jQuery.support.canvas = (function() {
	var canvas = document.createElement('canvas');

	return !!(canvas.getContext && canvas.getContext('2d'));
})();