// Fallback support for jQuery.fn.addTransitionClass. Also can
// be used in cases where low file size is a proirity.

jQuery.fn.addTransitionClass = function(classes, fn) {
	jQuery.fn.addClass.call(this, classes);
	fn && fn.call(this);
};

jQuery.fn.removeTransitionClass = function(classes, fn) {
	jQuery.fn.removeClass.call(this, classes);
	fn && fn.call(this);
};