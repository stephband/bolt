// Define some global symbols
//
// Yeah, they are UTF-8 symbols. What a laugh.

window.π = Math.PI;
window.τ = 2 * π;


// JavaScript extensions

// Nullify console.logs when console.log is not present

(function(){
	if (!window.console) {
		var noop = jQuery ? jQuery.noop : function() {} ;
		
		window.console = {
			group: noop,
			groupEnd: noop,
			log: noop
		};
	}
})();

// typeOf( obj )
//
// Helper function that distinguishes Objects from Arrays
// and Null. From Crockford's site:
//
// http://javascript.crockford.com/remedial.html

window.typeOf = function(value) {
	var s = typeof value;
	
	return s === 'object' ? 
		!value ? 'null' :
		value instanceof Array ? 'array' :
		s :
		s ;
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


// Object.keys
// 
// For those browsers that don’t yet implement Object.keys we can apply the
// following shim (thanks to @jdalton for reminding me to add type checking):

if (typeof Object.keys !== 'function') {
	Object.keys = function(obj) {
		var keys, p;
		
		if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
			throw TypeError("Object.keys called on non-object");
		}
		
		keys = [];
		for (p in obj) {
			obj.hasOwnProperty(p) && keys.push(p);
		}
		return keys;
	}
}


// Number

(function(prototype){

  prototype.toDegrees = function() { return this * 57.295779513; };
  prototype.toRadians = function() { return this / 57.295779513; };
  prototype.limit = function(min, max) { return this > max ? max : this < min ? min : this ; };
  prototype.wrap = function(min, max) { return (this < min ? max : min) + (this - min) % (max - min); };

})(Number.prototype);


// Math object

(function(ns, undefined){
	var pi = Math.PI,
			pi2 = pi * 2;
	
	var Vector = ns.Vector = function(obj) {
		// Don't require the new keyword
		if (!(this instanceof Vector)) {
			return new Vector(arguments);
		}
		
		// Accept input arguments in any old form:
		//
		// x, y
		// { x: x, y: y }
		// { d: d, a: a }
		// { left: x, top: y }
		// [ x, y ]
		// { width: x, height: y }
		// 
		// Anything else will create the vector { x: 0, y: 0 }.
		
		if (arguments.length === 0) {
			this.x = 0;
			this.y = 0;
		}
		else if (arguments.length > 1) {
			this.x = arguments[0];
			this.y = arguments[1];
		}
		else if (obj.x !== undefined && obj.y !== undefined) {
			this.x = obj.x;
			this.y = obj.y;
		}
		else if (obj.d !== undefined && obj.a !== undefined) {
			this.d = obj.d;
			this.a = obj.a;
			addCartesian(this);
		}
		else if (obj.left !== undefined && obj.top !== undefined) {
			this.x = obj.left;
			this.y = obj.top;
		}
		else if (obj[0] !== undefined && obj[1] !== undefined) {
			this.x = obj[0];
			this.y = obj[1];
		}
		else if (obj.width !== undefined && obj.height !== undefined) {
			this.x = obj.width;
			this.y = obj.height;
		}
		else {
			this.x = 0;
			this.y = 0;
		}
	}
	
	Vector.prototype = {
		add: function(vector) {
			if (!(vector instanceof Vector)) {
				vector = new Vector(vector);
			}
			
			return new Vector(this.x + vector.x, this.y + vector.y);
		},
		
		subtract: function(vector) {
			if (!(vector instanceof Vector)) {
				vector = new Vector(vector);
			}
			
			return new Vector(this.x - vector.x, this.y - vector.y);
		},
		
		distance: function(val) {
			var polar, cart;
			
			if (val !== undefined) {
				// Set value
				
				if (this.a === undefined) { addPolar(this); }
				return new Vector({ d: val, a: this.a });
			}
			
			// Get value
			if (this.d === undefined) { addPolar(this); }
			return this.d;
		},
		
		angle: function(val) {
			var polar;
			
			if (val !== undefined) {
				// Set value
				
				if (this.d === undefined) { addPolar(this); }
				return new Vector({ d: this.d, a: val });
			}
			
			// Get value
			if (this.a === undefined) { addPolar(this); }
			return this.a;
		},
		
		toString: function() {
			return [this.x, this.y].join(', ');
		},
		
		toCartesianArray: function() {
			return [this.x, this.y];
		},
		
		toPolarArray: function() {
		  if (this.d === undefined || this.a === undefined) { addPolar(this); }
			return [this.d, this.a];
		}
	};
	
	function addPolar(obj) {
		var x = obj.x,
		    y = obj.y;
		
		// Detect quadrant and work out vector
		if (y === 0) 	{
			if (x === 0)    { obj.d = 0; obj.a = 0; }
			else if (x > 0) { obj.d = x; obj.a = 0.5 * pi; }
			else            { obj.d = -x; obj.a = 1.5 * pi; }
		}
		else if (y < 0) {
			if (x === 0)    { obj.d = -y; obj.a = pi; }
			else            { obj.d = Math.sqrt(x*x + y*y); obj.a = Math.atan(x/y) + pi; }
		}
		else if (y > 0) {
			if (x === 0)    { obj.d = y; obj.a = 0; }
			else            { obj.d = Math.sqrt(x*x + y*y); obj.a = (x > 0) ? Math.atan(x/y) : pi2 + Math.atan(x/y); }
		}
	};
	
	function addCartesian(obj) {
		var d = obj.d,
		    a = obj.a;
		
		obj.x = Math.sin(a) * d;
		obj.y = Math.cos(a) * d;
	};
	
	// Legacy methods for those old bits of code that don't use the
	// Vector constructor.
	
	// Convert cartesian [x, y] to polar [distance, angle] coordinates,
	// downward, anti-clockwise, angles in radians.
	
	ns.toPolar = function(cart) {
		var obj = new Vector(cart);
		return obj.toPolarArray();
	};

	// Convert [distance, angle] vector to cartesian [x, y] coordinates.
	
	ns.toCartesian = function (polar) {
		var obj = new Vector(polar[1] !== undefined ? { d: polar[0], a: polar[1] } : polar);
		return obj.toCartesianArray();
	};
	
})(Math);