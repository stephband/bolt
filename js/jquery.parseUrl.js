(function (module) {
	"use strict";

	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery) {
	"use strict";

	var urlKeys = ("absolute protocol authority userInfo user password host port relative path directory file query anchor").split(" "),
	    rurlParser = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;

	// Parses url into an object with values. Bits and pieces
	// borrowed from Steven Levithan here:
	// http://blog.stevenlevithan.com/archives/parseuri
	jQuery.parseUrl = function(url){
		var str = decodeURI(url),
		    parsed = rurlParser.exec(str),
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