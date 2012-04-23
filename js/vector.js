// vector.js
//
// Provides a Vector constructor (that works with or without the 'new'
// keyword) which takes a pair of [x, y] values as an array, object
// or as straight arguments.
// 
// Properties:
// 
// x, y - Gauranteed to be defined and up-to-date
// a, d - Only kept up to date following a polar manipulation
// 
// Methods:
// 
// add(vector)        - returns a new vector
// subtract(vector)   - returns a new vector
// distance()         - returns the vector's distance 
// distance(distance) - returns a new vector
// angle()            - returns the vector's angle
// angle(radians)     - returns a new vector
// toCartesianArray()
// toPolarArray()
// toString()


(function(ns, undefined){
	var pi = Math.PI,
			pi2 = pi * 2;
	
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
	
	function Vector(obj) {
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
	
	ns.Vector = Vector;
})(window);