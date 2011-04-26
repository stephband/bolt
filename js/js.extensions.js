// JavaScript extensions

// typeOf( obj )
//
// Helper function that distinguishes Objects from Arrays
// and Null. From Crockford's site:
//
// http://javascript.crockford.com/remedial.html

function typeOf(value) {
	var s = typeof value;
	if (s === 'object') {
		if (value) {
			if (value instanceof Array) {
				s = 'array';
			}
		} else {
			s = 'null';
		}
	}
	return s;
}


// Function.prototype.bind
//
// Implements fn.bind() where it does not natively exist.
// This is a partial workaround from the MDC, found here:
// developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
// 
// Andrea Giamarci's implementation may also be interesting:
// webreflection.blogspot.com/2010/01/javascript-super-bullshit.html

if (!Function.prototype.bind)
	Function.prototype.bind = function(context) {	 
		'use strict';	 
		if (typeof this !== 'function') throw new TypeError();	
		var _slice = Array.prototype.slice,	 
				_concat = Array.prototype.concat,	 
				_arguments = _slice.call(arguments, 1),	 
				_this = this,	 
				_function = function() {	
						return _this.apply(this instanceof _dummy ? this : context,	 
								_concat.call(_arguments, _slice.call(arguments, 0)));	 
				},	
				_dummy = function() {};	 
		_dummy.prototype = _this.prototype;	 
		_function.prototype = new _dummy();
		return _function;	 
};


// Number

(function(prototype){

  prototype.toDegrees = function() { return this * 57.295779513; };
  prototype.toRadians = function() { return this / 57.295779513; };
  prototype.limit = function(min, max) { return this > max ? max : this < min ? min : this ; };
  prototype.wrap = function(min, max) { return (this < min ? max : min) + (this - min) % (max - min); };

})(Number.prototype);


// Math object

(function(Math){
	var pi = Math.PI,
			pi2 = pi * 2;
	
	// Converts cartesian [x, y] to polar [distance, angle] coordinates,
	// downward, anti-clockwise, angle in radians.
	
	Math.toPolar = function(cart) {
		var x = cart[0],
				y = cart[1];
		
		// Detect quadrant and work out vector
		if (y === 0) 	{ return x === 0 ? [0, 0] : x > 0 ? [x, 0.5 * pi] : [-x, 1.5 * pi] ; }
		if (y < 0) 		{ return x === 0 ? [-y, pi] : [Math.sqrt(x*x + y*y), Math.atan(x/y) + pi] ; }
		if (y > 0) 		{ return x === 0 ? [y, 0] : [Math.sqrt(x*x + y*y), (x > 0) ? Math.atan(x/y) : pi2 + Math.atan(x/y)] ; }
	};

	// Converts [distance, angle] vector to cartesian [x, y] coordinates.
	
	Math.toCartesian = function(polar) {
		var d = polar[0],
				a = polar[1];
		
		// Work out cartesian coordinates
		return [ Math.sin(a) * d, Math.cos(a) * d ];
	};
	
})(Math);


// RegExp object

(function(prototype){
	
	// regexp.render(obj) treats this regexp as a template, returning a new
	// regexp object that fills template tags in this with properties obj.
	// Non capturing groups are inserted where tags are followed by regexp
	// operators. See post by Lea Verou, who had the initial idea, and comments:
	// 
	// http://leaverou.me/2011/03/create-complex-regexps-more-easily/
	// 
	// Usage:
	// /regex{{key}}/.render({ key: /template/ }); // Returns /regextemplate/
	// /regex{{key}}*/.render({ key: /template/ }); // Returns /regex(?:template)*/
	
	prototype.render = (function(){
		function replaceFn(obj) {
			return function($0, $1, $2) {
				// $1 is the template key in {{key}}, while $2 exists where
				// the template tag is followed by a repetition operator.
				var r = obj[$1];
				
				if (!r) { throw("Exception: attempting to build RegExp but obj['"+$1+"'] is undefined."); }
				
				// Strip out beginning and end matchers
				r = r.source.replace(/^\^|\$$/g, '');
				
				// Return a non-capturing group when $2 exists, or just the source.
				return $2 ? ['(?:', r, ')', $2].join('') : r ;
			}
		}
		
		return function(obj) {
			return RegExp(
				this.source.replace(/\{\{(\w+)\}\}(\{\d|\?|\*|\+)?/g, replaceFn(obj)),
				(this.global ? 'g' : '') +
				(this.ignoreCase ? 'i' : '') +
				(this.multiline ? 'm' : '')
			);
		};
	})();
	
	// regexp.run(string, fn) calls function fn with arguments
	// [match, capture1, capture2 ... , index, string ] when regexp matches
	// string. Effectively, it's the inverse of string.replace(regex, fn);
	
	prototype.run = function(string, fn) {
		string.replace(this, fn);
		return this;
	};
	
//	// regexp.distribute(string, fn1, fn2 ...) fires the fn corresponding
//	// to the matched capturing group. Useful for pattern based switching.
//	//
//	// Usage:
//	// /(r)|(e)|(g)|(x)/.distribute('e', fn1, fn2, fn3, fn4) // Runs fn2()
//	
//	prototype.distribute = function(string) {
//	  var fns = arguments;
//	  
//	  string.replace(this, function() {
//	  	var l = arguments.length,
//	  			m = 0;
//	  	
//	  	while (++m < l) {
//	  		if (arguments[m] && fns[m]) {
//	  			fns[m](arguments[m], arguments[l-2], string);
//	  		}
//	  	}
//	  });
//	  
//	  return this;
//	};
})(RegExp.prototype);