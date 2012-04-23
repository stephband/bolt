// JavaScript extensions


// NOOP console.logs when console.log is not present

(function(){
	function noop() {}
	
	if (!window.console) {
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
};


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