// render
// 
// Very simple rendering of variables into strings or regex.
// 
// render(template, object)
// 
// Where template is a string or regex object with curly-braced
// variable names like 'hello {{name}}' or regex and object is
// a list of replacement values, like { name: 'Arthur' }.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	function replaceStringFn(obj) {
		return function($0, $1) {
			// $1 is the template key. Don't render falsy values like undefined.
			var value = obj[$1];
			
			return value instanceof Array ?
				value.join(', ') :
				value === undefined || value === null ? '' :
				value ;
		};
	}
	
	function replaceRegexFn(obj) {
		return function($0, $1, $2) {
			// $1 is the template key in {{key}}, while $2 exists where
			// the template tag is followed by a repetition operator.
			var r = obj[$1];
			
			if (r === undefined || r === null) { throw new Error("Exception: attempting to build RegExp but obj['"+$1+"'] is undefined."); }
			
			// Strip out beginning and end matchers
			r = r.source.replace(/^\^|\$$/g, '');
			
			// Return a non-capturing group when $2 exists, or just the source.
			return $2 ? ['(?:', r, ')', $2].join('') : r ;
		};
	}
	
	function render(template, obj) {
		return (template instanceof RegExp) ?
			RegExp(
				template.source.replace(/\{\{\s*(\w+)\s*\}\}(\{\d|\?|\*|\+)?/g, replaceRegexFn(obj)),
				(template.global ? 'g' : '') +
				(template.ignoreCase ? 'i' : '') +
				(template.multiline ? 'm' : '')
			) :
			template
			.replace(render.comment, '')
			.replace(render.tag, replaceStringFn(obj));
	};
	
	render.comment = /\{\%\s*.+?\s*\%\}/g;
	render.tag = /\{\{\s*(\w+)\s*\}\}/g;
	
	if (window.jQuery) { jQuery.render = render; }
	
	return render;
});