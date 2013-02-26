// Extend jQuery with some helper methods

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined) {
	var urlKeys = ("absolute protocol authority userInfo user password host port relative path directory file query anchor").split(" ");
	
	// Parses url into an object with values. Bits and pieces 
	// borrowed from Steven Levithan here:
	// http://blog.stevenlevithan.com/archives/parseuri
	jQuery.parseURL = function(url){
		var str = decodeURI(url),
		    parsed = jQuery.regex.urlParser.exec(str),
		    obj = {},
		    queries = {},
		    l = urlKeys.length;
		
		while (l--) {
			obj[ urlKeys[l] ] = parsed[l];
		}
		
		if (obj.query){
			obj.query.replace( /(?:^|&)([^&=]*)=?([^&]*)/g, function ( rien, key, value ) {
				if (key) {
					queries[key] = value;
				}
			});
			
			delete obj.query;
			obj.queries = queries;
		}
		
		return obj;
	};
});