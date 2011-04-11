// JavaScript extensions

// typeOf( obj )
//
// Helper function that distinguishes Objects from Arrays
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


// Number.prototype
//
// Just a few helper methods that I use a lot

Number.prototype.toDegrees = function() { return this * 57.295779513; };
Number.prototype.toRadians = function() { return this / 57.295779513; };
Number.prototype.limit = function(min, max) { return this > max ? max : this < min ? min : this ; };
Number.prototype.wrap = function(min, max) { return (this < min ? max : min) + (this - min) % (max - min); };


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