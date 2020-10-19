/**
cache(fn)
Returns a function that caches the output values of `fn(input)`
against input values in a map, such that for each input value
`fn` is only ever called once.
*/

function cache(fn) {
    var map = new Map();

    return function cache(object) {

        if (map.has(object)) {
            return map.get(object);
        }

        var value = fn(object);
        map.set(object, value);
        return value;
    };
}

/**
curry(fn [, muteable, arity])
Returns a function that wraps `fn` and makes it partially applicable.
*/
const A     = Array.prototype;

function applyFn(fn, args) {
    return typeof fn === 'function' ? fn.apply(null, args) : fn ;
}

function curry(fn, muteable, arity) {
    arity = arity || fn.length;

    var memo = arity === 1 ?
        // Don't cache if `muteable` flag is true
        muteable ? fn : cache(fn) :

        // It's ok to always cache intermediate memos, though
        cache(function(object) {
            return curry(function() {
                var args = [object];
                args.push.apply(args, arguments);
                return fn.apply(null, args);
            }, muteable, arity - 1) ;
        }) ;

    return function partial(object) {
        return arguments.length === 0 ?
            partial :
        arguments.length === 1 ?
            memo(object) :
        arguments.length === arity ?
            fn.apply(null, arguments) :
        arguments.length > arity ?
            applyFn(fn.apply(null, A.splice.call(arguments, 0, arity)), arguments) :
        applyFn(memo(object), A.slice.call(arguments, 1)) ;
    };
}

/**
ready(fn)
Calls `fn` on DOM content load, or if later than content load, immediately
(on the next tick).
*/

const ready = new Promise(function(accept, reject) {
	function handle(e) {
		document.removeEventListener('DOMContentLoaded', handle);
		window.removeEventListener('load', handle);
		accept(e);
	}

	document.addEventListener('DOMContentLoaded', handle);
	window.addEventListener('load', handle);
});

var ready$1 = ready.then.bind(ready);

/**
rest(n, array)
**/

function rest(i, object) {
    if (object.slice) { return object.slice(i); }
    if (object.rest)  { return object.rest(i); }

    var a = [];
    var n = object.length - i;
    while (n--) { a[n] = object[n + i]; }
    return a;
}

/**
choose(fn, map)
Returns a function that takes its first argument as a key and uses it
to select a function in `map` which is invoked with the remaining arguments.

Where `map` has a function `default`, that function is run when a key
is not found, otherwise unfound keys will error.

```
var fn = choose({
    'fish':  function fn1(a, b) {...},
    'chips': function fn2(a, b) {...}
});

fn('fish', a, b);   // Calls fn1(a, b)
```
*/

function choose(map) {
    return function choose(key) {
        var fn = map[key] || map.default;
        return fn && fn.apply(this, rest(1, arguments)) ;
    };
}

/**
noop()
Returns undefined.
*/

function noop() {}

/**
toArray(object)
*/

function toArray(object) {
    if (object.toArray) { return object.toArray(); }

    // Speed test for array conversion:
    // https://jsperf.com/nodelist-to-array/27

    var array = [];
    var l = object.length;
    var i;

    if (typeof object.length !== 'number') { return array; }

    array.length = l;

    for (i = 0; i < l; i++) {
        array[i] = object[i];
    }

    return array;
}

const A$1 = Array.prototype;
const S = String.prototype;

/**
byAlphabet(a, b)
Compares `a` against `b` alphabetically using the current locale alphabet.
**/

function byAlphabet(a, b) {
    return S.localeCompare.call(a, b);
}

/**
each(fn, array)
Calls `fn` for each member in `array`.
**/

function each(fn, object) {
    // A stricter version of .forEach, where the callback fn
    // gets a single argument and no context.
    var l, n;

    if (typeof object.each === 'function') {
        object.each(fn);
    }
    else {
        l = object.length;
        n = -1;
        while (++n < l) { fn(object[n]); }
    }

    return object;
}

/**
map(fn, object)
Delegates to `object.map` or `Array.map` to return a new collection of mapped
values.
**/

function map(fn, object) {
    return object && object.map ? object.map(fn) : A$1.map.call(object, fn) ;
}

/**
filter(fn, object)
Delegates to `object.filter` or `Array.filter` to return a new collection of
filtered objects.
**/

function filter(fn, object) {
    return object.filter ?
        object.filter(fn) :
        A$1.filter.call(object, fn) ;
}

/**
reduce(fn, seed, object)
Delegates to `object.reduce` or `Array.reduce` to return a reduced value.
**/

function reduce(fn, seed, object) {
    return object.reduce ?
        object.reduce(fn, seed) :
        A$1.reduce.call(object, fn, seed);
}

function sort(fn, object) {
    return object.sort ? object.sort(fn) : A$1.sort.call(object, fn);
}

/**
concat(array2, array1)
Where JavaScript's Array.concat only works reliably on arrays, `concat`
will glue together any old array-like object.
**/

function concat(array2, array1) {
    // A.concat only works with arrays - it does not flatten array-like
    // objects. We need a robust concat that will glue any old thing
    // together.
    return Array.isArray(array1) ?
        // 1 is an array. Convert 2 to an array if necessary
        array1.concat(Array.isArray(array2) ? array2 : toArray(array2)) :

    array1.concat ?
        // It has it's own concat method. Lets assume it's robust
        array1.concat(array2) :
    // 1 is not an array, but 2 is
    toArray(array1).concat(Array.isArray(array2) ? array2 : toArray(array2)) ;
}

function contains(value, object) {
    return object.includes ?
        object.includes(value) :
    object.contains ?
        object.contains(value) :
    A$1.includes ?
        A$1.includes.call(object, value) :
        A$1.indexOf.call(object, value) !== -1 ;
}

function find(fn, object) {
    return A$1.find.call(object, fn);
}


function slice(n, m, object) {
    return object.slice ?
        object.slice(n, m) :
        A$1.slice.call(object, n, m) ;
}

/**
exec(regex, fn, string)

Calls `fn` with the result of `regex.exec(string)` if that result is not null,
and returns the resulting value.
*/

function exec(regex, fn, string) {
    let data;

    // If string looks like a regex result, get rest of string
    // from latest index
    if (typeof string !== 'string' && string.input !== undefined && string.index !== undefined) {
        data = string;
        string = data.input.slice(
            string.index
            + string[0].length
            + (string.consumed || 0)
        );
    }

    // Look for tokens
    const tokens = regex.exec(string);
    if (!tokens) { return; }

    const output = fn(tokens);

    // If we have a parent tokens object update its consumed count
    if (data) {
        data.consumed = (data.consumed || 0)
            + tokens.index
            + tokens[0].length
            + (tokens.consumed || 0) ;
    }

    return output;
}

var exec$1 = curry(exec, true);

function error(regex, reducers, string) {
    if (string.input !== undefined && string.index !== undefined) {
        string = string.input;
    }

    throw new Error('Cannot parse string "' + string + '"');
}

function reduce$1(reducers, acc, tokens) {
    let n = -1;

    while (++n < tokens.length) {
        acc = (tokens[n] !== undefined && reducers[n]) ? reducers[n](acc, tokens) : acc ;
    }

    // Call the optional close fn
    return reducers.close ?
        reducers.close(acc, tokens) :
        acc ;
}

/**
capture(regex, reducers, accumulator, string)
Parse `string` with `regex`, calling functions in `reducers` to modify
and return `accumulator`.

Reducers is an object of functions keyed by the index of their capturing
group in the regexp result (`0` corresponding to the entire regex match,
the first capturing group being at index `1`). Reducer functions are
called in capture order for all capturing groups that captured something.
Reducers may also define the function 'close', which is called at the end
of every capture. All reducer functions are passed the paremeters
`(accumulator, tokens)`, where `tokens` is the regexp result, and are expected
to return a value that is passed as an accumulator to the next reducer function.

Reducers may also define a function `'catch'`, which is called when a match
has not been made (where `'catch'` is not defined an error is thrown).

```js
const parseValue = capture(/^\s*(-?\d*\.?\d+)(\w+)?\s*$/, {
    // Create a new accumulator object each call
    0: () => ({}),

    1: (acc, tokens) => {
        acc.number = parseFloat(tokens[1]);
        return acc;
    },

    2: (acc, tokens) => {
        acc.unit = tokens[2];
        return acc;
    }
}, null);

const value = parseValue('36rem');    // { number: 36, unit: 'rem' }
```
*/

function capture(regex, reducers, acc, string) {
    const output = exec(regex, (tokens) => reduce$1(reducers, acc, tokens), string);

    // If tokens is undefined exec has failed apply regex to string
    return output === undefined ?
        // If there is a catch function, call it, otherwise error out
        reducers.catch ?
            reducers.catch(acc, string) :
            error(regex, reducers, string) :

        // Return the accumulator
        output ;
}

curry(capture, true);

/**
choke(fn, time)

Returns a function that waits for `time` seconds without being invoked
before calling `fn` using the context and arguments from the latest
invocation.
*/

function choke(fn, time) {
    var timer, context, args;
    var cue = function cue() {
        if (timer) { clearTimeout(timer); }
        timer = setTimeout(update, (time || 0) * 1000);
    };

    function update() {
        timer = false;
        fn.apply(context, args);
    }

    function cancel() {
        // Don't permit further changes to be queued
        cue = noop;

        // If there is an update queued apply it now
        if (timer) { clearTimeout(timer); }
    }

    function wait() {
        // Store the latest context and arguments
        context = this;
        args = arguments;

        // Cue the update
        cue();
    }

    wait.cancel = cancel;
    return wait;
}

// Choke or wait? A simpler implementation without cancel(), I leave this here for reference...
//	function choke(seconds, fn) {
//		var timeout;
//
//		function update(context, args) {
//			fn.apply(context, args);
//		}
//
//		return function choke() {
//			clearTimeout(timeout);
//			timeout = setTimeout(update, seconds * 1000, this, arguments);
//		};
//	}

/**
compose(fn2, fn1)
Calls `fn1`, passes the result to `fn2`, and returns that result.
*/

function compose(fn2, fn1) {
    return function compose() {
        return fn2(fn1.apply(null, arguments));
    };
}

function equals(a, b) {
    // Fast out if references are for the same object
    if (a === b) { return true; }

    // If either of the values is null, or not an object, we already know
    // they're not equal so get out of here
    if (a === null ||
        b === null ||
        typeof a !== 'object' ||
        typeof b !== 'object') {
        return false;
    }

    // Compare their enumerable keys
    const akeys = Object.keys(a);
    let n = akeys.length;

    while (n--) {
        // Has the property been set to undefined on a?
        if (a[akeys[n]] === undefined) {
            // We don't want to test if it is an own property of b, as
            // undefined represents an absence of value
            if (b[akeys[n]] === undefined) {
                return true;
            }
        }
        else {
            //
            if (b.hasOwnProperty(akeys[n]) && !equals(a[akeys[n]], b[akeys[n]])) {
                return false;
            }
        }
    }

    return true;
}

curry(equals, true);

function get(key, object) {
    // Todo? Support WeakMaps and Maps and other map-like objects with a
    // get method - but not by detecting the get method
    return object[key];
}

var get$1 = curry(get, true);

var rpath  = /\[?([-\w]+)(?:=(['"])([^\2]+)\2|(true|false)|((?:\d*\.)?\d+))?\]?\.?/g;

function findByProperty(key, value, array) {
    var l = array.length;
    var n = -1;

    while (++n < l) {
        if (array[n][key] === value) {
            return array[n];
        }
    }
}


// Get path

function getRegexPathThing(regex, path, object, fn) {
    var tokens = regex.exec(path);

    if (!tokens) {
        throw new Error('Fn.getPath(path, object): invalid path "' + path + '"');
    }

    var key      = tokens[1];
    var property = tokens[3] ?
        findByProperty(key,
            tokens[2] ? tokens[3] :
            tokens[4] ? Boolean(tokens[4]) :
            parseFloat(tokens[5]),
        object) :
        object[key] ;

    return fn(regex, path, property);
}

function getRegexPath(regex, path, object) {
    return regex.lastIndex === path.length ?
        object :
    !(object && typeof object === 'object') ?
        undefined :
    getRegexPathThing(regex, path, object, getRegexPath) ;
}

function getPath(path, object) {
    rpath.lastIndex = 0;
    return getRegexPath(rpath, path, object) ;
}

curry(getPath, true);

/**
has(key, value, object)
Returns `true` if `object[key]` is strictly equal to `value`.
*/

function has(key, value, object) {
    return object[key] === value;
}

curry(has, true);

/**
id(value)
Returns `value`.
*/

function id(value) { return value; }

/**
invoke(name, parameters, object)
Invokes `object.name()` with `parameters` as arguments. For example:

```
models.forEach(invoke('save', [version]));
```
*/

function invoke(name, values, object) {
    return object[name].apply(object, values);
}

var invoke$1 = curry(invoke, true);

const is = Object.is || function is(a, b) { return a === b; };

curry(is, true);

/**
isDefined(value)
Check for value – where `value` is `undefined`, `NaN` or `null`, returns
`false`, otherwise `true`.
*/


function isDefined(value) {
    // !!value is a fast out for non-zero numbers, non-empty strings
    // and other objects, the rest checks for 0, '', etc.
    return !!value || (value !== undefined && value !== null && !Number.isNaN(value));
}

function latest(source) {
    var value = source.shift();
    return value === undefined ? arguments[1] : latest(source, value) ;
}

/**
matches(selector, object)
Where `selector` is an object containing properties to be compared against
properties of `object`. If they are all strictly equal, returns `true`,
otherwise `false`.

```
const vegeFoods = menu.filter(matches({ vegetarian: true }));
```
*/

function matches(object, item) {
	let property;
	for (property in object) {
		if (object[property] !== item[property]) { return false; }
	}
	return true;
}

curry(matches, true);

const done     = { done: true };
const iterator = { next: () => done };

var nothing = Object.freeze({
    // Standard array methods
    shift:   noop,
    push:    noop,
    join:    function() { return ''; },
    forEach: noop,
    map:     function() { return this; },
    filter:  function() { return this; },

    // Stream methods
    start: noop,
    stop:  noop,

    // Make it look like an empty array
    length: 0,

    // Make it an iterable with nothing in it
    [Symbol.iterator]: () => iterator
});

/**
overload(fn, map)

Returns a function that calls a function at the property of `object` that
matches the result of calling `fn` with all arguments.</p>

```
var fn = overload(toType, {
    string: function a(name, n) {...},
    number: function b(n, m) {...}
});

fn('pie', 4); // Returns a('pie', 4)
fn(1, 2);     // Returns b(1, 2)
```
*/


function overload(fn, map) {
    return function overload() {
        const key     = fn.apply(null, arguments);
        const handler = (map[key] || map.default);

        if (!handler) {
            throw new Error('overload() no handler for "' + key + '"');
        }

        return handler.apply(this, arguments);
    };
}

/**
parseInt(string)
Parse to integer without having to worry about the radix parameter,
making it suitable, for example, to use in `array.map(parseInt)`.
*/

function parseInteger(object) {
    return object === undefined ?
        undefined :
        parseInt(object, 10);
}

/**
parseValue(units, string)

Parse `string` as a value with a unit (such as `"3px"`). Parameter `units` is an
object of functions keyed by the unit postfix. It may also have a `catch`
function.

```js=
const value = parseValue({
    px: function(n) {
        return n;
    },

    catch: function(string) {
        if (typeof string === 'number') {
            return string;
        }

        throw new Error('Cannot parse px value');
    }
}, '36px');
```
**/

// Be generous in what we accept, space-wise, but exclude spaces between the 
// number and the unit
const runit = /^\s*([+-]?\d*\.?\d+)([^\s\d]*)\s*$/;

function parseValue(units, string) {
    // Allow number to pass through
    if (typeof string === 'number') {
        return string;        
    }

    var entry = runit.exec(string);

    if (!entry || !units[entry[2] || '']) {
        if (!units.catch) {
            throw new Error('Cannot parse value "' + string + '" with provided units ' + Object.keys(units).join(', '));
        }

        return units.catch(string);
    }

    return units[entry[2] || ''](parseFloat(entry[1]));
}

var parseVal = curry(parseValue);

function apply(value, fn) {
    return fn(value);
}

/**
pipe(fn1, fn2, ...)
Returns a function that calls `fn1`, `fn2`, etc., passing the result of
calling one function to the next and returning the the last result.
*/

const A$2 = Array.prototype;

function pipe() {
    const fns = arguments;
    return fns.length ?
        (value) => A$2.reduce.call(fns, apply, value) :
        id ;
}

const $privates = Symbol('privates');

function privates(object) {
    return object[$privates]
        || Object.defineProperty(object, $privates, { value: {} })[$privates] ;
}

/**
set(key, object, value)

```
// Set `input.value` whenever a value is pushed into a stream:
stream.scan(set('value'), input);
```
*/

function set(key, object, value) {
    return typeof object.set === "function" ?
        object.set(key, value) :
        (object[key] = value) ;
}

var set$1 = curry(set, true);

var rpath$1  = /\[?([-\w]+)(?:=(['"])([^\2]+)\2|(true|false)|((?:\d*\.)?\d+))?\]?\.?/g;

function findByProperty$1(key, value, array) {
    var l = array.length;
    var n = -1;

    while (++n < l) {
        if (array[n][key] === value) {
            return array[n];
        }
    }
}

function setRegexPath(regex, path, object, thing) {
    var tokens = regex.exec(path);

    if (!tokens) {
        throw new Error('Fn.getPath(path, object): invalid path "' + path + '"');
    }

    var key = tokens[1];

    if (regex.lastIndex === path.length) {
        // Cannot set to [prop=value] selector
        if (tokens[3]) {
            throw new Error('Fn.setPath(path, object): invalid path "' + path + '"');
        }

        return object[key] = thing;
    }

    var value = tokens[3] ?
        findByProperty$1(key,
            tokens[2] ? tokens[3] :
            tokens[4] ? Boolean(tokens[4]) :
            parseFloat(tokens[5])
        ) :
        object[key] ;

    if (!(value && typeof value === 'object')) {
        value = {};

        if (tokens[3]) {
            if (object.push) {
                value[key] = tokens[2] ?
                    tokens[3] :
                    parseFloat(tokens[3]) ;

                object.push(value);
            }
            else {
                throw new Error('Not supported');
            }
        }

        set(key, object, value);
    }

    return setRegexPath(regex, path, value, thing);
}

function setPath(path, object, value) {
    rpath$1.lastIndex = 0;
    return setRegexPath(rpath$1, path, object, value);
}

curry(setPath, true);

/**
toClass(object)
*/

const O = Object.prototype;

function toClass(object) {
    return O.toString.apply(object).slice(8, -1);
}

/**
toFixed(number)
*/

const N     = Number.prototype;
const isNaN = Number.isNaN;

function toFixed(n, value) {
    if (isNaN(value)) {
        return '';
        // throw new Error('Fn.toFixed does not accept NaN.');
    }

    return N.toFixed.call(value, n);
}

curry(toFixed, true);

/**
toType(object)
Returns `typeof object`.
*/

function toType(object) {
    return typeof object;
}

/**
weakCache(fn)
Returns a function that caches the return values of `fn()`
against input values in a WeakMap, such that for each input value
`fn` is only ever called once.
*/

function weakCache(fn) {
    var map = new WeakMap();

    return function weakCache(object) {

        if (map.has(object)) {
            return map.get(object);
        }

        var value = fn(object);
        map.set(object, value);
        return value;
    };
}

/**
prepend(string1, string2)
Returns `str1 + str2`.
**/

function prepend(string1, string2) {
    return '' + string1 + string2;
}

var prepend$1 = curry(prepend);

const assign = Object.assign;

function isDone(source) {
    return source.length === 0 || source.status === 'done' ;
}

function create(object, fn) {
    var functor = Object.create(object);
    functor.shift = fn;
    return functor;
}

function arrayReducer(array, value) {
    array.push(value);
    return array;
}

function shiftTap(shift, fn) {
    return function tap() {
        var value = shift();
        value !== undefined && fn(value);
        return value;
    };
}

function sortedSplice(array, fn, value) {
    // Splices value into array at position determined by result of fn,
    // where result is either in the range [-1, 0, 1] or [true, false]
    var n = sortIndex(array, function(n) {
        return fn(value, n);
    });
    array.splice(n, 0, value);
}

function sortIndex(array, fn) {
    var l = array.length;
    var n = l + l % 2;
    var i = 0;

    while ((n = Math.floor(n / 2)) && (i + n <= l)) {
        if (fn(array[i + n - 1]) >= 0) {
            i += n;
            n += n % 2;
        }
    }

    return i;
}

/** Properties */

/**
.status
Reflects the running status of the stream. When all values have been consumed
status is `'done'`.
*/

function Fn(fn) {
    // Accept constructor without `new`
    if (!this || !Fn.prototype.isPrototypeOf(this)) {
        return new Fn(fn);
    }

    var source = this;

    if (!fn) {
        source.status = 'done';
        return;
    }

    var value = fn();

    if (value === undefined) {
        source.status = 'done';
        return;
    }

    this.shift = function shift() {
        if (source.status === 'done') { return; }

        var v = value;

        // Where the next value is undefined mark the functor as done
        value = fn();
        if (value === undefined) {
            source.status = 'done';
        }

        return v;
    };
}


assign(Fn, {

    // Constructors

    of: function() { return Fn.from(arguments); },

    from: function(object) {
        var i;

        // object is an array or array-like object. Iterate over it without
        // mutating it.
        if (typeof object.length === 'number') {
            i = -1;

            return new Fn(function shiftArray() {
                // Ignore undefined holes in arrays
                return ++i >= object.length ?
                    undefined :
                object[i] === undefined ?
                    shiftArray() :
                    object[i] ;
            });
        }

        // object is an object with a shift function
        if (typeof object.shift === "function" && object.length === undefined) {
            return new Fn(function shiftObject() {
                return object.shift();
            });
        }

        // object is an iterator
        if (typeof object.next === "function") {
            return new Fn(function shiftIterator() {
                var result = object.next();

                // Ignore undefined holes in iterator results
                return result.done ?
                    result.value :
                result.value === undefined ?
                    shiftIterator() :
                    result.value ;
            });
        }

        throw new Error('Fn: from(object) object is not a list of a known kind (array, functor, stream, iterator).')
    }
});


function scanChunks(data, value) {
    data.accumulator.push(value);
    ++data.count;

    if (data.count % data.n === 0) {
        data.value = data.accumulator;
        data.accumulator = [];
    }
    else {
        data.value = undefined;
    }

    return data;
}

assign(Fn.prototype, {
    shift: noop,

    // Input

    of: function() {
        // Delegate to the constructor's .of()
        return this.constructor.of.apply(this.constructor, arguments);
    },

    // Transform

    ap: function(object) {
        var stream = this;

        return create(this, function ap() {
            var fn = stream.shift();
            return fn && object.map(fn) ;
        });
    },

    /**
    .unshift(...values)
    Creates a buffer of values at the end of the stream that are read first.
    */

    unshift: function() {
        var source = this;
        var buffer = toArray(arguments);

        return create(this, function() {
            return (buffer.length ? buffer : source).shift() ;
        });
    },

    catch: function(fn) {
        var source = this;

        return create(this, function() {
            try {
                return source.shift();
            }
            catch(e) {
                return fn(e);
            }
        });
    },

    syphon: function(fn) {
        var shift   = this.shift;
        var buffer1 = [];
        var buffer2 = [];

        this.shift = function() {
            if (buffer1.length) { return buffer1.shift(); }

            var value;

            while ((value = shift()) !== undefined && fn(value)) {
                buffer2.push(value);
            }

            return value;
        };

        return create(this, function filter() {
            if (buffer2.length) { return buffer2.shift(); }

            var value;

            while ((value = shift()) !== undefined && !fn(value)) {
                buffer1.push(value);
            }

            return value;
        });
    },

    clone: function() {
        var source  = this;
        var shift   = this.shift;
        var buffer1 = [];
        var buffer2 = [];
        var doneFlag = false;

        // Messy. But it works. Just.

        this.shift = function() {
            var value;

            if (buffer1.length) {
                value = buffer1.shift();

                if (!buffer1.length && doneFlag) {
                    source.status = 'done';
                }

                return value;
            }

            if (!doneFlag) {
                value = shift();

                if (source.status === 'done') {
                    doneFlag = true;
                }

                if (value !== undefined) {
                    buffer2.push(value);
                }

                return value;
            }
        };

        var clone = new Fn(function shiftClone() {
            var value;

            if (buffer2.length) {
                return buffer2.shift();
                //if (!buffer2.length && doneFlag) {
                //	clone.status = 'done';
                //}
            }

            if (!doneFlag) {
                value = shift();

                if (source.status === 'done') {
                    doneFlag = true;
                    source.status = undefined;
                }

                if (value !== undefined) {
                    buffer1.push(value);
                }

                return value;
            }
        });

        return clone;
    },

    concat: function() {
        var sources = toArray(arguments);
        var source  = this;

        var stream  = create(this, function concat() {
            if (source === undefined) {
                stream.status = 'done';
                return;
            }

            if (isDone(source)) {
                source = sources.shift();
                return concat();
            }

            var value = source.shift();

            stream.status = sources.length === 0 && isDone(source) ?
                'done' : undefined ;

            return value;
        });

        return stream;
    },

    /**
    .dedup()

    Filters out consecutive equal values.
    */

    dedup: function() {
        var v;
        return this.filter(function(value) {
            var old = v;
            v = value;
            return old !== value;
        });
    },

    /**
    .filter(fn)

    Filter values according to the truthiness of `fn(value)`.
    */

    filter: function(fn) {
        var source = this;

        return create(this, function filter() {
            var value;
            while ((value = source.shift()) !== undefined && !fn(value));
            return value;
        });
    },

    /**
    .flat()
    Flattens a list of lists into a single list.
    */

    join: function() {
        console.trace('Fn.join() is now Fn.flat() to mirror name of new Array method');
        return this.flat();
    },

    flat: function() {
        var source = this;
        var buffer = nothing;

        return create(this, function flat() {
            var value = buffer.shift();
            if (value !== undefined) { return value; }
            // Support array buffers and stream buffers
            //if (buffer.length === 0 || buffer.status === 'done') {
                buffer = source.shift();
                if (buffer !== undefined) { return flat(); }
                buffer = nothing;
            //}
        });
    },

    /**
    .flatMap()
    Maps values to lists – `fn(value)` must return an array, stream
    or other type with a `.shift()` method – and flattens those lists into a
    single stream.
    */

    flatMap: function(fn) {
        return this.map(fn).flat();
    },

    chain: function(fn) {
        console.trace('Stream.chain() is now Stream.flatMap()');
        return this.map(fn).flat();
    },

    /**
    .latest()

    When the stream has a values buffered, passes the last value
    in the buffer.
    */

    latest: function() {
        var source = this;
        return create(this, function shiftLast() {
            return latest(source);
        });
    },

    /**
    .map(fn)
    Maps values to the result of `fn(value)`.
    */

    map: function(fn) {
        return create(this, compose(function map(object) {
            return object === undefined ? undefined : fn(object) ;
        }, this.shift));
    },

    ///**
    //.chunk(n)
    //Batches values into arrays of length `n`.
    //**/

    chunk: function(n) {
        return this
        .scan(scanChunks, {
            n: n,
            count: 0,
            accumulator: []
        })
        .map(function(accumulator) {
            return accumulator.value;
        });
    },

    partition: function(fn) {
        var source = this;
        var buffer = [];
        var streams = new Map();

        fn = fn || Fn.id;

        function createPart(key, value) {
            // Todo: Nope, no pull
            var stream = Stream.of().on('pull', shiftPull);
            stream.key = key;
            streams.set(key, stream);
            return stream;
        }

        function shiftPull(type, pullStream) {
            var value  = source.shift();
            if (value === undefined) { return; }

            var key    = fn(value);
            var stream = streams.get(key);

            if (stream === pullStream) { return value; }

            if (stream === undefined) {
                stream = createPart(key);
                buffer.push(stream);
            }

            stream.push(value);
            return shiftPull(type, pullStream);
        }

        return create(this, function shiftStream() {
            if (buffer.length) { return buffer.shift(); }

            var value = source.shift();
            if (value === undefined) { return; }

            var key    = fn(value);
            var stream = streams.get(key);

            if (stream === undefined) {
                stream = createPart(key);
                stream.push(value);
                return stream;
            }

            stream.push(value);
            return shiftStream();
        });
    },

    fold: function reduce(fn, seed) {
        return this.scan(fn, seed).latest().shift();
    },

    /**
    .scan(fn, seed)

    Calls `fn(accumulator, value)` and emits `accumulator` for each value
    in the stream.
    */

    scan: function scan(fn, accumulator) {
        return this.map(function scan(value) {
            var acc = fn(accumulator, value);
            accumulator = acc;
            return accumulator;
        });
    },

    /**
    .take(n)

    Filters the stream to the first `n` values.
    */

    take: function(n) {
        var source = this;
        var i = 0;

        return create(this, function take() {
            var value;

            if (i < n) {
                value = source.shift();
                // Only increment i where an actual value has been shifted
                if (value === undefined) { return; }
                if (++i === n) {
                    this.push = noop;
                    this.stop = noop;
                    this.status = 'done';
                }
                return value;
            }
        });
    },

    sort: function(fn) {
        fn = fn || Fn.byGreater ;

        var source = this;
        var buffer = [];

        return create(this, function sort() {
            var value;

            while((value = source.shift()) !== undefined) {
                sortedSplice(buffer, fn, value);
            }

            return buffer.shift();
        });
    },

    split: function(fn) {
        var source = this;
        var buffer = [];

        return create(this, function split() {
            var value = source.shift();
            var temp;

            if (value === undefined) {
                if (buffer.length) {
                    temp = buffer;
                    buffer = [];
                    return temp;
                }

                return;
            }

            if (fn(value)) {
                temp = buffer;
                buffer = [value];
                return temp.length ? temp : split() ;
            }

            buffer.push(value);
            return split();
        });
    },

    /**
    .rest(n)

    Filters the stream to all values after the `n`th value.
    */

    rest: function(i) {
        var source = this;

        return create(this, function rest() {
            while (i-- > 0) { source.shift(); }
            return source.shift();
        });
    },

    /**
    .unique()

    Filters the stream to remove any value already emitted.
    */

    unique: function() {
        var source = this;
        var values = [];

        return create(this, function unique() {
            var value = source.shift();

            return value === undefined ? undefined :
                values.indexOf(value) === -1 ? (values.push(value), value) :
                unique() ;
        });
    },

    // Consumers

    each: function(fn) {
        var value;

        while ((value = this.shift()) !== undefined) {
            fn.call(this, value);
        }

        return this;
    },

    find: function(fn) {
        return this
        .filter(fn)
        .first()
        .shift();
    },

    next: function() {
        return {
            value: this.shift(),
            done:  this.status
        };
    },

    /**
    .pipe(stream)

    Pipes the current stream into `stream`.
    */

    pipe: function(stream) {
        this.each(stream.push);
        return stream;
    },

    /**
    .tap(fn)

    Calls `fn(value)` for each value in the stream without modifying
    the stream. Note that values are only tapped when there is a
    consumer attached to the end of the stream to suck them through.
    */

    tap: function(fn) {
        // Overwrite shift to copy values to tap fn
        this.shift = shiftTap(this.shift, fn);
        return this;
    },

    toJSON: function() {
        const array = [];
        this.scan(arrayReducer, array).each(noop);
        return array;
    },

    toString: function() {
        return this.reduce(prepend$1, '');
    }
});

Fn.prototype.toArray = Fn.prototype.toJSON;

// Todo: As of Nov 2016 fantasy land spec requires namespaced methods:
//
// equals: 'fantasy-land/equals',
// lte: 'fantasy-land/lte',
// concat: 'fantasy-land/concat',
// empty: 'fantasy-land/empty',
// map: 'fantasy-land/map',
// contramap: 'fantasy-land/contramap',
// ap: 'fantasy-land/ap',
// of: 'fantasy-land/of',
// alt: 'fantasy-land/alt',
// zero: 'fantasy-land/zero',
// reduce: 'fantasy-land/reduce',
// traverse: 'fantasy-land/traverse',
// chain: 'fantasy-land/chain',
// chainRec: 'fantasy-land/chainRec',
// extend: 'fantasy-land/extend',
// extract: 'fantasy-land/extract',
// bimap: 'fantasy-land/bimap',
// promap: 'fantasy-land/promap'


if (Symbol) {
    // A functor is it's own iterator
    Fn.prototype[Symbol.iterator] = function() {
        return this;
    };
}

var DEBUG     = self.DEBUG !== false;
var assign$1    = Object.assign;


function isDone$1(stream) {
    return stream.status === 'done';
}

function notify(object) {
    var events = privates(object).events;
    if (!events) { return; }

    var n = -1;
    var l = events.length;
    var value;

    while (++n < l) {
        value = events[n](object);
        if (value !== undefined) { return value; }
    }
}

function done$1(stream, privates) {
    stream.status = 'done';
    privates.source = nothing;
    privates.resolve();
}

function createSource(stream, privates, Source, buffer) {
    buffer = buffer === undefined ? [] :
        buffer.shift ? buffer :
        Array.from(buffer) ;

    // Flag to tell us whether we are using an internal buffer - which
    // depends on the existence of source.shift
    var buffered = true;
    var initialised = false;

    function push() {
        // Detect that buffer exists and is not an arguments object, if so
        // we push to it
        buffered && buffer.push.apply(buffer, arguments);
        initialised && notify(stream);
    }

    function stop(n) {
        // If stop count is not given, use buffer length (if buffer exists and
        // is not arguments object) by default
        n = n !== undefined ? n :
            buffered ? buffer.length :
            0 ;

        // Neuter events
        delete privates.events;

        // If no n, shut the stream down
        if (!n) {
            privates.stops && privates.stops.forEach((fn) => fn());
            privates.stops = undefined;
            done$1(stream, privates);
        }

        // Schedule shutdown of stream after n values
        else {
            privates.source = new StopSource(stream, privates.source, privates, n, done$1);
            privates.stops && privates.stops.forEach((fn) => fn());
            privates.stops = undefined;
        }
    }

    const source = Source.prototype ?
        // Source is constructable
        new Source(push, stop) :
        // Source is an arrow function
        Source(push, stop) ;

    initialised = true;

    // Where source has .shift() override the internal buffer
    if (source.shift) {
        buffered = false;
        buffer = undefined;
    }

    // Otherwise give it a .shift() for the internal buffer
    else {
        source.shift = function () {
            return buffer.shift();
        };
    }

    // Gaurantee that source has a .stop() method
    if (!source.stop) {
        source.stop = noop;
    }

    return (privates.source = source);
}

function shiftBuffer(shift, state, one, two, buffer) {
    if (buffer.length && state.buffered === one) {
        return buffer.shift();
    }

    const value = shift();
    if (value === undefined) { return; }

    buffer.push(value);
    state.buffered = two;
    return value;
}

function flat(output, input) {
    input.pipe ?
        // Input is a stream
        input.pipe(output) :
        // Input is an array-like
        output.push.apply(output, input) ;

    return output;
}

// StartSource

function StartSource(stream, privates, Source, buffer) {
    this.stream   = stream;
    this.privates = privates;
    this.Source   = Source;
    this.buffer   = buffer;
}

assign$1(StartSource.prototype, {
    create: function() {
        return createSource(this.stream, this.privates, this.Source, this.buffer);
    },

    shift: function shift() {
        return this.create().shift();
    },

    push: function push() {
        const source = this.create();
        if (!source.push) { throw new Error('Attempt to .push() to unpushable stream'); }
        source.push.apply(source, arguments);
    },

    start: function start() {
        const source = this.create();
        if (!source.start) { throw new Error('Attempt to .start() unstartable stream'); }
        source.start.apply(source, arguments);
    },

    stop: function done() {
        const source = this.create();

        if (!source.stop) {
            done(this.stream, this.privates);
        }

        source.stop.apply(source, arguments);
    }
});


// StopSource

function StopSource(stream, source, privates, n, done) {
    this.stream   = stream;
    this.source   = source;
    this.privates = privates;
    this.n        = n;
    this.done     = done;
}

assign$1(StopSource.prototype, nothing, {
    shift: function() {
        const value = this.source.shift();
        if (--this.n < 1) { this.done(this.stream, this.privates); }
        return value;
    },

    start: function() {
        throw new Error('Cannot .start() stopped stream');
    },

    push: function() {
        throw new Error('Cannot .push() to stopped stream');
    }
});


/** Construct */

/**
Stream(fn)

Construct a new stream. `fn(push, stop)` is invoked when the stream is started,
and it must return a 'producer' – an object with methods to control the flow of
data:

```js
const stream = Stream(function(push, stop) {
    return {
        push:  fn,  // Optional. Makes the stream pushable.
        start: fn,  // Optional. Makes the stream extarnally startable.
        stop:  fn   // Optional. Makes the stream externally stoppable.
        shift: fn,  // Optional. Overrides the stream's internal buffer.
    };
});
```
*/

function Stream$1(Source, buffer) {
    if (DEBUG) {
        if (arguments.length > 2) {
            throw new Error('Stream(setup, buffer) takes 2 arguments. Recieved ' + arguments.length + '.');
        }
    }

    // Enable construction without the `new` keyword
    if (!Stream$1.prototype.isPrototypeOf(this)) {
        return new Stream$1(Source, buffer);
    }

    // Privates

    const privates$1 = privates(this);
    privates$1.stream  = this;
    privates$1.events  = [];
    privates$1.resolve = noop;
    privates$1.source  = new StartSource(this, privates$1, Source, buffer);

    // Methods

    this.shift = function shift() {
        return privates$1.source.shift();
    };

    // Keep it as an instance method for just now
    this.push = function push() {
        const source = privates$1.source;
        source.push.apply(source, arguments);
        return this;
    };
}

Stream$1.prototype = assign$1(Object.create(Fn.prototype), {
    constructor: Stream$1,

    /** Write */

    /**
    .push(value)
    Pushes a `value` (or multiple values) into the head of a writeable stream.
    If the stream is not writeable, it does not have a `.push()` method.
    */

    /** Map */

    //.chunk(n)
    //Batches values into arrays of length `n`.

    /**
    .flat()
    Flattens a stream of streams or arrays into a single stream.
    */

    flat: function() {
        const output = this.constructor.of();

        this
        .scan(flat, output)
        .each(noop);

        return output;
    },

    /**
    .flatMap(fn)
    Maps values to lists – `fn(value)` must return an array, functor, stream
    (or any other duck with a `.shift()` method) and flattens those lists into a
    single stream.
    */

    /**
    .map(fn)
    Maps values to the result of `fn(value)`.
    */

    /**
    .merge(stream)
    Merges this stream with `stream`, which may be an array, array-like
    or functor.
    */

    merge: function merge() {
        var sources = toArray(arguments);
        sources.unshift(this);
        return Stream$1.Merge.apply(null, sources);
    },

    /**
    .scan(fn, seed)
    Calls `fn(accumulator, value)` and emits `accumulator` for each value
    in the stream.
    */


    /** Filter */

    /**
    .dedup()
    Filters out consecutive equal values.
    */

    /**
    .filter(fn)
    Filter values according to the truthiness of `fn(value)`.
    */

    /**
    .latest()
    When the stream has a values buffered, passes the last value
    in the buffer.
    */

    /**
    .rest(n)
    Filters the stream to the `n`th value and above.
    */

    /**
    .take(n)
    Filters the stream to the first `n` values.
    */

    //.clock(timer)
    //Emits values at the framerate of `timer`, one-per-frame. No values
    //are discarded.
    //
    //clock: function clock(timer) {
    //    return this.pipe(Stream.clock(timer));
    //},

    /**
    .combine(fn, stream)
    Combines the latest values from this stream and `stream` via the combinator
    `fn` any time a new value is emitted by either stream.
    */

    combine: function(fn, stream) {
        const streams = Array.from(arguments);
        streams[0] = this;
        return CombineStream(fn, streams);
    },


    /** Read */

    /**
    .clone()
    Creates a read-only copy of the stream.
    */

    clone: function clone() {
        const source = this;
        const shift  = this.shift.bind(this);
        const buffer = [];

        const state = {
            // Flag telling us which stream has been buffered,
            // source (1) or copy (2)
            buffered: 1
        };

        this.shift = function() {
            return shiftBuffer(shift, state, 1, 2, buffer);
        };

        return new Stream$1(function(notify, stop) {
            source.on(notify);
            source.done(stop);

            return {
                shift: function() {
                    return shiftBuffer(shift, state, 2, 1, buffer);
                },

                stop: function() {
                    stop(0);
                }
            }
        });
    },

    /**
    .each(fn)
    Thirstilly consumes the stream, calling `fn(value)` whenever
    a value is available.
    */

    each: function each(fn) {
        var args   = arguments;
        var source = this;

        // Flush and observe
        Fn.prototype.each.apply(source, args);

        // Delegate to Fn#each().
        return this.on(() => Fn.prototype.each.apply(source, args));
    },

    /**
    .last(fn)
    Consumes the stream when stopped, calling `fn(value)` with the
    last value read from the stream.
    */

    last: function last(fn) {
        const privates$1 = privates(this);
        privates$1.stops = privates$1.stops || [];
        const value = this.latest().shift();
        value !== undefined && privates$1.stops.push(() => fn(value));
        return this;
    },

    /**
    .fold(fn, accumulator)
    Consumes the stream when stopped, calling `fn(accumulator, value)`
    for each value in the stream. Returns a promise.
    */

    fold: function fold(fn, accumulator) {
        // Fold to promise
        return new Promise((resolve, reject) => {
            this
            .scan(fn, accumulator)
            .last(resolve);
        });
    },

    //.reduce(fn, accumulator)
    //Consumes the stream when stopped, calling `fn(accumulator, value)`
    //for each value in the stream. Returns a promise that resolves to
    //the last value returned by `fn(accumulator, value)`.

    reduce: function reduce(fn, accumulator) {
        // Support array.reduce semantics with optional seed
        return accumulator ?
            this.fold(fn, accumulator) :
            this.fold((acc, value) => (acc === undefined ? value : fn(acc, value)), this.shift()) ;
    },

    /**
    .shift()
    Reads a value from the stream. If no values are in the stream, returns
    `undefined`. If this is the last value in the stream, `stream.status`
    is `'done'`.
    */

    /** Lifecycle */

    /**
    .done(fn)
    Calls `fn()` after the stream is stopped and all values have been drained.
    */

    done: function done(fn) {
        const privates$1 = privates(this);
        const promise = privates$1.promise || (
            privates$1.promise = this.status === 'done' ?
                Promise.resolve() :
                new Promise((resolve, reject) => assign$1(privates$1, { resolve, reject }))
        );

        promise.then(fn);
        return this;
    },

    /**
    .start()
    If the stream's producer is startable, starts the stream.
    */

    start: function start() {
        const source = privates(this).source;
        source.start.apply(source, arguments);
        return this;
    },

    /**
    .stop()
    Stops the stream. No more values can be pushed to the stream and any
    consumers added will do nothing. However, depending on the stream's source
    the stream may yet drain any buffered values into an existing consumer
    before entering `'done'` state. Once in `'done'` state a stream is
    entirely inert.
    */

    stop: function stop() {
        const source = privates(this).source;
        source.stop.apply(source, arguments);
        return this;
    },

    on: function on(fn) {
        if (DEBUG && typeof fn === 'string') {
            throw new Error('stream.on(fn) no longer takes type');
        }

        var events = privates(this).events;
        if (!events) { return this; }

        events.push(fn);
        return this;
    },

    off: function off(fn) {
        if (DEBUG && typeof fn === 'string') {
            throw new Error('stream.off(fn) no longer takes type');
        }

        var events = privates(this).events;
        if (!events) { return this; }

        // Remove all handlers
        if (!fn) {
            events.length = 0;
            return this;
        }

        // Remove handler fn for type
        var n = events.length;
        while (n--) {
            if (events[n] === fn) { events.splice(n, 1); }
        }

        return this;
    },

    toPush: function() {
        const stream = this;
        const privates$1 = privates(this);
        return privates$1.input || (privates$1.input = function() {
            stream.push.apply(stream, arguments);
        });
    }
});


/**
Stream.from(values)
Returns a writeable stream that consumes the array or array-like `values` as
its buffer.
*/

function Pushable(push, stop) {
    this.push = push;
    this.stop = stop;
}

Stream$1.from = function(values) {
    return new Stream$1(Pushable, values);
};


/**
Stream.fromPromise(promise)
Returns a stream that uses the given promise as its source. When the promise
resolves the stream is given its value and stopped. If the promise errors
the stream is stopped without value. This stream is not pushable, but may
be stopped before the promise resolves.
*/

Stream$1.fromPromise = function(promise) {
    return new Stream$1(function(push, stop) {
        promise.then(push);
        promise.finally(stop);
        return { stop };
    });
};


/**
Stream.of(...values)
Returns a stream that consumes arguments as a buffer. The stream is pushable.
*/

Stream$1.of = function() {
    return Stream$1.from(arguments);
};


// CombineStream

function CombineProducer(push, stop, fn, streams) {
    const values = {
        length: streams.length,
        count: 0,
        doneCount: 0
    };

    function done() {
        ++values.doneCount;

        // Are all the source streams finished?
        if (values.doneCount === values.length) {
            // Stop the stream
            stop();
        }
    }

    streams.forEach(function(stream, i) {
        stream
        .map(function(value) {
            // Is this the first value to come through the source stream?
            if (values[i] === undefined) {
                ++values.count;
            }

            values[i] = value;

            // Are all the source streams active?
            if (values.count === values.length) {
                // Push the combined output into the stream's buffer
                return fn.apply(null, values);
            }
        })
        .each(push)
        .done(done);
    });

    return { stop };
}

function CombineStream(fn, streams) {
    if (DEBUG && streams.length < 2) {
        throw new Error('CombineStream(fn, streams) requires more than 1 stream')
    }

    return new Stream$1((push, stop) => CombineProducer(push, stop, fn, streams));
}


// Stream.Merge

function MergeSource(notify, stop, sources) {
    var values = [];

    function update(source) {
        values.push.apply(values, toArray(source));
    }

    this.values  = values;
    this.notify  = notify;
    this.sources = sources;
    this.update  = update;
    this.cueStop = stop;

    each(function(source) {
        // Flush the source
        update(source);

        // Listen for incoming values
        source.on(update);
        source.on(notify);
    }, sources);
}

assign$1(MergeSource.prototype, {
    shift: function() {
        if (this.sources.every(isDone$1)) {
            this.stop();
        }

        return this.values.shift();
    },

    stop: function() {
        this.cueStop(this.values.length);
    }
});

Stream$1.Merge = function(source1, source2) {
    const sources = Array.from(arguments);
    return new Stream$1(function(push, stop) {
        return new MergeSource(push, stop, sources);
    });
};

/**
remove(array, value)
Remove `value` from `array`. Where `value` is not in `array`, does nothing.
**/

function remove(array, value) {
    if (array.remove) { array.remove(value); }

    let i;
    while ((i = array.indexOf(value)) !== -1) {
        array.splice(i, 1);
    }

    return value;
}

const nothing$1      = Object.freeze([]);

{ window.observeCount = 0; }
const nothing$2 = Object.freeze([]);

/**
append(str2, str1)
Returns `str1 + str2`.
**/

function append(string2, string1) {
    return '' + string1 + string2;
}

curry(append);

/**
prepad(chars, n, string)
Pads `string` to `n` characters by prepending `chars`.
**/

function prepad(chars, n, value) {
    var string = value + '';
    var i = -1;
    var pre = '';

    while (pre.length < n - string.length) {
        pre += chars[++i % chars.length];
    }

    string = pre + string;
    return string.slice(string.length - n);
}

curry(prepad);

/**
postpad(chars, n, string)
Pads `string` to `n` characters by appending `chars`.
**/

function postpad(chars, n, value) {
    var string = value + '';

    while (string.length < n) {
        string = string + chars;
    }

    return string.slice(0, n);
}

curry(postpad);

/**
toCamelCase(string)
Capitalises any Letter following a `'-'` and removes the dash.
**/

function toCamelCase(string) {
    // Be gracious in what we accept as input
    return string.replace(/-(\w)?/g, function($0, letter) {
        return letter ? letter.toUpperCase() : '';
    });
}

function requestTime(s, fn) {
    return setTimeout(fn, s * 1000);
}

function deep(a, b) {
    // Fast out if references are for the same object
    if (a === b) { return a; }

    // If b is null, or not an object, get out of here
    if (b === null || typeof b !== 'object') {
        return a;
    }

    // Get enumerable keys of b
    const bkeys = Object.keys(b);
    let n = bkeys.length;

    while (n--) {
        const key = bkeys[n];
        const value = b[key];

        a[key] = typeof value === 'object' && value !== null ?
            deep(a[key] || {}, value) :
            value ;
    }

    return a;
}

curry(deep, true);

function ap(data, fns) {
	let n = -1;
	let fn;
	while (fn = fns[++n]) {
		fn(data);
	}
}

/**
insert(fn, array, object)
Inserts `object` into `array` at the first index where the result of
`fn(object)` is greater than `fn(array[index])`.
**/

const A$3 = Array.prototype;

function insert(fn, array, object) {
    var n = -1;
    var l = array.length;
    var value = fn(object);
    while(++n < l && fn(array[n]) <= value);
    A$3.splice.call(array, n, 0, object);
    return object;
}

/**
take(n, array)
**/

function take(i, object) {
    if (object.slice) { return object.slice(0, i); }
    if (object.take)  { return object.take(i); }

    var a = [];
    var n = i;
    while (n--) { a[n] = object[n]; }
    return a;
}

/**
update(create, destroy, fn, target, source)

Returns a new array containing items that are either matched objects from
`target` assigned new data from `source` objects or, where no match is found,
new objects created by calling `create` on a `source` object. Any objects
in `target` that are not matched to `source` objects are destroyed by calling
`destroy` on them.
**/

const assign$2 = Object.assign;

function update(create, destroy, fn, target, source) {
    const ids     = target.map(fn);
    const indexes = {};
    const output  = source.map(function(data) {
        const id = fn(data);
        const i  = ids.indexOf(id);

        if (i < 0) {
            return create.prototype ?
                new create(data) :
                create(data);
        }

        // Has it already been processed? Oops.
        if (indexes[i]) {
            throw new Error('Failed to update target array, source data contains duplicates');
        }

        indexes[i] = true;
        return assign$2(target[i], data);
    });

    target.forEach(function(object) {
        if (!output.includes(object)) {
            destroy(object);
        }
    });

    return output;
}

/**
diff(array1, array2)
**/

function diff(array, object) {
    var values = toArray(array);

    return filter(function(value) {
        var i = values.indexOf(value);
        if (i === -1) { return true; }
        values.splice(i, 1);
        return false;
    }, object)
    .concat(values);
}

function intersect(array, object) {
    var values = toArray(array);

    return filter(function(value) {
        var i = values.indexOf(value);
        if (i === -1) { return false; }
        values.splice(i, 1);
        return true;
    }, object);
}

function unite(array, object) {
    var values = toArray(array);

    return map(function(value) {
        var i = values.indexOf(value);
        if (i > -1) { values.splice(i, 1); }
        return value;
    }, object)
    .concat(values);
}

/**
last(array)
Gets the last value from an array.
**/

function last(array) {
    if (typeof array.length === 'number') {
        return array[array.length - 1];
    }

    // Todo: handle Fns and Streams
}

/**
by(fn, a, b)
Compares `fn(a)` against `fn(b)` and returns `-1`, `0` or `1`. Useful for sorting
objects by property:

```
[{id: '2'}, {id: '1'}].sort(by(get('id')));  // [{id: '1'}, {id: '2'}]
```
**/

function by(fn, a, b) {
    const fna = fn(a);
    const fnb = fn(b);
    return fnb === fna ? 0 : fna > fnb ? 1 : -1 ;
}

var by$1 = curry(by, true);

function sum(a, b) { return b + a; }
function multiply(a, b) { return b * a; }
function pow(n, x) { return Math.pow(x, n); }
function exp(n, x) { return Math.pow(n, x); }
function log(n, x) { return Math.log(x) / Math.log(n); }
function root(n, x) { return Math.pow(x, 1/n); }

const curriedSum   = curry(sum);
const curriedMultiply = curry(multiply);
const curriedMin   = curry(Math.min, false, 2);
const curriedMax   = curry(Math.max, false, 2);
const curriedPow   = curry(pow);
const curriedExp   = curry(exp);
const curriedLog   = curry(log);
const curriedRoot  = curry(root);

/**
gcd(a, b)

Returns the greatest common divider of a and b.
**/

function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
}

const curriedGcd = curry(gcd);

/**
lcm(a, b)

Returns the lowest common multiple of a and b.
**/

function lcm(a, b) {
    return a * b / gcd(a, b);
}

const curriedLcm = curry(lcm);

/**
mod(divisor, n)

JavaScript's modulu operator (`%`) uses Euclidean division, but for
stuff that cycles through 0 the symmetrics of floored division are often
are more useful. This function implements floored division.
**/

function mod(d, n) {
    var value = n % d;
    return value < 0 ? value + d : value;
}

curry(mod);

/**
wrap(min, max, n)
**/

function wrap(min, max, n) {
    return min + mod(max - min, n - min);
}

var wrap$1 = curry(wrap);

function clamp(min, max, n) {
    return n > max ? max : n < min ? min : n;
}

var clamp$1 = curry(clamp);

/**
toPolar(cartesian)
**/

function toPolar(cartesian) {
    var x = cartesian[0];
    var y = cartesian[1];

    return [
        // Distance
        x === 0 ?
            Math.abs(y) :
        y === 0 ?
            Math.abs(x) :
            Math.sqrt(x*x + y*y) ,
        // Angle
        Math.atan2(x, y)
    ];
}

// Cubic bezier function (originally translated from

function sampleCubicBezier(a, b, c, t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((a * t + b) * t + c) * t;
}

function sampleCubicBezierDerivative(a, b, c, t) {
    return (3 * a * t + 2 * b) * t + c;
}

function solveCubicBezierX(a, b, c, x, epsilon) {
    // Solve x for a cubic bezier
    var x2, d2, i;
    var t2 = x;

    // First try a few iterations of Newton's method -- normally very fast.
    for(i = 0; i < 8; i++) {
        x2 = sampleCubicBezier(a, b, c, t2) - x;
        if (Math.abs(x2) < epsilon) {
            return t2;
        }
        d2 = sampleCubicBezierDerivative(a, b, c, t2);
        if (Math.abs(d2) < 1e-6) {
            break;
        }
        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    var t0 = 0;
    var t1 = 1;

    t2 = x;

    if(t2 < t0) { return t0; }
    if(t2 > t1) { return t1; }

    while(t0 < t1) {
        x2 = sampleCubicBezier(a, b, c, t2);
        if(Math.abs(x2 - x) < epsilon) {
            return t2;
        }
        if (x > x2) { t0 = t2; }
        else { t1 = t2; }
        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
}

function cubicBezier(p1, p2, duration, x) {
    // The epsilon value to pass given that the animation is going
    // to run over duruation seconds. The longer the animation, the
    // more precision is needed in the timing function result to
    // avoid ugly discontinuities.
    var epsilon = 1 / (200 * duration);

    // Calculate the polynomial coefficients. Implicit first and last
    // control points are (0,0) and (1,1).
    var cx = 3 * p1[0];
    var bx = 3 * (p2[0] - p1[0]) - cx;
    var ax = 1 - cx - bx;
    var cy = 3 * p1[1];
    var by = 3 * (p2[1] - p1[1]) - cy;
    var ay = 1 - cy - by;

    var y = solveCubicBezierX(ax, bx, cx, x, epsilon);
    return sampleCubicBezier(ay, by, cy, y);
}

var bezierify = curry(cubicBezier, true, 4);

const DEBUG$1 = window.DEBUG === undefined || window.DEBUG;

const defs = {
    // Primitive types

    'boolean': (value) =>
        typeof value === 'boolean',

    'function': (value) =>
        typeof value === 'function',

    'number': (value) =>
        typeof value === 'number',

    'object': (value) =>
        typeof value === 'object',

    'symbol': (value) =>
        typeof value === 'symbol',

    // Functional types
    // Some of these are 'borrowed' from SancturyJS
    // https://github.com/sanctuary-js/sanctuary-def/tree/v0.19.0

    'Any': noop,

    'Array': (value) =>
        Array.isArray(value),

    'ArrayLike': (value) =>
        typeof value.length === 'number',

    'Boolean': (value) =>
        typeof value === 'boolean',

    'Date': (value) =>
        value instanceof Date
        && !Number.isNaN(value.getTime()),

    'Error': (value) =>
        value instanceof Error,

    'Integer': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value,

    'NegativeInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value < 0,

    'NonPositiveInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value <= 0,

    'PositiveInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value > 0,

    'NonNegativeInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value >= 0,

    'Number': (value) =>
        typeof value === 'number'
        && !Number.isNaN(value),

    'NegativeNumber': (value) =>
        typeof value === 'number'
        && value < 0,

    'NonPositiveNumber': (value) =>
        typeof value === 'number'
        && value <= 0,

    'PositiveNumber': (value) =>
        typeof value === 'number'
        && value > 0,

    'NonNegativeNumber': (value) =>
        typeof value === 'number'
        && value >= 0,

    'Null': (value) =>
        value === null,

    'Object': (value) =>
        !!value
        && typeof value === 'object',

    'RegExp': (value) =>
        value instanceof RegExp
};

const checkType = DEBUG$1 ? function checkType(type, value, file, line, message) {
    if (!defs[type]) {
        throw new RangeError('Type "' + type + '" not recognised');
    }

    if (!defs[type](value)) {
        throw new Error(message || 'value not of type "' + type + '": ' + value, file, line);
    }
} : noop ;

const checkTypes = DEBUG$1 ? function checkTypes(types, args, file, line) {
    var n = types.length;

    while (n--) {
        checkType(types[n], args[n], file, line, 'argument ' + n + ' not of type "' + types[n] + '": ' + args[n]);
    }
} : noop ;

function def(notation, fn, file, line) {
    // notation is of the form:
    // 'Type, Type -> Type'
    // Be generous with what we accept as output marker '->' or '=>'
    var parts = notation.split(/\s*[=-]>\s*/);
    var types = parts[0].split(/\s*,\s*/);
    var returnType = parts[1];

    return DEBUG$1 ? function() {
        checkTypes(types, arguments, file, line);
        const output = fn.apply(this, arguments);
        checkType(returnType, output, file, line, 'return value not of type "' + returnType + '": ' + output);
        return output;
    } : fn ;
}

// Normalisers take a min and max and transform a value in that range
// to a value on the normal curve of a given type

const linear = def(
    'Number, Number, Number => Number',
    (min, max, value) => (value - min) / (max - min)
);

const quadratic = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow((value - min) / (max - min), 1/2)
);

const cubic = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow((value - min) / (max - min), 1/3)
);

const logarithmic = def(
    'PositiveNumber, PositiveNumber, NonNegativeNumber => Number',
    (min, max, value) => Math.log(value / min) / Math.log(max / min)
);

const linearLogarithmic = def(
    'PositiveNumber, PositiveNumber, NonNegativeNumber => Number',
    (min, max, value) => {
        // The bottom 1/9th of the range is linear from 0 to min, while
        // the top 8/9ths is dB linear from min to max.
        return value <= min ?
            (value / min) / 9 :
            (0.1111111111111111 + (Math.log(value / min) / Math.log(max / min)) / 1.125) ;
    }
);

// cubicBezier
// `begin` and `end` are objects of the form
// { point:  [x, y], handle: [x, y] }

const cubicBezier$1 = def(
    'Object, Object, Number => Number',
    (begin, end, value) => bezierify({
        0: linear(begin.point[0], end.point[0], begin.handle[0]),
        1: linear(begin.point[0], end.point[0], begin.handle[0])
    }, {
        0: linear(begin.point[0], end.point[0], end.handle[0]),
        1: linear(begin.point[0], end.point[0], end.handle[0])
    }, 1, linear(begin.point[0], end.point[0], value))
);

var normalisers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    linear: linear,
    quadratic: quadratic,
    cubic: cubic,
    logarithmic: logarithmic,
    linearLogarithmic: linearLogarithmic,
    cubicBezier: cubicBezier$1
});

// Denormalisers take a min and max and transform a value into that range
// from the range of a curve of a given type

const linear$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => value * (max - min) + min
);

const quadratic$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow(value, 2) * (max - min) + min
);

const cubic$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow(value, 3) * (max - min) + min
);

const logarithmic$1 = def(
    'PositiveNumber, PositiveNumber, Number => Number',
    (min, max, value) => min * Math.pow(max / min, value)
);

const linearLogarithmic$1 = def(
    'PositiveNumber, PositiveNumber, Number => Number',
    (min, max, value) => {
        // The bottom 1/9th of the range is linear from 0 to min, while
        // the top 8/9ths is dB linear from min to max.
        return value <= 0.1111111111111111 ?
            value * 9 * min :
            min * Math.pow(max / min, (value - 0.1111111111111111) * 1.125);
    }
);

// cubicBezier
// `begin` and `end` are objects of the form
// { point:  [x, y], handle: [x, y] }

const cubicBezier$2 = def(
    'Object, Object, Number => Number',
    (begin, end, value) => linear$1(begin.point[1], end.point[1], bezierify({
        0: linear(begin.point[0], end.point[0], begin.handle[0]),
        1: linear(begin.point[1], end.point[1], begin.handle[1])
    }, {
        0: linear(begin.point[0], end.point[0], end.handle[0]),
        1: linear(begin.point[1], end.point[1], end.handle[1])
    }, 1, value))
);



/* Todo: does it do as we intend?? */
// Todo: implement tanh with min max scaling or gradient and crossover 
// centering or one or two of these others
// https://en.wikipedia.org/wiki/Sigmoid_function#/media/File:Gjl-t(x).svg
const tanh = def(
    'Number, Number, Number => Number',
    (min, max, value) => (Math.tanh(value) / 2 + 0.5) * (max - min) + min
);

var denormalisers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    linear: linear$1,
    quadratic: quadratic$1,
    cubic: cubic$1,
    logarithmic: logarithmic$1,
    linearLogarithmic: linearLogarithmic$1,
    cubicBezier: cubicBezier$2,
    tanh: tanh
});

// Exponential functions

function exponentialOut(e, x) {
    return 1 - Math.pow(1 - x, e);
}
var expOut = curry(exponentialOut);

// Time

// Decimal places to round to when comparing times
const precision = 9;

// Find template tokens for replacement
var rtoken = /([YZMDdhmswz]{2,4}|D|\+-)/g;
function minutesToSeconds(n) { return n * 60; }
function hoursToSeconds(n) { return n * 3600; }

function secondsToMilliseconds(n) { return n * 1000; }
function secondsToMinutes(n) { return n / 60; }
function secondsToHours(n) { return n / 3600; }
function secondsToDays(n) { return n / 86400; }
function secondsToWeeks(n) { return n / 604800; }

// Months and years are not fixed durations – these are approximate
function secondsToMonths(n) { return n / 2629800; }
function secondsToYears(n) { return n / 31557600; }


function prefix(n) {
	return n >= 10 ? '' : '0';
}

// Hours:   00-23 - 24 should be allowed according to spec
// Minutes: 00-59 -
// Seconds: 00-60 - 60 is allowed, denoting a leap second

//                sign   hh       mm           ss
var rtime     = /^([+-])?(\d{2,}):([0-5]\d)(?::((?:[0-5]\d|60)(?:.\d+)?))?$/;
var rtimediff = /^([+-])?(\d{2,}):(\d{2,})(?::(\d{2,}(?:.\d+)?))?$/;

/**
parseTime(time)

Where `time` is a string it is parsed as a time in ISO time format: as
hours `'13'`, with minutes `'13:25'`, with seconds `'13:25:14'` or with
decimal seconds `'13:25:14.001'`. Returns a number in seconds.

```
const time = parseTime('13:25:14.001');   // 48314.001
```

Where `time` is a number it is assumed to represent a time in seconds
and is returned directly.

```
const time = parseTime(60);               // 60
```
**/

const parseTime = overload(toType, {
	number:  id,
	string:  exec$1(rtime, createTime),
	default: function(object) {
		throw new Error('parseTime() does not accept objects of type ' + (typeof object));
	}
});

const parseTimeDiff = overload(toType, {
	number:  id,
	string:  exec$1(rtimediff, createTime),
	default: function(object) {
		throw new Error('parseTime() does not accept objects of type ' + (typeof object));
	}
});


function createTime(match, sign, hh, mm, sss) {
	var time = hoursToSeconds(parseInt(hh, 10))
        + (mm ? minutesToSeconds(parseInt(mm, 10))
            + (sss ? parseFloat(sss, 10) : 0)
        : 0) ;

	return sign === '-' ? -time : time ;
}

function formatTimeString(string, time) {
	return string.replace(rtoken, function($0) {
		return timeFormatters[$0] ? timeFormatters[$0](time) : $0 ;
	}) ;
}

function _formatTimeISO(time) {
	var sign = time < 0 ? '-' : '' ;

	if (time < 0) { time = -time; }

	var hours = Math.floor(time / 3600);
	var hh = prefix(hours) + hours ;
	time = time % 3600;
	if (time === 0) { return sign + hh + ':00'; }

	var minutes = Math.floor(time / 60);
	var mm = prefix(minutes) + minutes ;
	time = time % 60;
	if (time === 0) { return sign + hh + ':' + mm; }

	var sss = prefix(time) + toMaxDecimals(precision, time);
	return sign + hh + ':' + mm + ':' + sss;
}

function toMaxDecimals(precision, n) {
	// Make some effort to keep rounding errors under control by fixing
	// decimals and lopping off trailing zeros
	return n.toFixed(precision).replace(/\.?0+$/, '');
}

/**
formatTime(format, time)
Formats `time`, an 'hh:mm:ss' time string or a number in seconds, to match
`format`, a string that may contain the tokens:

- `'±'`   Sign, renders '-' if time is negative, otherwise nothing
- `'Y'`   Years, approx.
- `'M'`   Months, approx.
- `'MM'`  Months, remainder from years (max 12), approx.
- `'w'`   Weeks
- `'ww'`  Weeks, remainder from months (max 4)
- `'d'`   Days
- `'dd'`  Days, remainder from weeks (max 7)
- `'h'`   Hours
- `'hh'`  Hours, remainder from days (max 24), 2-digit format
- `'m'`   Minutes
- `'mm'`  Minutes, remainder from hours (max 60), 2-digit format
- `'s'`   Seconds
- `'ss'`  Seconds, remainder from minutes (max 60), 2-digit format
- `'sss'` Seconds, remainder from minutes (max 60), fractional
- `'ms'`  Milliseconds, remainder from seconds (max 1000), 3-digit format

```
const time = formatTime('±hh:mm:ss', 3600);   // 01:00:00
```
**/

var timeFormatters = {
	'±': function sign(time) {
		return time < 0 ? '-' : '';
	},

	Y: function Y(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToYears(time));
	},

	M: function M(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToMonths(time));
	},

	MM: function MM(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToMonths(time % 31557600));
	},

	W: function W(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToWeeks(time));
	},

	WW: function WW(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToDays(time % 2629800));
	},

	d: function dd(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToDays(time));
	},

	dd: function dd(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToDays(time % 604800));
	},

	h: function hhh(time) {
		time = time < 0 ? -time : time;
		return Math.floor(secondsToHours(time));
	},

	hh: function hh(time) {
		time = time < 0 ? -time : time;
		var hours = Math.floor(secondsToHours(time % 86400));
		return prefix(hours) + hours;
	},

	m: function mm(time) {
		time = time < 0 ? -time : time;
		var minutes = Math.floor(secondsToMinutes(time));
		return prefix(minutes) + minutes;
	},

	mm: function mm(time) {
		time = time < 0 ? -time : time;
		var minutes = Math.floor(secondsToMinutes(time % 3600));
		return prefix(minutes) + minutes;
	},

	s: function s(time) {
		time = time < 0 ? -time : time;
		return Math.floor(time);
	},

	ss: function ss(time) {
		time = time < 0 ? -time : time;
		var seconds = Math.floor(time % 60);
		return prefix(seconds) + seconds;
	},

	sss: function sss(time) {
		time = time < 0 ? -time : time;
		var seconds = time % 60;
		return prefix(seconds) + toMaxDecimals(precision, seconds);
	},

	ms: function ms(time) {
		time = time < 0 ? -time : time;
		var ms = Math.floor(secondsToMilliseconds(time % 1));
		return ms >= 100 ? ms :
			ms >= 10 ? '0' + ms :
				'00' + ms;
	}
};

const formatTime = curry(function(string, time) {
	return string === 'ISO' ?
		_formatTimeISO(parseTime(time)) :
		formatTimeString(string, parseTime(time)) ;
});

/**
addTime(time1, time2)

Sums `time2` and `time1`, which may be 'hh:mm:sss' time strings or numbers in
seconds, and returns time as a number in seconds. `time1` may contain hours
outside the range 0-24 or minutes or seconds outside the range 0-60. For
example, to add 75 minutes to a list of times you may write:

```
const laters = times.map(addTime('00:75'));
```
*/

const addTime = curry(function(time1, time2) {
	return parseTime(time2) + parseTimeDiff(time1);
});

const subTime = curry(function(time1, time2) {
	return parseTime(time2) - parseTimeDiff(time1);
});

const diffTime = curry(function(time1, time2) {
	return parseTime(time1) - parseTime(time2);
});

/**
floorTime(token, time)

Floors time to the start of the nearest `token`, where `token` is one of:

- `'w'`   Week
- `'d'`   Day
- `'h'`   Hour
- `'m'`   Minute
- `'s'`   Second
- `'ms'`  Millisecond

`time` may be an ISO time string or a time in seconds. Returns a time in seconds.

```
const hourCounts = times.map(floorTime('h'));
```
**/

var _floorTime = choose({
	w:  function(time) { return time - mod(604800, time); },
	d:  function(time) { return time - mod(86400, time); },
	h:  function(time) { return time - mod(3600, time); },
	m:  function(time) { return time - mod(60, time); },
	s:  function(time) { return time - mod(1, time); },
	ms: function(time) { return time - mod(0.001, time); }
});

const floorTime = curry(function(token, time) {
	return _floorTime(token, parseTime(time));
});

function createOrdinals(ordinals) {
	var array = [], n = 0;

	while (n++ < 31) {
		array[n] = ordinals[n] || ordinals.n;
	}

	return array;
}

var langs = {
	'en': {
		days:     ('Sunday Monday Tuesday Wednesday Thursday Friday Saturday').split(' '),
		months:   ('January February March April May June July August September October November December').split(' '),
		ordinals: createOrdinals({ n: 'th', 1: 'st', 2: 'nd', 3: 'rd', 21: 'st', 22: 'nd', 23: 'rd', 31: 'st' })
	},

	'fr': {
		days:     ('dimanche lundi mardi mercredi jeudi vendredi samedi').split(' '),
		months:   ('janvier février mars avril mai juin juillet août septembre octobre novembre décembre').split(' '),
		ordinals: createOrdinals({ n: "ième", 1: "er" })
	},

	'de': {
		days:     ('Sonntag Montag Dienstag Mittwoch Donnerstag Freitag Samstag').split(' '),
		months:   ('Januar Februar März April Mai Juni Juli Oktober September Oktober November Dezember').split(' '),
		ordinals: createOrdinals({ n: "er" })
	},

	'it': {
		days:     ('domenica lunedì martedì mercoledì giovedì venerdì sabato').split(' '),
		months:   ('gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre').split(' '),
		ordinals: createOrdinals({ n: "o" })
	}
};


// Date string parsing
//
// Don't parse date strings with the JS Date object. It has variable
// time zone behaviour. Set up our own parsing.
//
// Accept BC dates by including leading '-'.
// (Year 0000 is 1BC, -0001 is 2BC.)
// Limit months to 01-12
// Limit dates to 01-31

var rdate     = /^(-?\d{4})(?:-(0[1-9]|1[012])(?:-(0[1-9]|[12]\d|3[01])(?:T([01]\d|2[0-3])(?::([0-5]\d)(?::([0-5]\d)(?:.(\d+))?)?)?)?)?)?([+-]([01]\d|2[0-3]):?([0-5]\d)?|Z)?$/;
//                sign   year        month       day               T or -
var rdatediff = /^([+-])?(\d{2,})(?:-(\d{2,})(?:-(\d{2,}))?)?(?:([T-])|$)/;

/**
parseDate(date)

Parse a date, where, `date` may be:

- a string in ISO date format
- a number in seconds UNIX time
- a date object

Returns a date object (or *the* date object, if it represents a valid date).
**/

const parseDate = overload(toType, {
	number:  secondsToDate,
	string:  exec$1(rdate, createDate),
	object:  function(date) {
		return isValidDate(date) ? date : undefined ;
	},
	default: function(date) {
        throw new TypeError('parseDate(date) date is not of a supported type (' + (typeof date) + ')');
    }
});

/**
parseDateLocal(date)

As `parseDate(date)`, but returns a date object with local time set to the
result of the parse.
**/

const parseDateLocal = overload(toType, {
	number:  secondsToDate,
	string:  exec$1(rdate, createDateLocal),
	object:  function(date) {
		return isValidDate(date) ? date : undefined ;
	},
	default: function(date) {
        throw new TypeError('parseDateLocal: date is not of a supported type (number, string, Date)');
    }
});

function isValidDate(date) {
	return toClass(date) === "Date" && !Number.isNaN(date.getTime()) ;
}

function createDate(match, year, month, day, hour, minute, second, ms, zone, zoneHour, zoneMinute) {
	// Month must be 0-indexed for the Date constructor
	month = parseInt(month, 10) - 1;

	var date = new Date(
		ms ?     Date.UTC(year, month, day, hour, minute, second, ms) :
		second ? Date.UTC(year, month, day, hour, minute, second) :
		minute ? Date.UTC(year, month, day, hour, minute) :
		hour ?   Date.UTC(year, month, day, hour) :
		day ?    Date.UTC(year, month, day) :
		month ?  Date.UTC(year, month) :
		Date.UTC(year)
	);

	if (zone && (zoneHour !== '00' || (zoneMinute !== '00' && zoneMinute !== undefined))) {
		setTimeZoneOffset(zone[0], zoneHour, zoneMinute, date);
	}

	return date;
}

function createDateLocal(year, month, day, hour, minute, second, ms, zone) {
	if (zone) {
		throw new Error('createDateLocal() will not parse a string with a time zone "' + zone + '".');
	}

	// Month must be 0-indexed for the Date constructor
	month = parseInt(month, 10) - 1;

	return ms ?  new Date(year, month, day, hour, minute, second, ms) :
		second ? new Date(year, month, day, hour, minute, second) :
		minute ? new Date(year, month, day, hour, minute) :
		hour ?   new Date(year, month, day, hour) :
		day ?    new Date(year, month, day) :
		month ?  new Date(year, month) :
		new Date(year) ;
}

function secondsToDate(n) {
	return new Date(n * 1000);
}

function setTimeZoneOffset(sign, hour, minute, date) {
	if (sign === '+') {
		date.setUTCHours(date.getUTCHours() - parseInt(hour, 10));
		if (minute) {
			date.setUTCMinutes(date.getUTCMinutes() - parseInt(minute, 10));
		}
	}
	else if (sign === '-') {
		date.setUTCHours(date.getUTCHours() + parseInt(hour, 10));
		if (minute) {
			date.setUTCMinutes(date.getUTCMinutes() + parseInt(minute, 10));
		}
	}

	return date;
}



// Date object formatting
//
// Use the internationalisation methods for turning a date into a UTC or
// locale string, the date object for turning them into a local string.

var dateFormatters = {
	YYYY: function(date)       { return ('000' + date.getFullYear()).slice(-4); },
	YY:   function(date)       { return ('0' + date.getFullYear() % 100).slice(-2); },
	MM:   function(date)       { return ('0' + (date.getMonth() + 1)).slice(-2); },
	MMM:  function(date, lang) { return this.MMMM(date, lang).slice(0,3); },
	MMMM: function(date, lang) { return langs[lang].months[date.getMonth()]; },
	D:    function(date)       { return '' + date.getDate(); },
	DD:   function(date)       { return ('0' + date.getDate()).slice(-2); },
	ddd:  function(date, lang) { return this.dddd(date, lang).slice(0,3); },
	dddd: function(date, lang) { return langs[lang].days[date.getDay()]; },
	hh:   function(date)       { return ('0' + date.getHours()).slice(-2); },
	//hh:   function(date)       { return ('0' + date.getHours() % 12).slice(-2); },
	mm:   function(date)       { return ('0' + date.getMinutes()).slice(-2); },
	ss:   function(date)       { return ('0' + date.getSeconds()).slice(-2); },
	sss:  function(date)       { return (date.getSeconds() + date.getMilliseconds() / 1000 + '').replace(/^\d\.|^\d$/, function($0){ return '0' + $0; }); },
	ms:   function(date)       { return '' + date.getMilliseconds(); },

	// Experimental
	am:   function(date) { return date.getHours() < 12 ? 'am' : 'pm'; },
	zz:   function(date) {
		return (date.getTimezoneOffset() < 0 ? '+' : '-') +
			 ('0' + Math.round(100 * Math.abs(date.getTimezoneOffset()) / 60)).slice(-4) ;
	},
	th:   function(date, lang) { return langs[lang].ordinals[date.getDate()]; },
	n:    function(date) { return +date; },
	ZZ:   function(date) { return -date.getTimezoneOffset() * 60; }
};

var componentFormatters = {
	YYYY: function(data)       { return data.year; },
	YY:   function(data)       { return ('0' + data.year).slice(-2); },
	MM:   function(data)       { return data.month; },
	MMM:  function(data, lang) { return this.MMMM(data, lang).slice(0,3); },
	MMMM: function(data, lang) { return langs[lang].months[data.month - 1]; },
	D:    function(data)       { return parseInt(data.day, 10) + ''; },
	DD:   function(data)       { return data.day; },
	DDD:  function(data)       { return data.weekday.slice(0,3); },
	DDDD: function(data, lang) { return data.weekday; },
	hh:   function(data)       { return data.hour; },
	//hh:   function(data)       { return ('0' + data.hour % 12).slice(-2); },
	mm:   function(data)       { return data.minute; },
	ss:   function(data)       { return data.second; },
	//sss:  function(data)       { return (date.second + date.getMilliseconds() / 1000 + '').replace(/^\d\.|^\d$/, function($0){ return '0' + $0; }); },
	//ms:   function(data)       { return '' + date.getMilliseconds(); },
};

var componentKeys = {
	// Components, in order of appearance in the locale string
	'en-US': ['weekday', 'month', 'day', 'year', 'hour', 'minute', 'second'],
	// fr: "lundi 12/02/2018 à 18:54:09" (different in IE/Edge, of course)
	// de: "Montag, 12.02.2018, 19:28:39" (different in IE/Edge, of course)
	default: ['weekday', 'day', 'month', 'year', 'hour', 'minute', 'second']
};

var options = {
	// Time zone
	timeZone:      'UTC',
	// Use specified locale matcher
	formatMatcher: 'basic',
	// Use 24 hour clock
	hour12:        false,
	// Format string components
	weekday:       'long',
	year:          'numeric',
	month:         '2-digit',
	day:           '2-digit',
	hour:          '2-digit',
	minute:        '2-digit',
	second:        '2-digit',
	//timeZoneName:  'short'
};

var rtoken$1    = /([YZMDdhmswz]{2,4}|D|\+-)/g;
var rusdate   = /\w{3,}|\d+/g;
var rdatejson = /^"(-?\d{4,}-\d\d-\d\d)/;

function matchEach(regex, fn, text) {
	var match = regex.exec(text);
	if (!match) { return; }
	fn.apply(null, match);
	matchEach(regex, fn, text);
}

function toLocaleString(timezone, locale, date) {
	options.timeZone = timezone || 'UTC';
	var string = date.toLocaleString(locale, options);
	return string;
}

function toLocaleComponents(timezone, locale, date) {
	var localedate = toLocaleString(timezone, locale, date);
	var components = {};
	var keys       = componentKeys[locale] || componentKeys.default;
	var i          = 0;

	matchEach(rusdate, function(value) {
		components[keys[i++]] = value;
	}, localedate);

	components.milliseconds = +date % 1000;
	return components;
}

function _formatDate(string, timezone, locale, date) {
	// Derive lang from locale
	var lang = locale ? locale.slice(0,2) : document.documentElement.lang ;

	// Todo: only en-US and fr supported for the time being
	locale = locale === 'en' ? 'en-US' :
		locale ? locale :
		'en-US';

	var data    = toLocaleComponents(timezone, locale, date);
	var formats = componentFormatters;

	return string.replace(rtoken$1, function($0) {
		return formats[$0] ?
			formats[$0](data, lang) :
			$0 ;
	});
}

/**
formatDate(format, locale, timezone, date)
Formats `date`, an ISO string or number in seconds or a JS date object,
to the format of the string `format`. The format string may contain the tokens:

- `'YYYY'` years
- `'YY'`   2-digit year
- `'MM'`   month, 2-digit
- `'MMM'`  month, 3-letter
- `'MMMM'` month, full name
- `'D'`    day of week
- `'DD'`   day of week, two-digit
- `'DDD'`  weekday, 3-letter
- `'DDDD'` weekday, full name
- `'hh'`   hours
- `'mm'`   minutes
- `'ss'`   seconds

The `locale` string may be `'en'` or `'fr'`. The `'timezone'` parameter is
either `'UTC'` or an IANA timezone such as '`Europe/Zurich`'
([timezones on Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)).

```
const date = formatDate('YYYY', 'en', 'UTC', new Date());   // 2020
```
*/

const formatDate = curry(function (format, locale, timezone, date) {
	return format === 'ISO' ?
		formatDateISO(parseDate(date)) :
	timezone === 'local' ?
		formatDateLocal(format, locale, date) :
	_formatDate(format, timezone, locale, parseDate(date)) ;
});

/**
formatDateLocal(format, locale, date)

As `formatDate(date)`, but returns a date object with local time set to the
result of the parse.
**/

function formatDateLocal(format, locale, date) {
	var formatters = dateFormatters;
	var lang = locale.slice(0, 2);

	// Use date formatters to get time as current local time
	return format.replace(rtoken$1, function($0) {
		return formatters[$0] ? formatters[$0](date, lang) : $0 ;
	});
}

/**
formatDateISO(date)
Formats `date` (a string or a number or date accepted by `parseDate(date)`) as
a string in the ISO date format.
*/

function formatDateISO(date) {
	return rdatejson.exec(JSON.stringify(parseDate(date)))[1];
}



// Time operations

var days   = {
	mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0
};



/*
toDay(date)
Returns day of week as a number, where monday is `0`.
*/

const dayMap = [6,0,1,2,3,4,5];

function toDay(date) {
	return dayMap[date.getDay()];
}

/*
cloneDate(date)
Returns new date object set to same date.
*/

function cloneDate(date) {
	return new Date(+date);
}

function addDateComponents(sign, yy, mm, dd, date) {
	date.setUTCFullYear(date.getUTCFullYear() + sign * parseInt(yy, 10));

	if (!mm) { return; }

	// Adding and subtracting months can give weird results with the JS
	// date object. For example, taking a month away from 2018-03-31 results
	// in 2018-03-03 (or the 31st of February), whereas adding a month on to
	// 2018-05-31 results in the 2018-07-01 (31st of June).
	//
	// To mitigate this weirdness track the target month and roll days back
	// until the month is correct, like Python's relativedelta utility:
	// https://dateutil.readthedocs.io/en/stable/relativedelta.html#examples
	var month       = date.getUTCMonth();
	var monthDiff   = sign * parseInt(mm, 10);
	var monthTarget = mod(12, month + monthDiff);

	date.setUTCMonth(month + monthDiff);

	// If the month is too far in the future scan backwards through
	// months until it fits. Setting date to 0 means setting to last
	// day of previous month.
	while (date.getUTCMonth() > monthTarget) { date.setUTCDate(0); }

	if (!dd) { return; }

	date.setUTCDate(date.getUTCDate() + sign * parseInt(dd, 10));
}

function _addDate(duration, date) {
	// Don't mutate the original date
	date = cloneDate(date);

	// First parse the date portion duration and add that to date
	var tokens = rdatediff.exec(duration) ;
	var sign = 1;

	if (tokens) {
		sign = tokens[1] === '-' ? -1 : 1 ;
		addDateComponents(sign, tokens[2], tokens[3], tokens[4], date);

		// If there is no 'T' separator go no further
		if (!tokens[5]) { return date; }

		// Prepare duration for time parsing
		duration = duration.slice(tokens[0].length);

		// Protect against parsing a stray sign before time
		if (duration[0] === '-') { return date; }
	}

	// Then parse the time portion and add that to date
	var time = parseTimeDiff(duration);
	if (time === undefined) { return; }

	date.setTime(date.getTime() + sign * time * 1000);
	return date;
}

function diff$1(t, d1, d2) {
	var y1 = d1.getUTCFullYear();
	var m1 = d1.getUTCMonth();
	var y2 = d2.getUTCFullYear();
	var m2 = d2.getUTCMonth();

	if (y1 === y2 && m1 === m2) {
		return t + d2.getUTCDate() - d1.getUTCDate() ;
	}

	t += d2.getUTCDate() ;

	// Set to last date of previous month
	d2.setUTCDate(0);
	return diff$1(t, d1, d2);
}

function _diffDateDays(date1, date2) {
	var d1 = parseDate(date1);
	var d2 = parseDate(date2);

	return d2 > d1 ?
		// 3rd argument mutates, so make sure we get a clean date if we
		// have not just made one.
		diff$1(0, d1, d2 === date2 || d1 === d2 ? cloneDate(d2) : d2) :
		diff$1(0, d2, d1 === date1 || d2 === d1 ? cloneDate(d1) : d1) * -1 ;
}

function floorDateByGrain(token, date) {
	var diff, week;

	if (token === 'ms') { return date; }

	date.setUTCMilliseconds(0);
	if (token === 's') { return date; }

	date.setUTCSeconds(0);
	if (token === 'm') { return date; }

	date.setUTCMinutes(0);
	if (token === 'h') { return date; }

	date.setUTCHours(0);
	if (token === 'd') { return date; }

	if (token === 'w') {
		date.setDate(date.getDate() - toDay(date));
		return date;
	}

	if (token === 'fortnight') {
		week = floorDateByDay(1, new Date());
		diff = mod(14, _diffDateDays(week, date));
		date.setUTCDate(date.getUTCDate() - diff);
		return date;
	}

	date.setUTCDate(1);
	if (token === 'M') { return date; }

	date.setUTCMonth(0);
	if (token === 'Y') { return date; }

	date.setUTCFullYear(0);
	return date;
}

function floorDateByDay(day, date) {
	var currentDay = date.getUTCDay();

	// If we are on the specified day, return this date
	if (day === currentDay) { return date; }

	var diff = currentDay - day;
	if (diff < 0) { diff = diff + 7; }
	return _addDate('-0000-00-0' + diff, date);
}

function _floorDate(token, date) {
	// Clone date before mutating it
	date = cloneDate(date);
	return typeof token === 'number' ? floorDateByDay(token, date) :
        days[token] ? floorDateByDay(days[token], date) :
	    floorDateByGrain(token, date) ;
}

/**
addDate(diff, date)
Sums `diff` and `date`, where `diff` is a string in ISO date format. Returns
a new date object.

```
const addWeek = addDate('0000-00-07');
const sameTimeNextWeek = addWeek(new Date());
```
*/

const addDate = curry(function(diff, date) {
	return _addDate(diff, parseDate(date));
});

const diffDateDays = curry(_diffDateDays);

/**
floorDate(token, date)
Floors date to the start of nearest calendar point in increment indicated
by `token`:

- `'Y'`   Year
- `'M'`   Month
- `'w'`   Week
- `'d'`   Day
- `'h'`   Hour
- `'m'`   Minute
- `'s'`   Second
- `'mon'` Monday
- `'tue'` Tuesday
- `'wed'` Wednesday
- `'thu'` Thursday
- `'fri'` Friday
- `'sat'` Saturday
- `'sun'` Sunday

```
const dayCounts = times.map(floorDate('d'));
```
*/

const floorDate = curry(function(token, date) {
	return _floorDate(token, parseDate(date));
});

var browser = /firefox/i.test(navigator.userAgent) ? 'FF' :
	document.documentMode ? 'IE' :
	'standard' ;

// #e2006f
// #332256

if (window.console && window.console.log) {
    window.console.log('%cFn%c          - https://stephen.band/fn', 'color: #de3b16; font-weight: 600;', 'color: inherit; font-weight: 400;');
}
const requestTime$1 = curry(requestTime, true, 2);
const and     = curry(function and(a, b) { return !!(a && b); });
const or      = curry(function or(a, b) { return a || b; });
const xor     = curry(function xor(a, b) { return (a || b) && (!!a !== !!b); });
const assign$3  = curry(Object.assign, true, 2);
const define  = curry(Object.defineProperties, true, 2);

const byAlphabet$1  = curry(byAlphabet);

const ap$1          = curry(ap, true);
const concat$1      = curry(concat, true);
const contains$1    = curry(contains, true);
const each$1        = curry(each, true);
const filter$1      = curry(filter, true);
const find$1        = curry(find, true);
const map$1         = curry(map, true);
const reduce$2      = curry(reduce, true);
const remove$1      = curry(remove, true);
const rest$1        = curry(rest, true);
const slice$1       = curry(slice, true, 3);
const sort$1        = curry(sort, true);
const insert$1      = curry(insert, true);
const take$1        = curry(take, true);
const update$1      = curry(update, true);

const diff$2        = curry(diff, true);
const intersect$1   = curry(intersect, true);
const unite$1       = curry(unite, true);
const normalise   = curry(choose(normalisers), false, 4);
const denormalise = curry(choose(denormalisers), false, 4);
const exponentialOut$1 = curry(expOut);



const add = curry(function (a, b) {
    console.trace('Deprecated: module add() is now sum()');
    return a + b;
});

Stream$1.Choke = function(time) {
    return new Stream$1(function setup(notify, done) {
        var value;
        var update = choke(function() {
            // Get last value and stick it in buffer
            value = arguments[arguments.length - 1];
            notify();
        }, time);

        return {
            shift: function() {
                var v = value;
                value = undefined;
                return v;
            },

            push: update,

            stop: function stop() {
                update.cancel(false);
                done();
            }
        };
    });
};

/**
.wait(time)
Emits the latest value only after `time` seconds of inactivity.
Other values are discarded.
*/

Stream$1.prototype.wait = function wait(time) {
    return this.pipe(Stream$1.Choke(time));
};

const assign$4      = Object.assign;
const CustomEvent = window.CustomEvent;

const defaults    = {
	// The event bubbles (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	bubbles: true,

	// The event may be cancelled (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	cancelable: true

	// Trigger listeners outside of a shadow root (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
	//composed: false
};

/**
Event(type, properties)

Creates a CustomEvent of type `type`.
Additionally, `properties` are assigned to the event object.
*/

function Event$1(type, options) {
	let settings;

	if (typeof type === 'object') {
		settings = assign$4({}, defaults, type);
		type = settings.type;
        delete settings.type;
	}

	if (options && options.detail) {
		if (settings) {
			settings.detail = options.detail;
		}
		else {
			settings = assign$4({ detail: options.detail }, defaults);
		}
	}

    // Settings accepted by CustomEvent:
    // detail:     any
    // bubbles:    true | false
    // cancelable: true | false
    // composed:   true | false
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
	var event = new CustomEvent(type, settings || defaults);

	if (options) {
		delete options.detail;
		assign$4(event, options);
	}

	return event;
}

/**
prefix(string)
Returns a prefixed CSS property name where a prefix is required in the current
browser.
*/

const prefixes = ['Khtml','O','Moz','Webkit','ms'];

var node = document.createElement('div');
var cache$1 = {};

function testPrefix(prop) {
    if (prop in node.style) { return prop; }

    var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    var l = prefixes.length;
    var prefixProp;

    while (l--) {
        prefixProp = prefixes[l] + upper;

        if (prefixProp in node.style) {
            return prefixProp;
        }
    }

    return false;
}

function prefix$1(prop){
    return cache$1[prop] || (cache$1[prop] = testPrefix(prop));
}

const define$1 = Object.defineProperties;

/**
features

An object of feature detection results.

```
{
    inputEventsWhileDisabled: true, // false in FF, where disabled inputs don't trigger events
    template: true,                 // false in old browsers where template.content not found
    textareaPlaceholderSet: true,   // false in IE, where placeholder is also set on innerHTML
    transition: true,               // false in older browsers where transitions not supported
    fullscreen: true,               // false where fullscreen API not supported
    scrollBehavior: true,           // Whether scroll behavior CSS is supported
    events: {
        fullscreenchange: 'fullscreenchange',
        transitionend:    'transitionend'
    }
}
```
*/

var features = define$1({
    events: define$1({}, {
        fullscreenchange: {
            get: cache(function() {
                // TODO: untested event names
                return ('fullscreenElement' in document) ? 'fullscreenchange' :
                ('webkitFullscreenElement' in document) ? 'webkitfullscreenchange' :
                ('mozFullScreenElement' in document) ? 'mozfullscreenchange' :
                ('msFullscreenElement' in document) ? 'MSFullscreenChange' :
                'fullscreenchange' ;
            }),

            enumerable: true
        },

        transitionend: {
            // Infer transitionend event from CSS transition prefix

            get: cache(function() {
                var end = {
                    KhtmlTransition: false,
                    OTransition: 'oTransitionEnd',
                    MozTransition: 'transitionend',
                    WebkitTransition: 'webkitTransitionEnd',
                    msTransition: 'MSTransitionEnd',
                    transition: 'transitionend'
                };

                var prefixed = prefix$1('transition');
                return prefixed && end[prefixed];
            }),

            enumerable: true
        }
    })
}, {
    inputEventsWhileDisabled: {
        // FireFox won't dispatch any events on disabled inputs:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=329509

        get: cache(function() {
            var input     = document.createElement('input');
            var testEvent = Event('featuretest');
            var result    = false;

            document.body.appendChild(input);
            input.disabled = true;
            input.addEventListener('featuretest', function(e) { result = true; });
            input.dispatchEvent(testEvent);
            input.remove();

            return result;
        }),

        enumerable: true
    },

    template: {
        get: cache(function() {
            // Older browsers don't know about the content property of templates.
            return 'content' in document.createElement('template');
        }),

        enumerable: true
    },

    textareaPlaceholderSet: {
        // IE sets textarea innerHTML (but not value) to the placeholder
        // when setting the attribute and cloning and so on. The twats have
        // marked it "Won't fix":
        //
        // https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea

        get: cache(function() {
            var node = document.createElement('textarea');
            node.setAttribute('placeholder', '---');
            return node.innerHTML === '';
        }),

        enumerable: true
    },

    transition: {
        get: cache(function testTransition() {
            var prefixed = prefix$1('transition');
            return prefixed || false;
        }),

        enumerable: true
    },

    fullscreen: {
        get: cache(function testFullscreen() {
            var node = document.createElement('div');
            return !!(node.requestFullscreen ||
                node.webkitRequestFullscreen ||
                node.mozRequestFullScreen ||
                node.msRequestFullscreen);
        }),

        enumerable: true
    },

    scrollBehavior: {
        get: cache(function() {
            return 'scrollBehavior' in document.documentElement.style;
        })
    },

    scrollBarWidth: {
        get: cache(function() {
            // TODO

            /*
            let scrollBarWidth;
                        
            function testScrollBarWidth() {
                if (scrollBarWidth) { return scrollBarWidth; }
            
                const inner = create('div', {
                    style: 'display: block; width: auto; height: 60px; background: transparent;'
                });
            
                const test = create('div', {
                    style: 'overflow: scroll; width: 30px; height: 30px; position: absolute; bottom: 0; right: 0; background: transparent; z-index: -1;',
                    children: [inner]
                });
            
                document.body.appendChild(test);
                scrollBarWidth = test.offsetWidth - inner.offsetWidth;
                test.remove();
                return scrollBarWidth;
            }
            */

        })
    }
});

const assign$5  = Object.assign;
const rspaces = /\s+/;

function prefixType(type) {
	return features.events[type] || type ;
}


// Handle event types

// DOM click events may be simulated on inputs when their labels are
// clicked. The tell-tale is they have the same timeStamp. Track click
// timeStamps.
var clickTimeStamp = 0;

window.addEventListener('click', function(e) {
	clickTimeStamp = e.timeStamp;
});

function listen(source, type) {
	source.node.addEventListener(type, source, source.options);
	return source;
}

function unlisten(source, type) {
	source.node.removeEventListener(type, source);
	return source;
}

/**
events(type, node)

Returns a mappable stream of events heard on `node`:

```js
var stream = events('click', document.body);
.map(get('target'))
.each(function(node) {
    // Do something with nodes
});
```

Stopping the stream removes the event listeners:

```js
stream.stop();
```

The first parameter may also be an options object, which must have a `type`
property. Other properties, eg. `passive: true` are passed to addEventListener 
options.

```js
var stream = events({ type: 'scroll', passive: true }, document.body);
```
*/

function Source(notify, stop, type, options, node) {
	const types  = type.split(rspaces).map(prefixType);
	const buffer = [];

	function update(value) {
		buffer.push(value);
		notify();
	}

	this._stop   = stop;
	this.types   = types;
	this.node    = node;
	this.buffer  = buffer;
	this.update  = update;
	this.options = options;

	// Potential hard-to-find error here if type has repeats, ie 'click click'.
	// Lets assume nobody is dumb enough to do this, I dont want to have to
	// check for that every time.
	types.reduce(listen, this);
}

assign$5(Source.prototype, {
	shift: function shiftEvent() {
		const buffer = this.buffer;
		return buffer.shift();
	},

	stop: function stopEvent() {
		this.types.reduce(unlisten, this);
		this._stop(this.buffer.length);
	},

    /* Make source double as our DOM listener object */
    handleEvent: function handleEvent(e) {
        if (e.type === 'click'
         && e.timeStamp <= clickTimeStamp) {
            // Ignore clicks with the same timeStamp as previous clicks –
            // they are likely simulated by the browser.
            return;
        }

        this.update(e);
    }
});

function events(type, node) {
	let options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	return new Stream$1(function(notify, stop) {
		return new Source(notify, stop, type, options, node)
	});
}


/**
isPrimaryButton(e)

Returns `true` if user event is from the primary (normally the left or only)
button of an input device. Use this to avoid listening to right-clicks.
*/

function isPrimaryButton(e) {
	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	return (e.which === 1 && !e.ctrlKey && !e.altKey && !e.shiftKey);
}

function isTargetEvent(e) {
	return e.target === e.currentTarget;
}


// -----------------

const A$4 = Array.prototype;
const eventsSymbol = Symbol('events');

function applyTail(fn, args) {
	return function() {
		A$4.push.apply(arguments, args);
		fn.apply(null, arguments);
	};
}

function on(type, fn, node) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol] || (node[eventsSymbol] = {});
	var handler = arguments.length > 3 ? applyTail(fn, A$4.slice.call(arguments, 3)) : fn ;
	var handlers, listener;
	var n = -1;

	while (++n < types.length) {
		type = types[n];
		handlers = events[type] || (events[type] = []);
		listener = type === 'click' ?
			function(e) {
				// Ignore clicks with the same timeStamp as previous clicks –
				// they are likely simulated by the browser on inputs when
				// their labels are clicked
				if (e.timeStamp <= clickTimeStamp) { return; }
				handler(e);
			} :
			handler ;
		handlers.push([fn, listener]);
		node.addEventListener(type, listener, options);
	}

	return node;
}

function off(type, fn, node) {
	var options;

	if (typeof type === 'object') {
		options = type;
		type    = options.type;
	}

	var types   = type.split(rspaces);
	var events  = node[eventsSymbol];
	var handlers, i;

	if (!events) { return node; }

	var n = -1;
	while (n++ < types.length) {
		type = types[n];
		handlers = events[type];
		if (!handlers) { continue; }
		i = handlers.length;
		while (i--) {
			if (handlers[i][0] === fn) {
				node.removeEventListener(type, handlers[i][1]);
				handlers.splice(i, 1);
			}
		}
	}

	return node;
}

/**
style(property, node)

Returns the computed style `property` of `node`.

    style('transform', node);            // returns transform

If `property` is of the form `"property:name"`, a named aspect of the property
is returned.

    style('transform:rotate', node);     // returns rotation, as a number, in radians
    style('transform:scale', node);      // returns scale, as a number
    style('transform:translateX', node); // returns translation, as a number, in px
    style('transform:translateY', node); // returns translation, as a number, in px
*/

var rpx          = /px$/;
var styleParsers = {
	"transform:translateX": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[4]);
	},

	"transform:translateY": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[5]);
	},

	"transform:scale": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.sqrt(a * a + b * b);
	},

	"transform:rotate": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.atan2(b, a);
	}
};

function valuesFromCssFn(string) {
	return string.split('(')[1].split(')')[0].split(/\s*,\s*/);
}

function computedStyle(name, node) {
	return window.getComputedStyle ?
		window
		.getComputedStyle(node, null)
		.getPropertyValue(name) :
		0 ;
}

function style(name, node) {
    // If name corresponds to a custom property name in styleParsers...
    if (styleParsers[name]) { return styleParsers[name](node); }

    var value = computedStyle(name, node);

    // Pixel values are converted to number type
    return typeof value === 'string' && rpx.test(value) ?
        parseFloat(value) :
        value ;
}

// Units


/* Track document font size */

let fontSize;

function getFontSize() {
    return fontSize ||
        (fontSize = style("font-size", document.documentElement));
}

events('resize', window).each(() => fontSize = undefined);


/**
parseValue(value)`
Takes a string of the form '10rem', '100vw' or '100vh' and returns a number in pixels.
*/

const parseValue$1 = overload(toType, {
    'number': id,

    'string': parseVal({
        em: function(n) {
            return getFontSize() * n;
        },

        px: function(n) {
            return n;
        },

        rem: function(n) {
            return getFontSize() * n;
        },

        vw: function(n) {
            return window.innerWidth * n / 100;
        },

        vh: function(n) {
            return window.innerHeight * n / 100;
        }
    })
});

const rules = [];

const types = overload(toType, {
    'number':   id,
    'string':   parseValue$1,
    'function': function(fn) { return fn(); }
});

const tests = {
    minWidth: function(value)  { return width >= types(value); },
    maxWidth: function(value)  { return width <  types(value); },
    minHeight: function(value) { return height >= types(value); },
    maxHeight: function(value) { return height <  types(value); },
    minScrollTop: function(value) { return scrollTop >= types(value); },
    maxScrollTop: function(value) { return scrollTop <  types(value); },
    minScrollBottom: function(value) { return (scrollHeight - height - scrollTop) >= types(value); },
    maxScrollBottom: function(value) { return (scrollHeight - height - scrollTop) <  types(value); }
};

let width = window.innerWidth;
let height = window.innerHeight;
let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
let scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

function test(query) {
    var keys = Object.keys(query);
    var n = keys.length;
    var key;

    if (keys.length === 0) { return false; }

    while (n--) {
        key = keys[n];
        if (!tests[key](query[key])) { return false; }
    }

    return true;
}

function update$2(e) {
    var l = rules.length;
    var rule;

    // Run exiting rules
    while (l--) {
        rule = rules[l];

        if (rule.state && !test(rule.query)) {
            rule.state = false;
            rule.exit && rule.exit(e);
        }
    }

    l = rules.length;

    // Run entering rules
    while (l--) {
        rule = rules[l];

        if (!rule.state && test(rule.query)) {
            rule.state = true;
            rule.enter && rule.enter(e);
        }
    }
}

function scroll(e) {
    scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    update$2(e);
}

function resize(e) {
    width = window.innerWidth;
    height = window.innerHeight;
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    update$2(e);
}

window.addEventListener('scroll', scroll);
window.addEventListener('resize', resize);

ready$1(update$2);
document.addEventListener('DOMContentLoaded', update$2);

/**
assign(node, properties)

Assigns each property of `properties` to `node`, as a property where that
property exists in `node`, otherwise as an attribute.

If `properties` has a property `'children'` it must be an array of nodes;
they are appended to 'node'.

The property `'html'` is aliased to `'innerHTML'`. The property `'text'` 
is aliased to `'textContent'`. The property `'tag'` is treated as an alias 
of `'tagName'` (which is ignored, as `node.tagName` is read-only). The 
property `'is'` is also ignored.
*/

const assignProperty = overload(id, {
	// Ignore read-only properties or attributes
	is: noop,
	tag: noop,

	html: function(name, node, content) {
		node.innerHTML = content;
	},

	text: function(name, node, content) {
		node.textContent = content;
	},

	children: function(name, node, content) {
		// Empty the node and append children
		node.innerHTML = '';
		content.forEach((child) => { node.appendChild(child); });
	},

	// SVG points property must be set as string attribute - SVG elements
	// have a read-only API exposed at .points
	points: setAttribute,
    cx:     setAttribute,
    cy:     setAttribute,
    r:      setAttribute,
    preserveAspectRatio: setAttribute,
    viewBox: setAttribute,

	default: function(name, node, content) {
		if (name in node) {
			node[name] = content;
		}
		else {
			node.setAttribute(name, content);
		}
	}
});

function setAttribute(name, node, content) {
	node.setAttribute(name, content);
}

function assign$6(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		assignProperty(names[n], node, attributes[names[n]]);
	}

	return node;
}

var assign$7 = curry(assign$6, true);

const svgNamespace = 'http://www.w3.org/2000/svg';
const div = document.createElement('div');


// Constructors

function constructHTML(tag, html) {
    var node = document.createElement(tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

function constructSVG(tag, html) {
    var node = document.createElementNS(svgNamespace, tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

const construct = overload(id, {
    comment: function(tag, text) {
        return document.createComment(text || '');
    },

    fragment: function(tag, html) {
        var fragment = document.createDocumentFragment();

        if (html) {
            div.innerHTML = html;
            const nodes = div.childNodes;
            while (nodes[0]) {
                fragment.appendChild(nodes[0]);
            }
        }

        return fragment;
    },

    text: function (tag, text) {
        return document.createTextNode(text || '');
    },

    circle:   constructSVG,
    ellipse:  constructSVG,
    g:        constructSVG,
    glyph:    constructSVG,
    image:    constructSVG,
    line:     constructSVG,
    rect:     constructSVG,
    use:      constructSVG,
    path:     constructSVG,
    pattern:  constructSVG,
    polygon:  constructSVG,
    polyline: constructSVG,
    svg:      constructSVG,
    default:  constructHTML
});




/**
create(tag, content)

Constructs and returns a new DOM node.

- If `tag` is `"text"` a text node is created.
- If `tag` is `"fragment"` a fragment is created.
- If `tag` is `"comment"` a comment is created.
- If `tag` is any other string the element `<tag></tag>` is created.
- Where `tag` is an object, it must have a `"tag"` or `"tagName"` property.
A node is created according to the above rules for tag strings, and other
properties of the object are assigned with dom's `assign(node, object)` function.

If `content` is a string it is set as text content on a text or comment node,
or as inner HTML on an element or fragment. It may also be an object of
properties which are assigned with dom's `assign(node, properties)` function.
*/

function toTypes() {
    return Array.prototype.map.call(arguments, toType).join(' ');
}

function validateTag(tag) {
    if (typeof tag !== 'string') {
        throw new Error('create(object, content) object must have string property .tag or .tagName');
    }
}

var create$1 = overload(toTypes, {
    'string': construct,

    'string string': construct,

    'string object': function(tag, content) {
        return assign$7(construct(tag, ''), content);
    },

    'object string': function(properties, text) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        // Warning: text is set before properties, but text should override
        // html or innerHTML property, ie, be set after.
        return assign$7(construct(tag, text), properties);
    },

    'object object': function(properties, content) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        return assign$7(assign$7(construct(tag, ''), properties), content);
    },

    default: function() {
        throw new Error('create(tag, content) does not accept argument types "' + Array.prototype.map.call(arguments, toType).join(' ') + '"');
    }
});

/**
escape(string)
Escapes `string` for setting safely as HTML.
*/

var pre  = document.createElement('pre');
var text = document.createTextNode('');

pre.appendChild(text);

// Types


// Links

function prefixSlash(str) {
	// Prefixes a slash when there is not an existing one
	return (/^\//.test(str) ? '' : '/') + str ;
}

/**
isInternalLink(node)

Returns `true` if the `href` of `node` points to a resource on the same domain
as the current document.
*/

function isInternalLink(node) {
	var location = window.location;

		// IE does not give us a .hostname for links to
		// xxx.xxx.xxx.xxx URLs. file:// URLs don't have a hostname
		// anywhere. This logic is not foolproof, it will let through
		// links to different protocols for example
	return (!node.hostname ||
		// IE gives us the port on node.host, even where it is not
		// specified. Use node.hostname
		location.hostname === node.hostname) &&
		// IE gives us node.pathname without a leading slash, so
		// add one before comparing
		location.pathname === prefixSlash(node.pathname);
}

function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}

var attribute$1 = curry(attribute, true);

function contains$2(child, node) {
	return node.contains ?
		node.contains(child) :
	child.parentNode ?
		child.parentNode === node || contains$2(child.parentNode, node) :
	false ;
}

curry(contains$2, true);

/**
tag(node)

Returns the tag name of `node`, in lowercase.

```
const li = create('li', 'Salt and vinegar');
tag(li);   // 'li'
```
*/

function tag(node) {
	return node.tagName && node.tagName.toLowerCase();
}

function matches$1(selector, node) {
	return node.matches ? node.matches(selector) :
		node.matchesSelector ? node.matchesSelector(selector) :
		node.webkitMatchesSelector ? node.webkitMatchesSelector(selector) :
		node.mozMatchesSelector ? node.mozMatchesSelector(selector) :
		node.msMatchesSelector ? node.msMatchesSelector(selector) :
		node.oMatchesSelector ? node.oMatchesSelector(selector) :
		// Dumb fall back to simple tag name matching. Nigh-on useless.
		tag(node) === selector ;
}

var matches$2 = curry(matches$1, true);

function closest(selector, node) {
	var root = arguments[2];

	if (!node || node === document || node === root || node.nodeType === 11) { return; }

	// SVG <use> elements store their DOM reference in
	// .correspondingUseElement.
	node = node.correspondingUseElement || node ;

	return matches$2(selector, node) ?
		 node :
		 closest(selector, node.parentNode, root) ;
}

var closest$1 = curry(closest, true);

function find$2(selector, node) {
	return node.querySelector(selector);
}

var find$3 = curry(find$2, true);

function select(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

var query = curry(select, true);

function get$2(id) {
    return document.getElementById(id) || undefined;
}

/**
next(node)
Returns the next sibling element node, or `undefined`.
*/

function next(node) {
	return node.nextElementSibling || undefined;
}

/**
previous(node)
Returns the previous sibling element node, or `undefined`.
*/

function previous(node) {
	return node.previousElementSibling || undefined;
}

/**
children(node)

Returns an array of child elements of `node`.
*/

function children(node) {
	// In IE and Safari, document fragments do not have .children, fall back to
	// querySelectorAll.

	// TOIDO: BUg in selector!!!
	return toArray(node.children || node.querySelectorAll('*'));
}

/**
append(target, node)

Appends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.append) {
    throw new Error('A polyfill for Element.append() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append)');
}

function append$1(target, node) {
    target.append(node);
    return target.lastChild;
}

var append$2 = curry(append$1, true);

/**
prepend(target, node)

Prepends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.prepend) {
    throw new Error('A polyfill for Element.prepend() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend)');
}

function prepend$2(target, node) {
    target.prepend(node);
    return target.firstChild;
}

curry(prepend$2, true);

/**
clone(node)
Returns a deep copy of `node`.
*/

features.textareaPlaceholderSet ?

	function clone(node) {
		return node.cloneNode(true);
	} :

	function cloneWithHTML(node) {
		// IE sets textarea innerHTML to the placeholder when cloning.
		// Reset the resulting value.

		var clone     = node.cloneNode(true);
		var textareas = select('textarea', node);
		var n         = textareas.length;
		var clones;

		if (n) {
			clones = select('textarea', clone);

			while (n--) {
				clones[n].value = textareas[n].value;
			}
		}

		return clone;
	} ;

/**
identify(node)

Returns the id of `node`, or where `node` has no id, a random id is generated,
checked against the DOM for uniqueness, set on `node` and returned:

```
// Get ids of all buttons in document
select('button', document)
.map(identify)
.forEach((id) => ...)
```
*/

function identify(node) {
	var id = node.id;

	if (!id) {
		do { id = Math.ceil(Math.random() * 100000); }
		while (document.getElementById(id));
		node.id = id;
	}

	return id;
}

/** DOM Mutation */

/**
remove(node)

Removes `node` from the DOM.
*/

function remove$2(node) {
	if (node.remove) {
		node.remove();
	}
	else {
		console.warn('deprecated: remove() no longer removes lists of nodes.');
		node.parentNode && node.parentNode.removeChild(node);
	}

	return node;
}

/**
before(target, node)

Inserts `node` before target.
*/

function before(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target);
	return node;
}

/**
after(target, node)

Inserts `node` after `target`.
*/

function after(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
	return node;
}

/**
replace(target, node)

Swaps `target` for `node`.
*/

function replace(target, node) {
	before(target, node);
	remove$2(target);
	return node;
}

const classes = get$1('classList');

/**
addClass(class, node)
Adds `'class'` to the classList of `node`.
*/

function addClass(string, node) {
	classes(node).add(string);
}

/**
removeClass(class, node)
Removes `'class'` from the classList of `node`.
*/

function removeClass(string, node) {
	classes(node).remove(string);
}

function requestFrame(n, fn) {
	// Requst frames until n is 0, then call fn
	(function frame(t) {
		return n-- ?
			requestAnimationFrame(frame) :
			fn(t);
	})();
}

function frameClass(string, node) {
	var list = classes(node);
	list.add(string);

	// Chrome (at least) requires 2 frames - I guess in the first, the
	// change is painted so we have to wait for the second to undo
	requestFrame(2, () => list.remove(string));
}

/**
rect(node)

Returns a `DOMRect` object describing the draw rectangle of `node`.
(If `node` is `window` a preudo-DOMRect object is returned).
*/

function windowBox() {
	return {
		left:   0,
		top:    0,
		right:  window.innerWidth,
		bottom: window.innerHeight,
		width:  window.innerWidth,
		height: window.innerHeight
	};
}

function rect(node) {
	return node === window ?
		windowBox() :
		node.getClientRects()[0] ;
}

function offset(node1, node2) {
	var box1 = rect(node1);
	var box2 = rect(node2);
	return [box2.left - box1.left, box2.top - box1.top];
}

if (!NodeList.prototype.forEach) {
    console.warn('A polyfill for NodeList.forEach() is needed (https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach)');
}

const config = {
    // Number of pixels, or string CSS length, that a pressed pointer travels
    // before gesture is started.
    threshold: 4,

    ignoreTags: {
        textarea: true,
        input: true,
        select: true,
        button: true
    }
};

var mouseevents = {
    move:   'mousemove',
    cancel: 'mouseup dragstart',
    end:    'mouseup'
};

var touchevents = {
    // Todo: why do we need passive: false? On iOS scrolling can be blocked with
    // touch-action: none... do we want to block on any arbitrary thing that we
    // gesture on or leave it to be explicitly set in CSS?
    move:   { type: 'touchmove', passive: false },
    cancel: 'touchend',
    end:    { type: 'touchend', passive: false }
};

const assign$8 = Object.assign;

function isIgnoreTag(e) {
    var tag = e.target.tagName;
    return tag && !!config.ignoreTags[tag.toLowerCase()];
}

function identifiedTouch(touchList, id) {
    var i, l;

    if (touchList.identifiedTouch) {
        return touchList.identifiedTouch(id);
    }

    // touchList.identifiedTouch() does not exist in
    // webkit yet… we must do the search ourselves...

    i = -1;
    l = touchList.length;

    while (++i < l) {
        if (touchList[i].identifier === id) {
            return touchList[i];
        }
    }
}

function changedTouch(e, data) {
    var touch = identifiedTouch(e.changedTouches, data.identifier);

    // This isn't the touch you're looking for.
    if (!touch) { return; }

    // Chrome Android (at least) includes touches that have not
    // changed in e.changedTouches. That's a bit annoying. Check
    // that this touch has changed.
    if (touch.clientX === data.clientX && touch.clientY === data.clientY) { return; }

    return touch;
}

function preventOne(e) {
    e.preventDefault();
    e.currentTarget.removeEventListener(e.type, preventOne);
}

function preventOneClick(e) {
    e.currentTarget.addEventListener('click', preventOne);
}


// Handlers that decide when the first movestart is triggered

function mousedown(e, push, options) {
    // Ignore non-primary buttons
    if (!isPrimaryButton(e)) { return; }

    // Ignore form and interactive elements
    if (isIgnoreTag(e)) { return; }

    // Check target matches selector
    if (options.selector && !e.target.closest(options.selector)) { return; }

    // Copy event to keep target around, as it is changed on the event
    // if it passes through a shadow boundary
    var event = {
        type:          e.type,
        target:        e.target,
        currentTarget: e.currentTarget,
        clientX:       e.clientX,
        clientY:       e.clientY,
        timeStamp:     e.timeStamp
    };

    // If threshold is 0 start gesture immediately
    if (options.threshold === 0) {
        push(touches(event.target, [event]));
        return;
    }

    on(mouseevents.move, mousemove, document, [event], push, options);
    on(mouseevents.cancel, mouseend, document);
}

function mousemove(e, events, push, options){
    events.push(e);
    checkThreshold(e, events, e, mouseend, push, options);
}

function mouseend(e) {
    off(mouseevents.move, mousemove, document);
    off(mouseevents.cancel, mouseend, document);
}

function touchstart(e, push, options) {
    // Ignore form and interactive elements
    if (isIgnoreTag(e)) { return; }

    // Check target matches selector
    if (options.selector && !e.target.closest(options.selector)) { return; }

    var touch = e.changedTouches[0];

    // iOS live updates the touch objects whereas Android gives us copies.
    // That means we can't trust the touchstart object to stay the same,
    // so we must copy the data. This object acts as a template for
    // movestart, move and moveend event objects.
    var event = {
        target:     touch.target,
        clientX:    touch.clientX,
        clientY:    touch.clientY,
        identifier: touch.identifier,

        // The only way to make handlers individually unbindable is by
        // making them unique. This is a crap place to put them, but it
        // will work.
        touchmove:  function() { touchmove.apply(this, arguments); },
        touchend:   function() { touchend.apply(this, arguments); }
    };

    on(touchevents.move, event.touchmove, document, [event], push, options);
    on(touchevents.cancel, event.touchend, document, [event]);
}

function touchmove(e, events, push, options) {
    var touch = changedTouch(e, events[0]);
    if (!touch) { return; }
    checkThreshold(e, events, touch, removeTouch, push, options);
}

function touchend(e, events) {
    var touch = identifiedTouch(e.changedTouches, events[0].identifier);
    if (!touch) { return; }
    removeTouch(events);
}

function removeTouch(events) {
    off(touchevents.move, events[0].touchmove, document);
    off(touchevents.cancel, events[0].touchend, document);
}

function checkThreshold(e, events, touch, removeHandlers, push, options) {
    var distX = touch.clientX - events[0].clientX;
    var distY = touch.clientY - events[0].clientY;
    var threshold = parseValue$1(options.threshold);

    // Do nothing if the threshold has not been crossed.
    if ((distX * distX) + (distY * distY) < (threshold * threshold)) {
        return;
    }

    // Unbind handlers that tracked the touch or mouse up till now.
    removeHandlers(events);
    push(touches(events[0].target, events));
}


// Handlers that control what happens following a movestart

function activeMousemove(e, data, push) {
    data.touch = e;
    data.timeStamp = e.timeStamp;
    push(e);
}

function activeMouseend(e, data, push, stop) {
    removeActiveMouse();
    activeMousemove(e, data, push);
    stop();
}

function removeActiveMouse() {
    off(mouseevents.end, preventOneClick, document);
    off(mouseevents.move, activeMousemove, document);
    off(mouseevents.cancel, activeMouseend, document);
}

function activeTouchmove(e, data, push) {
    var touch = changedTouch(e, data);

    if (!touch) { return; }

    // Stop the interface from scrolling
    e.preventDefault();

    data.touch = touch;
    data.timeStamp = e.timeStamp;
    push(touch);
}

function activeTouchend(e, data, stop) {
    var touch  = identifiedTouch(e.changedTouches, data.identifier);

    // This isn't the touch you're looking for.
    if (!touch) { return; }

    // Neuter the resulting click event
    e.preventDefault();

    removeActiveTouch(data);
    stop();
}

function removeActiveTouch(data) {
    off(touchevents.move, data.activeTouchmove, document);
    off(touchevents.end, data.activeTouchend, document);
}

function touches(node, events) {
    return events[0].identifier === undefined ?
        Stream$1(function MouseSource(push, stop) {
            var data = {
                target: node,
                touch: undefined
            };

            // Todo: Should Stream, perhaps, take { buffer } as a source
            // property, allowing us to return any old buffer (as long as
            // it has .shift())? Or are we happy pushing in, which causes
            // a bit of internal complexity in Stream?
            push.apply(null, events);

            // We're dealing with a mouse event.
            // Stop click from propagating at the end of a move
            on(mouseevents.end, preventOneClick, document);
    
            on(mouseevents.move, activeMousemove, document, data, push);
            on(mouseevents.cancel, activeMouseend, document, data, push, stop);

            return {
                stop: function() {
                    removeActiveMouse();
                    stop();
                }
            };
        }):

        Stream$1(function TouchSource(push, stop) {
            var data = {
                target: node,
                touch: undefined,
                identifier: events[0].identifier
            };

            push.apply(null, events);

            // Track a touch
            // In order to unbind correct handlers they have to be unique
            data.activeTouchmove = function (e) { activeTouchmove(e, data, push); };
            data.activeTouchend = function (e) { activeTouchend(e, data, stop); };

            // We're dealing with a touch.
            on(touchevents.move, data.activeTouchmove, document);
            on(touchevents.end, data.activeTouchend, document);

            return {
                stop: function () {
                    removeActiveTouch(data);
                    stop();
                }
            };
        });
}

function gestures(options, node) {
    // Support legacy signature gestures(node)
    if (!node) {
        console.trace('Deprecated gestures(node), now gestures(options, node)');
    }

    options = node ?
        options ? assign$8({}, config, options) : config :
        config ;
    node = node ?
        node :
        options ;

    return new Stream$1(function(push, stop) {
        function mouseHandler(e) {
            mousedown(e, push, options);
        }

        function touchHandler(e) {
            touchstart(e, push, options);
        }

        on('mousedown', mouseHandler, node);
        on('touchstart', touchHandler, node);

        return {
            stop: function() {
                off('mousedown', mouseHandler, node);
                off('touchstart', touchHandler, node);
                stop();
            }
        };
    });
}

function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
        delete properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event$1(type, properties);
	node.dispatchEvent(event);
    return node;
}

function delegate(selector, fn) {
	// Create an event handler that looks up the ancestor tree
	// to find selector.
	return function handler(e) {
		var node = closest$1(selector, e.target, e.currentTarget);
		if (!node) { return; }
		e.delegateTarget = node;
		fn(e, node);
		e.delegateTarget = undefined;
	};
}

const keyStrings = {
	8:  'backspace',
	9:  'tab',
	13: 'enter',
	16: 'shift',
	17: 'ctrl',
	18: 'alt',
	27: 'escape',
	32: 'space',
	33: 'pageup',
	34: 'pagedown',
	35: 'pageright',
	36: 'pageleft',
	37: 'left',
	38: 'up',
	39: 'right',
	40: 'down',
	46: 'delete',
	48: '0',
	49: '1',
	50: '2',
	51: '3',
	52: '4',
	53: '5',
	54: '6',
	55: '7',
	56: '8',
	57: '9',
	65: 'a',
	66: 'b',
	67: 'c',
	68: 'd',
	69: 'e',
	70: 'f',
	71: 'g',
	72: 'h',
	73: 'i',
	74: 'j',
	75: 'k',
	76: 'l',
	77: 'm',
	78: 'n',
	79: 'o',
	80: 'p',
	81: 'q',
	82: 'r',
	83: 's',
	84: 't',
	85: 'u',
	86: 'v',
	87: 'w',
	88: 'x',
	89: 'y',
	90: 'z',
	// Mac Chrome left CMD
	91: 'cmd',
	// Mac Chrome right CMD
	93: 'cmd',
	186: ';',
	187: '=',
	188: ',',
	189: '-',
	190: '.',
	191: '/',
	219: '[',
	220: '\\',
	221: ']',
	222: '\'',
	// Mac FF
	224: 'cmd'
};

const keyCodes = Object.entries(keyStrings).reduce(function(object, entry) {
	object[entry[1]] = parseInt(entry[0], 10);
	return object;
}, {});

/**
transition(duration, fn)

Calls `fn` on each animation frame until `duration` seconds has elapsed. `fn`
is passed a single argument `progress`, a number that ramps from `0` to `1` over
the duration of the transition. Returns a function that cancels the transition.

```
transition(3, function(progress) {
    // Called every frame for 3 seconds
});
```
*/

const performance           = window.performance;
const requestAnimationFrame$1 = window.requestAnimationFrame;
const cancelAnimationFrame$1  = window.cancelAnimationFrame;

function transition(duration, fn) {
	var t0 = performance.now();

	function frame(t1) {
		// Progress from 0-1
		var progress = (t1 - t0) / (duration * 1000);

		if (progress < 1) {
			if (progress > 0) {
				fn(progress);
			}
			id = requestAnimationFrame$1(frame);
		}
		else {
			fn(1);
		}
	}

	var id = requestAnimationFrame$1(frame);

	return function cancel() {
		cancelAnimationFrame$1(id);
	};
}

function animate(duration, transform, name, object, value) {
	// denormaliseLinear is not curried! Wrap it.
    const startValue = object[name];
	return transition(
		duration,
		pipe(transform, (v) => linear$1(startValue, value, v), set$1(name, object))
	);
}

function isValid(node) {
	return node.validity ? node.validity.valid : true ;
}

function validate(node) {
    return node.checkValidity ? node.checkValidity() : true ;
}

const define$2 = Object.defineProperties;

define$2({
    left: 0
}, {
    right:  { get: function() { return window.innerWidth; }, enumerable: true, configurable: true },
    top:    { get: function() { return style('padding-top', document.body); }, enumerable: true, configurable: true },
    bottom: { get: function() { return window.innerHeight; }, enumerable: true, configurable: true }
});

if (window.console && window.console.log) {
    window.console.log('%cdom%c         – https://stephen.band/dom', 'color: #3a8ab0; font-weight: 600;', 'color: inherit; font-weight: 400;');
}
const before$1  = curry(before, true);
const after$1   = curry(after, true);
const replace$1 = curry(replace, true);
const addClass$1    = curry(addClass, true);
const removeClass$1 = curry(removeClass, true);
const frameClass$1  = curry(frameClass, true);
const offset$1 = curry(offset, true);
const style$1 = curry(style, true);
const events$1 = curry(events, true);
const trigger$1 = curry(trigger, true);
const delegate$1 = curry(delegate, true);
const animate$1 = curry(animate, true);
const transition$1 = curry(transition, true);

const config$1 = {
    simulatedEventDelay: 0.08,
    keyClass:   'key-device',
    mouseClass: 'mouse-device',
    touchClass: 'touch-device'
};

var list       = classes(document.documentElement);
var currentClass, timeStamp;

function updateClass(newClass) {
    // We are already in mouseClass state, nothing to do
    if (currentClass === newClass) { return; }
    list.remove(currentClass);
    list.add(newClass);
    currentClass = newClass;
}

function mousedown$1(e) {
    // If we are within simulatedEventDelay of a touchend event, ignore
    // mousedown as it's likely a simulated event. Reset timeStamp to
    // gaurantee that we only block one mousedown at most.
    if (e.timeStamp < timeStamp + config$1.simulatedEventDelay * 1000) { return; }
    timeStamp = undefined;
    updateClass(config$1.mouseClass);
}

function keydown(e) {
    // If key is not tab, enter or escape do nothing
    if ([9, 13, 27].indexOf(e.keyCode) === -1) { return; }
    updateClass(config$1.keyClass);
}

function touchend$1(e) {
    timeStamp = e.timeStamp;
    updateClass(config$1.touchClass);
}

document.addEventListener('mousedown', mousedown$1);
document.addEventListener('keydown', keydown);
document.addEventListener('touchend', touchend$1);

var location  = window.location;
var id$1        = location.hash;

var store     = new WeakMap();

var apply$1 = curry(function apply(node, fn) {
	return fn(node);
});

const config$2 = {
	activeClass: 'active',
	onClass:     'on',
	cache:       true
};

const matchers = [];
const handlers = [];


function findButtons(id) {
	return query('[href$="#' + id + '"]', document.body)
	.filter(overload(tag, {
		a:       isInternalLink,
		default: function() { return true; }
	}))
	.concat(query('[data-href="#' + id + '"]', document));
}

function getData(node) {
	var data = store.get(node);
	if (!data) {
		data = {};
		store.set(node, data);
	}
	return data;
}

function cacheData(target) {
	var data = getData(target);
	var id   = target.id;

	if (!data.node) { data.node = target; }
	if (!data.buttons) { data.buttons =  id && findButtons(id); }

	return data;
}

function getButtons(data) {
	return ( data.buttons) || (data.node.id && findButtons(data.node.id));
}

// Listen to activate events

function defaultActivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already active
	if (data.active) { return; }
	data.active = true;
	this.preventDefault();

	classes(data.node).add(config$2.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).add(config$2.onClass);
		});
	}
}

function defaultDeactivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already inactive
	if (!data.active) { return; }
	data.active = false;
	this.preventDefault();

	classes(data.node).remove(config$2.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).remove(config$2.onClass);
		});
	}
}

/*
dom-activate

<p>When a <code>dom-activate</code> event is triggered on an element
with a behaviour attribute, and if that event bubbles to
<code>document</code> without being prevented&hellip;</p>

<ol>
    <li>the class <code>active</code> is added to the target</li>
    <li>the class <code>on</code> is added to all links that
    reference the element by hash ref</li>
</ol>

<p>To programmatically activate a `popable`, `toggleable` or
`switchable`:</p>

```trigger('dom-activate', element);```
*/

on('dom-activate', function(e) {
	if (e.defaultPrevented) { return; }

	var data = cacheData(e.target);

	// Don't do anything if elem is already active
	if (data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultActivate;
}, document);

/*
dom-deactivate

<p>When a <code>dom-deactivate</code> event is triggered on an
element with a behaviour attribute, and if that event bubbles to
<code>document</code> without being prevented&hellip;</p>

<ol>
    <li>the class <code>active</code> is removed from the target</li>
    <li>the class <code>on</code> is removed from all links that
    reference the element by hash ref</li>
</ol>

<p>To programmatically deactivate a `popable`, `toggleable` or
`switchable`:</p>

```trigger('dom-deactivate', element);```
*/

on('dom-deactivate', function(e) {
	if (e.defaultPrevented) { return; }
	var data = cacheData(e.target);

	// Don't do anything if elem is already inactive
	if (!data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultDeactivate;
}, document);


// Listen to clicks

var triggerActivate = trigger$1('dom-activate');

var nodeCache = {};

var dialogs = {};

var targets = {
	dialog: function(e) {
		var href = e.delegateTarget.getAttribute('data-href') || e.delegateTarget.hash || e.delegateTarget.href;

		//Todo: more reliable way of getting id from a hash ref
		var id = href.substring(1);
		var fragment;

//			if (!id) { return loadResource(e, href); }

//			if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
//				id = parts[1];
//			}

		var node = nodeCache[id] || (nodeCache[id] = document.getElementById(id));

//			if (!node) { return loadResource(e, href); }

		e.preventDefault();

		// If the node is html hidden inside a text/html script tag,
		// extract the html.
		if (node.getAttribute && node.getAttribute('type') === 'text/html') {
			// Todo: trim whitespace from html?
			fragment = create$1('fragment', node.innerHTML);
		}

		// If it's a template...
		if (node.tagName && node.tagName.toLowerCase() === 'template') {
			// If it is not inert (like in IE), remove it from the DOM to
			// stop ids in it clashing with ids in the rendered result.
			if (!node.content) { remove$2(node); }
			fragment = fragmentFromContent(node);
		}

		var dialog = dialogs[id] || (dialogs[id] = createDialog(fragment));
		events$1.trigger(dialog, 'dom-activate');
	}
};

//	var rImage   = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
//	var rYouTube = /youtube\.com/;

function createDialog(content) {
	var layer = create$1('div', { class: 'dialog-layer layer' });
	var dialog = create$1('div', { class: 'dialog popable' });
	var button = create$1('button', { class: 'close-thumb thumb' });

	append$2(dialog, content);
	append$2(layer, dialog);
	append$2(layer, button);
	append$2(document.body, layer);

	return dialog;
}

//	function loadResource(e, href) {
//		var link = e.currentTarget;
//		var path = link.pathname;
//		var node, elem, dialog;
//
//		if (rImage.test(link.pathname)) {
//			e.preventDefault();
//			img = new Image();
//			dialog = createDialog();
//			var classes = dom.classes(dialog);
//			classes.add('loading');
//			dom.append(dialog, img);
//			on(img, 'load', function() {
//				classes.remove('loading');
//			});
//			img.src = href;
//			return;
//		}
//
//		if (rYouTube.test(link.hostname)) {
//			e.preventDefault();
//
//			// We don't need a loading indicator because youtube comes with
//			// it's own.
//			elem = dom.create('iframe', {
//				src:             href,
//				class:           "youtube_iframe",
//				width:           "560",
//				height:          "315",
//				frameborder:     "0",
//				allowfullscreen: true
//			});
//
//			node = elem[0];
//			elem.dialog('lightbox');
//			return;
//		}
//	}

function preventClick(e) {
	// Prevent the click that follows the mousedown. The preventDefault
	// handler unbinds itself as soon as the click is heard.
	if (e.type === 'mousedown') {
		on('click', function prevent(e) {
			off('click', prevent, e.currentTarget);
			e.preventDefault();
		}, e.currentTarget);
	}
}

function isIgnorable(e) {
	// Default is prevented indicates that this link has already
	// been handled. Save ourselves the overhead of further handling.
	if (e.defaultPrevented) { return true; }

	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	if (!isPrimaryButton(e)) { return true; }

	// Ignore key presses other than the enter key
	if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
}

function getHash(node) {
	return (isDefined(node.hash) ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function sum$1(total, n) {
    return total + !!n;
}

function activateHref(e) {
	if (isIgnorable(e)) { return; }

	// Check whether the link points to something on this page
	if (e.delegateTarget.hostname && !isInternalLink(e.delegateTarget)) { return; }

	// Does it point to an id?
	var id = getHash(e.delegateTarget);
	if (!id) { return; }

	// Does it point to a node?
	var node = document.getElementById(id);
	if (!node) { return; }

    // Is the node handleable
    var handleCount = handlers.map(apply$1(node)).reduce(sum$1, 0);
	if (handleCount) {
        e.preventDefault();
        return;
    }

	// Is the node activateable?
	if (!matchers.find(apply$1(node))) { return; }

	e.preventDefault();

	if (e.type === 'mousedown') {
		preventClick(e);
	}

	// TODO: This doesnt seem to set relatedTarget
	// trigger(node, 'dom-activate', { relatedTarget: e.delegateTarget });
	var a = Event$1('dom-activate', { relatedTarget: e.delegateTarget });
	node.dispatchEvent(a);
}

function activateTarget(e) {
	var target = e.delegateTarget.target;

	if (isIgnorable(e)) { return; }

	// If the target is not listed, ignore
	if (!targets[target]) { return; }
	return targets[target](e);
}

// Clicks on buttons toggle activate on their hash
on('click', delegate$1('a[href]', activateHref), document);

// Clicks on buttons toggle activate on their targets
on('click', delegate$1('a[target]', activateTarget), document);

// Document setup
ready$1(function() {
	// Setup all things that should start out active
	query('.' + config$2.activeClass, document).forEach(triggerActivate);
});

on('load', function() {
	// Activate the node that corresponds to the hashref in
	// location.hash, checking if it's an alphanumeric id selector
	// (not a hash bang, which google abuses for paths in old apps)
	if (!id$1 || !(/^#\S+$/.test(id$1))) { return; }

	// Catch errors, as id may nonetheless be an invalid selector
	try {
		query(id$1, document).forEach(triggerActivate);
	}
	catch(e) {
		console.warn('dom: Cannot activate ' + id$1, e.message);
	}
}, window);

/**
toggleable

An element with the `toggleable` attribute is activated and deactivated when
a link that references it is clicked.

An active `toggleable` has the class `"active"`, and links to it have the
class `"on"`.

With a little hide/show style, a toggleable can be used to make menus, drawers,
accordions and so on.
**/

// Define

var match = matches$2('.toggleable, [toggleable]');

// Functions

var actives = [];

function getHash$1(node) {
	return (node.hash ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function click(e) {
	// A prevented default means this link has already been handled.
	if (e.defaultPrevented) { return; }
	if (!isPrimaryButton(e)) { return; }

	var node = closest$1('a[href]', e.target);
	if (!node) { return; }
	if (node.hostname && !isInternalLink(node)) { return; }

	// Does it point to an id?
	var id = getHash$1(node);
	if (!id) { return; }
	if (actives.indexOf(id) === -1) { return; }

	trigger$1({
        type: 'dom-deactivate',
		relatedTarget: node
	}, get$2(id));

	e.preventDefault();
}

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	actives.push(identify(target));
	e.default();
}

function deactivate(e, data, fn) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	remove$1(actives, target.id);
	e.default();
}

on('click', click, document.documentElement);
on('dom-activate', activate, document);
on('dom-deactivate', deactivate, document);

matchers.push(match);

var match$1   = matches$2('.popable, [popable]');
var timeStamp$1 = 0;

function activate$1(e) {
    // Use method detection - e.defaultPrevented is not set in time for
    // subsequent listeners on the same node
    if (!e.default) { return; }

    const node = e.target;
    if (!match$1(node)) { return; }

    // Make user actions outside node deactivate the node

    requestAnimationFrame(function() {
        function click(e) {
            // Ignore clicks that follow clicks with the same timeStamp – this
            // is true of clicks simulated by browsers on inputs when a label
            // with a corresponding for="id" is clicked. In old Safari the order
            // of thiese simulations with respoect to input and change events
            // does not match other browsers and in rare cases causing Sparky
            // to redo it's rendering
            if (e.timeStamp === timeStamp$1) { return; }
            timeStamp$1 = e.timeStamp;

            if (node.contains(e.target) || node === e.target) { return; }
            trigger$1('dom-deactivate', node);
        }

        function deactivate(e) {
            if (node !== e.target) { return; }
            if (e.defaultPrevented) { return; }
            document.removeEventListener('click', click);
            document.documentElement.removeEventListener('dom-deactivate', deactivate);
        }

        document.addEventListener('click', click);
        document.documentElement.addEventListener('dom-deactivate', deactivate);
    });

    e.default();
}

function deactivate$1(e) {
    if (!e.default) { return; }

    var target = e.target;
    if (!match$1(target)) { return; }
    e.default();
}

document.addEventListener('dom-activate', activate$1);
document.addEventListener('dom-deactivate', deactivate$1);
matchers.push(match$1);

/**
element.scrollIntoView()

Monkey patches Element.scrollIntoView to support smooth scrolling options.
https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
**/

// Duration and easing of scroll animation
const config$3 = {
    scrollDuration: 0.3,
    scrollDurationPerHeight: 0.125,
    scrollTransform: expOut(3)
};

let cancel = noop;

function scrollToNode(target, scrollParent, behavior) {
    const style             = getComputedStyle(scrollParent);
    const scrollPaddingLeft = parseInt(style.scrollPaddingLeft, 10);
    const scrollPaddingTop  = parseInt(style.scrollPaddingTop, 10);
    const coords            = offset(scrollParent, target);
    const scrollWidth       = scrollParent.scrollWidth;
    const scrollHeight      = scrollParent.scrollHeight;

    const scrollBoxWidth = scrollParent === document.body ?
        // We cannot guarantee that body height is 100%. Use the window
        // innerHeight instead.
        window.innerWidth :
        rect(scrollParent).width ;

    const scrollBoxHeight = scrollParent === document.body ?
        // We cannot guarantee that body height is 100%. Use the window
        // innerHeight instead.
        window.innerHeight :
        rect(scrollParent).height ;

    const left = (coords[0] - scrollPaddingLeft) > (scrollWidth - scrollBoxWidth) ?
            scrollWidth - scrollBoxWidth :
            (scrollParent.scrollLeft + coords[0] - scrollPaddingLeft) ;

    const top = (coords[1] - scrollPaddingTop) > (scrollHeight - scrollBoxHeight) ?
        scrollHeight - scrollBoxHeight :
        (scrollParent.scrollTop + coords[1] - scrollPaddingTop) ;

    cancel();

    const scrollLeft = left < 0 ?
        0 :
    left > scrollWidth - scrollBoxWidth ?
        scrollWidth - scrollBoxWidth :
    left ;

    const scrollTop = top < 0 ?
        0 :
    top > scrollHeight - scrollBoxHeight ?
        scrollHeight - scrollBoxHeight :
    top ;

    if (behavior === 'smooth') {
        //const scrollDuration = config.scrollDuration
        //    + config.scrollDurationPerHeight
        //    * Math.abs(scrollTop - scrollParent.scrollTop)
        //    / scrollBoxHeight ;

        cancel = animate(0.3, config$3.scrollTransform, 'scrollLeft', scrollParent, scrollLeft);
        //cancel = animate(scrollDuration, config.scrollTransform, 'scrollTop', scrollParent, scrollTop);
    }
    else {
        scrollParent.scrollLeft = scrollLeft ;
        scrollParent.scrollTop  = scrollTop ;
    }
}

if (!features.scrollBehavior) {
    console.log('Polyfilling Element.scrollIntoView(options).');

    // Get the method from HTMLElement - in some browsers it is here rather
    // than on Element
    const constructor    = 'scrollIntoView' in Element.prototype ? Element : HTMLElement ;
    const scrollIntoView = constructor.scrollIntoView;

    constructor.prototype.scrollIntoView = function(options) {
        if (typeof options === 'object') {
            if (options.block && options.block !== 'start') {
                console.warn('Element.scrollIntoView polyfill only supports options.block value "start"');
            }

            if (options.inline && options.inline !== 'start') {
                console.warn('Element.scrollIntoView polyfill only supports options.inline value "start"');
            }

            let scrollParent;

            // Where this has been slotted into a shadow DOM that acts as a 
            // scroll parent we won't find it by traversing the DOM up. To 
            // mitigate pass in a decidedly non-standard  scrollParent option.
            if (options.scrollParent) {
                scrollParent = options.scrollParent;
            }
            else {
                scrollParent = this;
    
                while((scrollParent = scrollParent.parentNode)) {
                    if (scrollParent === document.body || scrollParent === document.documentElement) {
                        scrollParent = document.scrollingElement;
                        break;
                    }
    
                    if (scrollParent.scrollHeight > scrollParent.clientHeight 
                     || scrollParent.scrollWidth > scrollParent.clientWidth) {
                        break;
                    }
                }
            }

            scrollToNode(this, scrollParent, options.behavior);
        }
        else {
            scrollIntoView.apply(this, arguments);
        }
    };
}

const selector = ".locateable, [locateable]";
const byTop    = by$1(get$1('top'));
const nothing$3  = {};
const scrollOptions = {
    // Overridden on window load
    behavior: 'auto',
    block: 'start'
};

const config$4 = {
    scrollIdleDuration: 0.18
};

let hashTime     = 0;
let frameTime    = -Infinity;
let scrollLeft   = document.scrollingElement.scrollLeft;
let scrollTop$1    = document.scrollingElement.scrollTop;
let locateables, locatedNode, scrollPaddingLeft, scrollPaddingTop, frame;


function queryLinks(id) {
	return query('a[href$="#' + id + '"]', document.body)
	.filter(isInternalLink);
}

function addOn(node) {
    node.classList.add('on');
}

function removeOn(node) {
    node.classList.remove('on');
}

function locate(node) {
    node.classList.add('located');
    queryLinks(node.id).forEach(addOn);
    locatedNode = node;
}

function unlocate() {
    if (!locatedNode) { return; }
    locatedNode.classList.remove('located');
    queryLinks(locatedNode.id).forEach(removeOn);
    locatedNode = undefined;
}

function update$3(time) {
    frame = undefined;

    // Update things that rarely change only when we have not updated recently
    if (frameTime < time - config$4.scrollIdleDuration * 1000) {
        locateables = query(selector, document);
        // Default to 0 for browsers (IE, Edge) that do not 
        // support scrollPaddingX
        scrollPaddingLeft = parseInt(getComputedStyle(document.documentElement).scrollPaddingLeft, 10) || 0;
        scrollPaddingTop  = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 0;
    }

    frameTime = time;

    const boxes = locateables.map(rect).sort(byTop);
    let  n = -1;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if (boxes[n].top > scrollPaddingTop + 1) {
            break;
        }
    }

    --n;

    // Before the first or after the last locateable. (The latter
    // should not be possible according to the above while loop)
    if (n < 0 || n >= boxes.length) {
        if (locatedNode) {
            unlocate();
            window.history.replaceState(nothing$3, '', '#');
        }

        return;
    }

    var node = locateables[n];

    if (locatedNode && node === locatedNode) {
        return;
    }

    unlocate();
    locate(node);
    window.history.replaceState(nothing$3, '', '#' + node.id);
    trigger$1('hashchange', window);
}

function scroll$1(e) {

    // Keep a record of scrollTop in order to restore it in Safari,
    // where popstate and hashchange are preceeded by a scroll jump
    scrollLeft = document.scrollingElement.scrollLeft;
    scrollTop$1  = document.scrollingElement.scrollTop;

    const aMomentAgo = e.timeStamp - config$4.scrollIdleDuration * 1000;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (e.type === 'scroll' && hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    // Is frame already cued?
    if (frame) {
        return;
    }

    frame = requestAnimationFrame(update$3);
}

const store$1 = weakCache(function(node) {
    return {
        node: node
    };
});

function updateElement(time, data) {
    data.frame = undefined;

    // Update things that rarely change only when we have not updated recently
    if (frameTime < time - config$4.scrollIdleDuration * 1000) {
        data.box               = rect(data.node);
        data.locateables       = query(selector, data.node);

        // scrollPaddingN may compute to "auto", which parses as NaN.
        // Default to 0.
        data.scrollPaddingLeft = parseInt(getComputedStyle(data.node).scrollPaddingLeft, 10) || 0;
        data.scrollPaddingTop  = parseInt(getComputedStyle(data.node).scrollPaddingTop, 10) || 0;
    }

    frameTime = time;

    const boxes = data.locateables.map(rect).sort(byTop);
    let n = -1;
    let node;

    while (boxes[++n]) {
        // Stop on locateable lower than the break
        if ((boxes[n].top - data.box.top) > data.scrollPaddingTop + 1
        || (boxes[n].left - data.box.left) > data.scrollPaddingLeft + 1) {
            break;
        }

        node = data.locateables[n];
    }

    // Check that node and locateNode are different before continueing
    if (node === locatedNode) {
        return;
    }

    // Before the first or after the last locateable. (The latter
    // should not be possible according to the above while loop)
    unlocate();

    if (node) {
        locate(node);
        window.history.replaceState(nothing$3, '', '#' + node.id);
        trigger$1('hashchange', window);
        return;
    }

    window.history.replaceState(nothing$3, '', '#');
}

function scrollElement(e) {
    if (e.target === document) {
        return false;
    }

    const data = store$1(e.target);

    // Keep a record of scrollTop in order to restore it in Safari,
    // where popstate and hashchange are preceeded by a scroll jump
    data.scrollLeft = e.target.scrollLeft;
    data.scrollTop  = e.target.scrollTop;

    const aMomentAgo = e.timeStamp - config$4.scrollIdleDuration * 1000;

    // For a moment after the last hashchange dont update while
    // smooth scrolling settles to the right place.
    if (hashTime > aMomentAgo) {
        hashTime = e.timeStamp;
        return;
    }

    // Is frame already cued?
    if (data.frame) { return; }

    // Cue an update
    data.frame = requestAnimationFrame((time) => updateElement(time, data));
}

function restoreScroll(node) {
    var scrollParent = node;

    while ((scrollParent = scrollParent.parentNode)) {
        if (scrollParent === document.body || scrollParent === document.documentElement) {
            // Todo: generalise scrollingElement to use data object too
            document.scrollingElement.scrollLeft = scrollLeft;
            document.scrollingElement.scrollTop  = scrollTop$1;
            return;
        }

        if (scrollParent.scrollHeight > scrollParent.clientHeight) {
            break;
        }
    }

    var data = store$1(scrollParent);

    scrollParent.scrollLeft = data.scrollLeft;
    scrollParent.scrollTop  = data.scrollTop;
}

function popstate(e) {

    // Record the timeStamp
    hashTime = e.timeStamp;

    // Remove current located
    unlocate();

    const hash = window.location.hash;
    const id   = hash.slice(1);

    if (!id) {
        if (!features.scrollBehavior) {
            // In Safari, popstate and hashchange are preceeded by scroll jump -
            // restore previous scrollTop.
            restoreScroll(document.body);

            // Then animate
            document.body.scrollIntoView(scrollOptions);
        }

        return;
    }

    // Is there a node with that id?
    const node = document.getElementById(id);
    if (!node) { return; }

    // The page is on the move
    locate(node);

    // Implement smooth scroll for browsers that do not have it
    if (!features.scrollBehavior) {
        // In Safari, popstate and hashchange are preceeded by scroll jump -
        // restore previous scrollTop.
        restoreScroll(node);

        // Then animate
        node.scrollIntoView(scrollOptions);
    }
}

function load(e) {
    // Is there a node with that id?
    const node = document.getElementById(window.location.hash.slice(1));
    if (node) {
        node.scrollIntoView(scrollOptions);
    }

    popstate(e);
    scroll$1(e);

    // Start listening to popstate and scroll
    window.addEventListener('popstate', popstate);
    window.addEventListener('scroll', scroll$1);

    // Capture scroll events in capture phase, as scroll events from elements
    // other than document do not bubble
    window.addEventListener('scroll', scrollElement, true);

    // Scroll smoothly from now on
    scrollOptions.behavior = 'smooth';
}

window.addEventListener('load', load);

var isValidateable = matches$2('.validateable, .validateable input, .validateable textarea, .validateable select, [validateable], [validateable] input, [validateable] textarea, [validateable] select');

var types$1 = {
	patternMismatch: 'pattern',
	rangeOverflow:   'max',
	rangeUnderflow:  'min',
	stepMismatch:    'step',
	tooLong:         'maxlength',
	typeMismatch:    'type',
	valueMissing:    'required'
};

const config$5 = {
    // Class added to labels displaying errors
	errorLabelClass: 'error-label',

	// Class added to validated nodes (note: not valid nodes, necessarily,
	// but nodes that have been validated at least once).
	validatedInputClass:  'validated',

	// Prefix for input attributes containing node specific validation messages.
    // Example: data-validation-max="You have gone too far"
    messageAttributePrefix: 'data-validation-',

	// Global object for validation messages, overiding the browser defaults.
	messages: {
		// pattern:
		// max:
		// min:
		// step:
		// maxlength:
		// type:
		// required:
	},

    // Given an input, select or textarea (that may have been augmented in some
    // way such that it is not the node that an error should be attached to),
    // selectNode() should return the node that the error should follow.
    selectNode: id
};

function negate(fn) {
	return function() {
		return !fn.apply(this, arguments);
	};
}

function isShowingMessage(input) {
    var node = config$5.selectNode(input);
	return node.nextElementSibling
		&& matches$2('.' + config$5.errorLabelClass.trim().split(/\s+/).join('.'), node.nextElementSibling);
}

function toError(node) {
	var validity = node.validity;
	var prefix   = config$5.messageAttributePrefix;
	var messages = config$5.messages;
	var name;

	for (name in validity) {
		if (name !== 'valid' && validity[name]) {
			return {
				type: name,
				attr: types$1[name],
				name: node.name,
				text: (prefix && node.getAttribute(prefix + types$1[name]))
					|| (messages && messages[types$1[name]])
					|| node.validationMessage,
				node: node
			};
		}
	}
}

function renderError(error) {
	var input = error.node;
    var node  = config$5.selectNode(input);

	// Find the last error
	while (node.nextElementSibling && matches$2('.' + config$5.errorLabelClass.trim().split(/\s+/).join('.'), node.nextElementSibling)) {
		node = node.nextElementSibling;
	}

	var label = create$1('label', {
		textContent: error.text,
		for:         input.id,
		class:       config$5.errorLabelClass
	});

	after$1(node, label);

	if (error.type === 'customError') {
		input.setCustomValidity(error.text);

		events$1('input', input)
		.take(1)
		.each(function(e) {
			e.target.setCustomValidity('');
		});
	}
}

function addValidatedClass(input) {
	classes(input).add(config$5.validatedInputClass);
}

function removeMessages(input) {
	var node = config$5.selectNode(input);

	while ((node = next(node)) && matches$2('.' + config$5.errorLabelClass.trim().split(/\s+/).join('.'), node)) {
		remove$2(node);
	}
}

events$1('input dom-update', document)
.map(get$1('target'))
.filter(isValidateable)
// This came from somewhere - is it for nullifying custom messages? Todo: review.
.tap(invoke$1('setCustomValidity', ['']))
.filter(isValid)
.each(removeMessages);

events$1('focusout', document)
.map(get$1('target'))
.filter(isValidateable)
.each(validate);

events$1('submit', document)
.map(get$1('target'))
.filter(isValidateable)
.each(addValidatedClass);

// Add event in capture phase
document.addEventListener(
	'invalid',

	// Push to stream
	Stream$1.of()
	.map(get$1('target'))
	.filter(isValidateable)
	.tap(addValidatedClass)
	.filter(negate(isShowingMessage))
	.map(toError)
	.each(renderError)
	.push,

	// Capture phase
	true
);

var selector$1     = '.switch-label';
var swipeRangePx = 40;

function switchState(label) {
    var id = attribute$1('for', label);
    var input = document.getElementById(id);
    return input.checked;
}

function switchOn(label) {
    var id = attribute$1('for', label);
    var input = document.getElementById(id);
    if (input.checked) { return; }
    input.checked = true;
    trigger$1('change', input);
}

function switchOff(label) {
    var id = attribute$1('for', label);
    var input = document.getElementById(id);
    if (!input.checked) { return; }
    input.checked = false;
    trigger$1('change', input);
}

gestures({ selector: selector$1, threshold: 4 }, document)
.each(function(events) {
    // First event is touchstart or mousedown
    var e0     = events.shift();
    var latest = events.latest();
    var e1     = latest.shift();
    var x0     = e0.clientX;
    var y0     = e0.clientY;
    var x1     = e1.clientX;
    var y1     = e1.clientY;

    // If the gesture is more vertical than horizontal, don't count it
    // as a swipe. Stop the stream and get out of here.
    if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
        events.stop();
        return;
    }

    var label = closest$1(selector$1, e0.target);
    var state = switchState(label);
    var x = state ? 1 : 0 ;
    var dx;

    label.classList.add('no-select');
    label.classList.add('gesturing');

    latest.each(function (e) {
        dx = e.clientX - x0;

        var rx = clamp$1(0, 1, x + dx / swipeRangePx);
        label.style.setProperty('--switch-handle-gesture-x', rx);

        if (rx >= 0.666667 && !state) {
            state = true;
            switchOn(label);
        }
        else if (rx < 0.666667 && state) {
            state = false;
            switchOff(label);
        }
    })
    .done(function() {
        label.classList.remove('no-select');
        label.classList.remove('gesturing');
        label.style.removeProperty('--switch-handle-gesture-x');
    });
});

/**
switchable

A `switchable` is given the class `"active"` when a link that references
it is clicked, and all links to it are given the class `"on"`. In any group of
siblings with the `switchable` attribute, exactly one is always active.

Switchables can be used to make tabs, slideshows, accordions and so on.

```html
<nav>
    <a class="tab-button button on" href="#tab-1">1</a>
    <a class="tab-button button" href="#tab-2">2</a>
    <a class="tab-button button" href="#tab-3">3</a>
</nav>

<section class="tab-block block active" switchable id="tab-1">
    Tab 1
</section>

<section class="tab-block block" switchable id="tab-2">
    Tab 2
</section>

<section class="tab-block block" switchable id="tab-3">
    Tab 3
</section>
```
**/

// Define

var match$2   = matches$2('.switchable, [switchable]');
var triggerDeactivate = trigger$1('dom-deactivate');

function activate$2(e) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match$2(target)) { return; }

	var nodes = children(target.parentNode).filter(match$2);
	var i     = nodes.indexOf(target);

	nodes.splice(i, 1);
	var active = nodes.filter(matches$2('.active'));

	e.default();

	// Deactivate the previous active pane AFTER this pane has been
	// activated. It's important for panes who's style depends on the
	// current active pane, eg: .slide.active ~ .slide
	active.forEach(triggerDeactivate);
}

function deactivate$2(e) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match$2(target)) { return; }

	e.default();
}

on('dom-activate', activate$2, document);
on('dom-deactivate', deactivate$2, document);
matchers.push(match$2);

const selector$2 = '.swipeable, [swipeable]';

var trigger$2  = events$1.trigger;
var tau      = Math.PI * 2;

var elasticDistance = 800;

var rspaces$1 = /\s+/;

function elasticEase(n) {
	return Math.atan(n) / Math.PI ;
}

function xMinFromChildren(node) {
	var child = last(children(node).filter(matches$2('.switchable, [switchable]')));

	// Get the right-most x of the last switchable child's right-most edge
	var w1 = child.offsetLeft + child.clientWidth;
	var w2 = node.parentNode.clientWidth;
	return w2 - w1;
}

function swipe(node, angle) {
	angle = wrap$1(0, tau, angle || 0);

	// If angle is rightwards
	var prop = (angle > tau * 1 / 8 && angle < tau * 3 / 8) ?
		'previousElementSibling' :
		// If angle is leftwards
		(angle > tau * 5 / 8 && angle < tau * 7 / 8) ?
			'nextElementSibling' :
			false;

	if (!prop) { return; }

	var kids = children(node);

	// it is entirely possible there are no active children – the initial
	// HTML may not specify an active child – in which case we assume the
	// first child is displayed
	var active = kids.find(matches$2('.active')) || kids[0];

	if (active[prop]) {
		trigger$2(active[prop], 'dom-activate');
	}
	else {
		transform(node, active);
	}
}

function transform(node, active) {
	var l1 = rect(node).left;
	var l2 = rect(active).left;

	// Round the translation - without rounding images and text become
	// slightly fuzzy as they are antialiased.
	var l  = Math.round(l1 - l2 - style$1('margin-left', active));
	node.style.transform = 'translate3d(' + l + 'px, 0px, 0px)';
}

function update$4(swipeable, node) {
	var pos = rect(node);

	// node may not be visible, in which case we can't update
	if (!pos) { return; }

	var l1 = pos.left;
	var l2 = rect(swipeable).left;
	var l  = l1 - l2 - style$1('margin-left', node);

	swipeable.style.transform = 'translate3d(' + (-l) + 'px, 0px, 0px)';
}


gestures({ selector: selector$2, threshold: 4 }, document)
.each(function touch(stream) {
	// First event is touchstart or mousedown
	var e = stream.shift();

	if (e.defaultPrevented) { return; }

	var node = closest$1(selector$2, e.target);
	var classy = classes(node);
	var transform = style$1('transform', node);

	transform = !transform || transform === 'none' ? '' : transform ;

	var x = style$1('transform:translateX', node);

	// Elastic flags and limits
	var eMin = false;
	var eMax = false;
	var xMin = attribute$1('data-slide-min', node);
	var xMax = attribute$1('data-slide-max', node);

	if (!xMin && !xMax) {
		eMin = true;
		eMax = true;
		xMin = xMinFromChildren(node);
		xMax = 0;
	}
	else {
		eMin = /elastic/.test(xMin);
		eMax = /elastic/.test(xMax);
		xMin = parseFloat(xMin) || 0;
		xMax = parseFloat(xMax) || 0;
	}

	classy.add('no-transition');

	var ax = x;
    var x0 = e.clientX;
	var y0 = e.clientY;

	// TEMP: keep it around to use the last one in .done().
	var x1, y1;

	stream.map(function(e) {
		x1 = e.clientX;
		y1 = e.clientY;

		var diffX = e.clientX - x0;
		ax = x + diffX;
		var tx = ax > 0 ?
				eMax ? elasticEase(ax / elasticDistance) * elasticDistance - x :
				xMax :
			ax < xMin ?
				eMin ? elasticEase((ax - xMin) / elasticDistance) * elasticDistance + xMin - x :
				xMin :
			diffX ;

		return transform + ' translate3d(' + tx + 'px, 0px, 0px)';
	})
	.each(set$1('transform', node.style))
	.done(function() {
		classy.remove('no-transition');

		// Todo: Watch out, this may interfere with slides
		var xSnaps = attribute$1('data-slide-snap', node);
		var tx;

		if (xSnaps) {
			xSnaps = xSnaps.split(rspaces$1).map(parseFloat);

			// Get closest x from list of snaps
			tx = xSnaps.reduce(function(prev, curr) {
				return Math.abs(curr - ax) < Math.abs(prev - ax) ?
					curr : prev ;
			});

			node.style.transform = transform + ' translate3d(' + tx + 'px, 0px, 0px)';
		}

		//var x = data.x;
		//var y = data.y;
		//var w = node.offsetWidth;
		//var h = node.offsetHeight;
		var polar = toPolar([x1 - x0, y1 - y0]);

		// Todo: check if swipe has enough velocity and distance
		//x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1
		swipe(node, polar[1]);
	});
});

on('dom-activate', function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var node   = e.target;
	var parent = node.parentNode;

	if (!matches$2(selector$2, parent)) { return; }

	var classy = classes(parent);
	classy.remove('no-transition');
	// Force recalc
	// TODO: check if this gets removed by JS minifier
	document.documentElement.clientWidth;
	e.preventDefault();
	update$4(parent, node);
}, document);

on('resize', function resize() {
	// Update swipeable positions
	query(selector$2, document).forEach(function(swipeable) {
		var node = children(swipeable).find(matches$2('.active'));
		if (!node) { return; }
		var classy = classes(swipeable);
		classy.add('no-transition');
		update$4(swipeable, node);
		// Force recalc
		// TODO: check if this gets removed by JS minifier
		document.documentElement.clientWidth;
		classy.remove('no-transition');
	});
}, window);

const maxDuration = 0.5;

function updateSlideshowHrefs(node) {
    var block = closest$1('.slides-block', node);
    if (!block) { return; }

    var prevSlide = previous(node) || last(query('.switchable', block));
    var nextSlide = next(node) || query('.switchable', block)[0];
    var prevThumb = query('.prev-thumb', block);
    var nextThumb = query('.next-thumb', block);

    prevThumb.forEach(function(node) {
        node.href = '#' + prevSlide.id;
    });

    nextThumb.forEach(function(node) {
        node.href = '#' + nextSlide.id;
    });
}

function requestFrame$1(n, fn) {
    var frame;

    function request() {
        frame = requestAnimationFrame(--n > 0 ? request : fn);
    }

    function cancel() {
        cancelAnimationFrame(frame);
    }

    request();
    return cancel;
}

function update$5(parent, node) {
    var cl = classes(parent);
    var box = rect(node);

    // Slides not visible will bork
    if (!box) { return; }

    var l1 = box.left;
    var l2 = rect(parent).left;
    var l  = l1 - l2 - style$1('margin-left', node);

    cl.add('no-transition');
    parent.style.transform = 'translate(' + (-l) + 'px, 0px)';

    // The above may not have taken place inside a frame, in which case the
    // DOM will refresh at the same time as the coming frame.. so we need
    // the frame after that to teardown.
    requestFrame$1(2, function() {
        cl.remove('no-transition');
    });
}

function shuffle(view, slides, parent, node) {
    clearTimeout(view.timer);
    events$1.off(parent, 'transitionend', view.transitionend);

    var i = slides.indexOf(node);
    var movers;

    if (i < 2) {
        movers = slides.splice(i - 2);
        movers.forEach(before$1(slides[0]));
        update$5(parent, node);
    }
    else if (i + 3 > slides.length) {
        movers = slides.splice(0, 2 - (slides.length - i - 1));
        movers.forEach(append$2(parent));
        update$5(parent, node);
    }

    // Regenerate the prev / next button hrefs
    updateSlideshowHrefs(node);
}

var getView = cache(function(parent) {
    return {};
});

// Move slides around the DOM to give the feel of a continuous slideshow
events$1('dom-activate', document)
.map(get$1('target'))
.dedup()
.filter(matches$2('.switchable, [switchable]'))
.each(function(node) {
    var parent = node.parentNode;
    var view   = getView(parent);

    if (!matches$2('.swipeable, [swipeable]', parent)) { return; }

    var slides = children(parent).filter(matches$2('.switchable, [switchable]'));

    if (slides.length < 3) {
        console.warn("Slides: Not enough slides to create 'infinite' slideshow.");
        updateSlideshowHrefs(node);
        return;
    }

    function transitionend(e) {
        if (!isTargetEvent(e)) { return; }
        shuffle(view, slides, parent, node);
    }

    clearTimeout(view.timer);
    view.timer = setTimeout(shuffle, maxDuration * 1000, view, slides, parent, node);

    events$1.off(parent, 'transitionend', view.transitionend);
    view.transitionend = transitionend;
    events$1.on(parent, 'transitionend', view.transitionend);
});

function updateBlock(block) {
    var parent = find$3('.swipeable, [swipeable]', block);
    var node   = find$3('.active', block);
    update$5(parent, node);
}

// Reposition slides when window resizes
events$1('resize', window)
.wait(0.333333)
.flatMap(function() {
    return query('.slides-block', document);
})
.each(updateBlock);

events$1('dom-activate', document.body)
.map(get$1('target'))
.filter(matches$2('.toggle-block'))
.each(function(node) {
    const box       = node.getBoundingClientRect();
    const computed  = getComputedStyle(node);
    const lastChild = last(node.children);
    const bottom    = lastChild && lastChild.getBoundingClientRect().bottom;
    const height    = parseInteger(computed.paddingBottom)
        + parseInteger(computed.borderBottomWidth)
        + bottom
        - box.top;

    node.style.maxHeight = height + 'px';

    events$1('transitionend', node)
    .each(function(e) {
        node.style.maxHeight = '';
    });
});

const measure = choose({
    // Set maxHeight equal to height
    maxHeight: (node) => node.clientHeight + 'px',

    // Set all others to their computed values
    default: (node, style, property) => style[property]
});

events$1('dom-deactivate', document.body)
.map(get$1('target'))
.filter(matches$2('.toggle-block'))
.each(function(node) {
    const style = node.getAttribute('style');
    const computed = getComputedStyle(node);

    // Warning: this gets the transition-property before the class active has
    // been removed, which is not strictly speaking the intention. Ideally we
    // want computed styles from before, and transition-property from after.
    // Computed style is a live object, though. Handling this case risks being
    // expensive. So let us assume for the time being that transition-property
    // before and after class active are the same.
    const properties = computed['transition-property']
        .split(/\s*,\s*/)
        .map(toCamelCase);

    node.style.transition = 'none';
    properties.forEach((property) => node.style[property] = measure(property, node, computed, property));

    // Wait until the next frame to prevent
    requestAnimationFrame(function() {
        // Replace initial state of style attribute, if it's null remove it
        if (style) {
            node.setAttribute('style', style);
        }
        else {
            node.removeAttribute('style');
        }
    });
});
