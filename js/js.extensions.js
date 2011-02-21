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
/**
 * Allow to specify context that will by used when using thie function
 * @function
 * @param context
 */
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