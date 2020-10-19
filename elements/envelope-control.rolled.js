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

var capture$1 = curry(capture, true);

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

curry(invoke, true);

const is = Object.is || function is(a, b) { return a === b; };

curry(is, true);

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

/* Observer */

const $observer = Symbol('observer');

const A$3            = Array.prototype;
const nothing$1      = Object.freeze([]);
const isExtensible = Object.isExtensible;


// Utils

function isArrayLike(object) {
	return object
	&& typeof object === 'object'
	// Slows it down a bit
	//&& object.hasOwnProperty('length')
	&& typeof object.length === 'number' ;
}


// Listeners

function getListeners(object, name) {
	return object[$observer].properties[name]
		|| (object[$observer].properties[name] = []);
}

function fire(fns, value, record) {
	if (!fns) { return; }
    fns = fns.slice(0);
	var n = -1;
	while (fns[++n]) {
        // For OO version
        //fns[n].update(value, record);
		fns[n](value, record);
	}
}


// Observer proxy

function trapGet(target, name, self) {
	// Ignore symbols
	let desc;
	return typeof name !== 'symbol'
		&& ((desc = Object.getOwnPropertyDescriptor(target, name)), !desc || desc.writable)
		&& Observer(target[name])
		|| target[name] ;
}

const arrayHandlers = {
	get: trapGet,

	set: function(target, name, value, receiver) {
		// We are setting a symbol
		if (typeof name === 'symbol') {
			target[name] = value;
			return true;
		}

		var old = target[name];
		var length = target.length;

		// If we are setting the same value, we're not really setting at all
		if (old === value) { return true; }

		var properties = target[$observer].properties;
		var change;

		// We are setting length
		if (name === 'length') {
			if (value >= target.length) {
				// Don't allow array length to grow like this
				target.length = value;
				return true;
			}

			change = {
				index:   value,
				removed: A$3.splice.call(target, value),
				added:   nothing$1,
			};

			while (--old >= value) {
				fire(properties[old], undefined);
			}
		}

		// We are setting an integer string or number
		else if (+name % 1 === 0) {
			name = +name;

			if (value === undefined) {
				if (name < target.length) {
					change = {
						index:   name,
						removed: A$3.splice.call(target, name, 1),
						added:   nothing$1
					};

					value = target[name];
				}
				else {
					return true;
				}
			}
			else {
				change = {
					index:   name,
					removed: A$3.splice.call(target, name, 1, value),
					added:   [value]
				};
			}
		}

		// We are setting some other key
		else {
			target[name] = value;
		}

		if (target.length !== length) {
			fire(properties.length, target.length);
		}

        // Notify the observer
		fire(properties[name], Observer(value) || value);

        var mutate = target[$observer].mutate;
        fire(mutate, receiver, change);

		// Return true to indicate success
		return true;
	}
};

const objectHandlers = {
	get: trapGet,

	set: function(target, name, value, receiver) {
		// If we are setting the same value, we're not really setting at all
		if (target[name] === value) { return true; }

        // Set value on target, then use that as value
		target[name] = value;
		value = target[name];

        // Notify the observer
        var properties = target[$observer].properties;
		fire(properties[name], Observer(value) || value);

        var mutate = target[$observer].mutate;
        fire(mutate, receiver, {
			name:    name,
			removed: target[name],
			added:   value
		});

		// Return true to indicate success
		return true;
	}

    //			apply: function(target, context, args) {
    //console.log('MethodProxy', target, context, args);
    //debugger;
    //				return Reflect.apply(target, context, args);
    //			}
};

function createObserver(target) {
	var observer = new Proxy(target, isArrayLike(target) ?
		arrayHandlers :
		objectHandlers
	);

	// This is strict but slow
	//define(target, $observer, {
    //    value: {
    //        observer:   observer,
    //        properties: {},
    //        mutate:     []
    //    }
    //});

	// An order of magnitude faster
	target[$observer] = {
		target:     target,
		observer:   observer,
		properties: {},
		mutate:     []
	};

	return observer;
}

function isObservable(object) {
	// Many built-in objects and DOM objects bork when calling their
	// methods via a proxy. They should be considered not observable.
	// I wish there were a way of whitelisting rather than
	// blacklisting, but it would seem not.

	return object
		// Reject primitives and other frozen objects
		// This is really slow...
		//&& !isFrozen(object)
		// I haven't compared this, but it's necessary for audio nodes
		// at least, but then only because we're extending with symbols...
		// hmmm, that may need to change...
		&& isExtensible(object)
		// This is less safe but faster.
		//&& typeof object === 'object'
		// Reject DOM nodes
		&& !Node.prototype.isPrototypeOf(object)
		// Reject WebAudio context
		&& (typeof BaseAudioContext === 'undefined' || !BaseAudioContext.prototype.isPrototypeOf(object))
		// Reject dates
		&& !(object instanceof Date)
		// Reject regex
		&& !(object instanceof RegExp)
		// Reject maps
		&& !(object instanceof Map)
		&& !(object instanceof WeakMap)
		// Reject sets
		&& !(object instanceof Set)
		&& !(window.WeakSet && object instanceof WeakSet)
		// Reject TypedArrays and DataViews
		&& !ArrayBuffer.isView(object) ;
}

///*
//notify(object, path, value)
//Force the `object`'s Observer to register a mutation at `path`. Pass in `value`
//to override the value actually at the end of the path.
//*/

function notify$1(object, path, value) {
	const observer = object[$observer];
	if (!observer) { return; }
	const fns = observer.properties;
	fire(fns[path], value === undefined ? object[path] : value);

    const mutate = observer.mutate;
	fire(mutate, object);
}

/**
Observer(object)
Create an Observer proxy around `object`. In order for `observe(...)` to detect
mutations, changes must be made to this proxy rather than the original
`object`.
**/

function Observer(object) {
	return !object ? undefined :
		object[$observer] ? object[$observer].observer :
		isObservable(object) ?
			createObserver(object) :
			undefined ;
}

/**
parseSelector(string)

Takes a string of the form '[key=value, ... ]' and returns a function isMatch
that returns true when passed an object that matches the selector.
**/

//                 1 key                 2 quote 3 value           4 comma 5 closing bracket
const rselector = /^([^\]=,\s]+)\s*(?:=\s*(['"])?([^\]=,\s]+)\2\s*)?(?:(,)|(])(\s*\.$)?)\s*/;

const fselector = {
    3: function parseValue(match, tokens) {
        match[tokens[1]] =
            tokens[2] ? tokens[3] :
            tokens[3] === 'true' ? true :
            tokens[3] === 'false' ? false :
            isFloatString(tokens[3]) ? parseFloat(tokens[3]) :
            tokens[3] ;

        return match;
    },

    4: parseSelector,

    5: function(match, tokens) {
        return function isMatch(object) {
            let key;

            for (key in match) {
                if (object[key] !== match[key]) {
                    return false;
                }
            }

            return true;
        };
    },

    6: function(match, tokens) {
        throw new Error('Observer: A path may not end with "[key=value]." ' + tokens.input);
    }
};

function isFloatString(string) {
	// Convert to float and back to string to check if it retains
	// the same value.
	const float = parseFloat(string);
	return (float + '') === string;
}

function parse(regex, fns, acc, path) {
    // If path is a regex result, get path from latest index
    const string = typeof path !== 'string' ?
        path.input.slice(path.index + path[0].length + (path.consumed || 0)) :
        path ;

    const tokens = regex.exec(string);
    if (!tokens) {
        throw new Error('Observer: Invalid path: ' + string + ' : ' + path.input);
    }

    let n = -1;
    while (++n < tokens.length) {
        acc = (tokens[n] !== undefined && fns[n]) ? fns[n](acc, tokens) : acc ;
    }

    path.consumed = tokens.index + tokens[0].length + (tokens.consumed || 0);

    return acc;
}

function parseSelector(match, path) {
    return parse(rselector, fselector, match, path);
}

function parseSelector$1(path) {
    return parse(rselector, fselector, {}, path);
}

{ window.observeCount = 0; }

const A$4       = Array.prototype;
const nothing$2 = Object.freeze([]);

//                   1 .name         [2 number  3 'quote' 4 "quote" ]
const rpath$2   = /^\.?([^.[\s]+)\s*|^\[(?:(\d+)|'([^']*)'|"([^"]*)")\]\s*|^\[\s*/;

function isPrimitive(object) {
    return !(object && typeof object === 'object');
}

function observePrimitive(primitive, data) {
	if (primitive !== data.value) {
		data.old   = data.value;
		data.value = primitive;
		data.fn(primitive);
	}

	return noop;
}

function observeMutable(object, data) {
	var fns = object[$observer].mutate;
	fns.push(data.fn);

    { ++window.observeCount; }

	if (object !== data.value) {
		data.old   = data.value;
		data.value = object;
		data.fn(object, {
			index:   0,
			removed: data.old ? data.old : nothing$2,
			added:   data.value
		});
	}

	return () => {
		remove(fns, data.fn);

        { --window.observeCount; }
	};
}

function observeSelector(object, isMatch, path, data) {
	var unobserve = noop;

	function update(array) {
		var value = array && A$4.find.call(array, isMatch);
		unobserve();
		unobserve = observeUnknown(value, path, data);
	}

	// We create an intermediate data object to go with the new update
	// function. The original data object is passed on inside update.
	var unobserveMutable = observeMutable(object, { fn: update });

	return () => {
		unobserve();
		unobserveMutable();
	};
}

function observeProperty(object, name, path, data) {
	var fns = getListeners(object, name);
	var unobserve = noop;

	function update(value) {
		unobserve();
		unobserve = observeUnknown(value, path, data);
	}

	fns.push(update);
    update(object[name]);

    { ++window.observeCount; }

	return () => {
		unobserve();
		remove(fns, update);

        { --window.observeCount; }
	};
}

function readSelector(object, isMatch, path, data) {
	var value = object && A$4.find.call(object, isMatch);
	return observeUnknown(Observer(value) || value, path, data);
}

function readProperty(object, name, path, data) {
	return observeUnknown(Observer(object[name]) || object[name], path, data);
}

function observeUnknown(object, path, data) {
    // path is ''
    if (!path.length) {
		return observePrimitive(object, data) ;
	}

    // path is '.'
    if (path === '.') {
        // We assume the full isObserver() check has been done –
        // this function is internal after all
        return object && object[$observer] ?
            observeMutable(object, data) :
            observePrimitive(object, data) ;
    }

    // Object is primitive
    if (isPrimitive(object)) {
		return observePrimitive(undefined, data);
	}

    const tokens = rpath$2.exec(path);

    if (!tokens) {
        throw new Error('Observer: Invalid path: ' + path + ' : ' + path.length);
    }

    // path is .name, [number], ['name'] or ["name"]
    const name = tokens[1] || tokens[2] || tokens[3] || tokens[4] ;

    if (name) {
        path = tokens.input.slice(tokens.index + tokens[0].length);
        return object[$observer] ?
            observeProperty(object, name, path, data) :
            readProperty(object, name, path, data) ;
    }

    const isMatch = parseSelector$1(tokens);
    path = tokens.input.slice(tokens.index + tokens[0].length + (tokens.consumed || 0));

    // path is '[key=value]'
    return object[$observer] ?
        observeSelector(object, isMatch, path, data) :
        readSelector(object, isMatch, path, data) ;
}

/**
observe(path, fn, object [, init])

Observe `path` in `object` and call `fn(value)` with the value at the
end of that path when it mutates. Returns a function that destroys this
observer.

The callback `fn` is called immediately on initialisation if the value at
the end of the path is not equal to `init`. In the default case where
`init` is `undefined`, paths that end in `undefined` do not cause the
callback to be called.

(To force the callback to always be called on setup, pass in `NaN` as an
`init` value. In JS `NaN` is not equal to anything, even `NaN`, so it
always initialises.)
**/

function observe(path, fn, object, initialValue) {
    return observeUnknown(Observer(object) || object, path + '', {
        value: initialValue,
        fn:    fn
    });
}

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

const A$5 = Array.prototype;

function insert(fn, array, object) {
    var n = -1;
    var l = array.length;
    var value = fn(object);
    while(++n < l && fn(array[n]) <= value);
    A$5.splice.call(array, n, 0, object);
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

curry(wrap);

/**
todB(level)

Converts a value to decibels relative to unity (dBFS).
**/

// A bit disturbingly, a correction factor is needed to make todB() and
// to toLevel() reciprocate more accurately. This is quite a lot to be off
// by... Todo: investigate?
const dBCorrectionFactor = (60 / 60.205999132796244);

function todB(n) {
    return 20 * Math.log10(n) * dBCorrectionFactor;
}

/**
toLevel(dB)

Converts a dB value relative to unity (dBFS) to unit value.
**/

function toGain(n) {
    return Math.pow(2, n / 6);
}

function clamp(min, max, n) {
    return n > max ? max : n < min ? min : n;
}

curry(clamp);

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

var normalise$1 = /*#__PURE__*/Object.freeze({
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

var denormalise$1 = /*#__PURE__*/Object.freeze({
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
var _exponentialOut = curry(exponentialOut);

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
const normalise$2   = curry(choose(normalise$1), false, 4);
const denormalise$2 = curry(choose(denormalise$1), false, 4);
const exponentialOut$1 = curry(_exponentialOut);



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

var node$1 = document.createElement('div');
var cache$1 = {};

function testPrefix(prop) {
    if (prop in node$1.style) { return prop; }

    var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    var l = prefixes.length;
    var prefixProp;

    while (l--) {
        prefixProp = prefixes[l] + upper;

        if (prefixProp in node$1.style) {
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


// -----------------

const A$6 = Array.prototype;
const eventsSymbol = Symbol('events');

function applyTail(fn, args) {
	return function() {
		A$6.push.apply(arguments, args);
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
	var handler = arguments.length > 3 ? applyTail(fn, A$6.slice.call(arguments, 3)) : fn ;
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

const assign$6 = Object.assign;

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
        options ? assign$6({}, config, options) : config :
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

function assign$7(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		assignProperty(names[n], node, attributes[names[n]]);
	}

	return node;
}

var assign$8 = curry(assign$7, true);

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
        return assign$8(construct(tag, ''), content);
    },

    'object string': function(properties, text) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        // Warning: text is set before properties, but text should override
        // html or innerHTML property, ie, be set after.
        return assign$8(construct(tag, text), properties);
    },

    'object object': function(properties, content) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        return assign$8(assign$8(construct(tag, ''), properties), content);
    },

    default: function() {
        throw new Error('create(tag, content) does not accept argument types "' + Array.prototype.map.call(arguments, toType).join(' ') + '"');
    }
});

var mimetypes = {
    xml: 'application/xml',
    html: 'text/html',
    svg: 'image/svg+xml'
};

function parse$1(type, string) {
    if (!string) { return; }

    var mimetype = mimetypes[type.toLowerCase()];
    var xml;

    // Cludged from jQuery source...
    try {
        xml = (new window.DOMParser()).parseFromString(string, mimetype);
    }
    catch (e) {
        return;
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid " + type.toUpperCase() + ": " + string);
    }

    return xml;
}

/**
parseHTML(string)
Returns an HTML document parsed from `string`, or undefined.
*/

function parseHTML(string) {
    return parse$1('html', string);
}

const assign$9 = Object.assign;

/*
config

```{
    headers:    fn(data),    // Must return an object with properties to add to the header
    body:       fn(data),    // Must return an object to send as data
    onresponse: function(response)
}```
*/

const config$1 = {
    // Takes data, returns headers
    headers: function(data) { return {}; },

    // Takes data (can be FormData object or plain object), returns data
    body: id,

    // Takes response, returns response
    onresponse: function(response) {
        // If redirected, navigate the browser away from here. Can get
        // annoying when receiving 404s, maybe not a good default...
        if (response.redirected) {
            window.location = response.url;
            return;
        }

        return response;
    }
};

const createHeaders = choose({
    'application/x-www-form-urlencoded': function(headers) {
        return assign$9(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'application/json': function(headers) {
        return assign$9(headers, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'multipart/form-data': function(headers) {
        return assign$9(headers, {
            "Content-Type": 'multipart/form-data',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'audio/wav': function(headers) {
        return assign$9(headers, {
            "Content-Type": 'audio/wav',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'default': function(headers) {
        return assign$9(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    }
});

const createBody = choose({
    'application/json': function(data) {
        return data.get ?
            formDataToJSON(data) :
            JSON.stringify(data);
    },

    'application/x-www-form-urlencoded': function(data) {
        return data.get ?
            formDataToQuery(data) :
            dataToQuery(data) ;
    },

    'multipart/form-data': function(data) {
        // Mmmmmhmmm?
        return data.get ?
            data :
            dataToFormData() ;
    }
});

function formDataToJSON(formData) {
    return JSON.stringify(
        // formData.entries() is an iterator, not an array
        Array
        .from(formData.entries())
        .reduce(function(output, entry) {
            output[entry[0]] = entry[1];
            return output;
        }, {})
    );
}

function formDataToQuery(data) {
    return new URLSearchParams(data).toString();
}

function dataToQuery(data) {
    return Object.keys(data).reduce((params, key) => {
        params.append(key, data[key]);
        return params;
    }, new URLSearchParams());
}

function dataToFormData(data) {
    throw new Error('TODO: dataToFormData(data)');
}

function urlFromData(url, data) {
    // Form data
    return data instanceof FormData ?
        url + '?' + formDataToQuery(data) :
        url + '?' + dataToQuery(data) ;
}

function createOptions(method, data, head, controller) {
    const contentType = typeof head === 'string' ?
        head :
        head['Content-Type'] ;

    const headers = createHeaders(contentType, assign$9(
        config$1.headers && data ? config$1.headers(data) : {},
        typeof head === 'string' ? nothing : head
    ));

    const options = {
        method:  method,
        headers: headers,
        credentials: 'same-origin',
        signal: controller && controller.signal
    };

    if (method !== 'GET') {
        options.body = createBody(contentType, config$1.body ? config$1.body(data) : data);
    }

    return options;
}

const responders = {
    'text/html': respondText,
    'application/json': respondJSON,
    'multipart/form-data': respondForm,
    'application/x-www-form-urlencoded': respondForm,
    'audio': respondBlob,
    'audio/wav': respondBlob,
    'audio/m4a': respondBlob
};

function respondBlob(response) {
    return response.blob();
}

function respondJSON(response) {
    return response.json();
}

function respondForm(response) {
    return response.formData();
}

function respondText(response) {
    return response.text();
}

function respond(response) {
    if (config$1.onresponse) {
        response = config$1.onresponse(response);
    }

    if (!response.ok) {
        throw new Error(response.statusText + '');
    }

    // Get mimetype from Content-Type, remembering to hoik off any
    // parameters first
    const mimetype = response.headers
    .get('Content-Type')
    .replace(/\;.*$/, '');

    return responders[mimetype](response);
}


/**
request(type, url, data, mimetype | headers)

Uses `fetch()` to send a request to `url`. Where `type` is `"GET"`, `data` is
serialised and appended to the URL, otherwise it is sent as a request body.
The 4th parameter may be a content type string or a headers object (in which
case it must have a `'Content-Type'` property).
**/

function request(type = 'GET', url, data, mimetype = 'application/json') {
    if (url.startsWith('application/') || url.startsWith('multipart/') || url.startsWith('text/') || url.startsWith('audio/')) {
        console.trace('request(type, url, data, mimetype) parameter order has changed. You passed (type, mimetype, url, data).');
        url      = arguments[1];
        data     = arguments[2];
        mimetype = arguments[3];
    }

    const method = type.toUpperCase();

    // If this is a GET and there is data, append data to the URL query string
    if (method === 'GET' && data) {
        url = urlFromData(url, data);
    }

    // param[4] is an optional abort controller
    return fetch(url, createOptions(method, data, mimetype, arguments[4]))
    .then(respond);
}

const requestDocument = cache(function requestDocument(path) {
    return request('GET', path)
    .then(parseHTML);
});

function requestTemplate(src) {
    const parts = src.split('#');
    const path  = parts[0] || '';
    const id    = parts[1] || '';

    if (!path) {
        throw new Error('dom requestTemplate(src) src "' + src + '" does not contain a path');
    }

    return id ?
        requestDocument(path)
        .then((doc) => doc.getElementById(id))
        .then((template) => {
            if (!template) {
                throw new Error('dom requestTemplate(src) template "' + src + '" not found in imported document');
            }

            return document.adoptNode(template);
        }) :

        requestDocument(path)
        .then((doc) => document.adoptNode(doc.body)) ;
}

const DEBUG$2 = window.DEBUG === true;

const assign$a = Object.assign;

const constructors = {
    'a':        HTMLAnchorElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'template': HTMLTemplateElement
};

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form:              { get: function() { return this[$internals].form; }},
    labels:            { get: function() { return this[$internals].labels; }},
    validity:          { get: function() { return this[$internals].validity; }},
    validationMessage: { get: function() { return this[$internals].validationMessage; }},
    willValidate:      { get: function() { return this[$internals].willValidate; }},
    checkValidity:     { value: function() { return this[$internals].checkValidity(); }},
    reportValidity:    { value: function() { return this[$internals].reportValidity(); }}
};

const onceEvent = {
    once: true
};

function getElementConstructor(tag) {
        // Return a constructor from the known list of tag names – not all tags
        // have constructor names that match their tags
    return constructors[tag]
        // Or assemble the tag name in the form "HTMLTagElement" and return
        // that property of the window object
        || window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element']
        || (() => {
            throw new Error('Constructor not found for tag "' + tag + '"');
        })();
}

function getTemplateById(id) {
    const template = document.getElementById(id);

    if (!template || !template.content) {
        throw new Error('Template id="' + id + '" not found in document');
    }

    return template;
}

function getTemplate(template) {
    if (template === undefined) { return; }

    return typeof template === 'string' ?
        // If template is an #id search for <template id="id">
        template[0] === '#' ? getTemplateById(template.slice(1)) :
        // It must be a string of HTML
        template :        
    template.content ?
        // It must be a template node
        template :
    typeof template === 'function' ?
        template :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.template not a template node, id or string');
        }() ;
}

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function createShadow(template, elem, options) {
    if (template === undefined) { return; }
    elem._initialLoad = true;

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode:           options.mode || 'closed',
        delegatesFocus: options.focusable || false
    });

    elem[$shadow] = shadow;

    // If template is a string
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else if (typeof template === 'function') {
        template(elem, shadow);
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }

    return shadow;
}

function attachInternals(elem) {
    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        return elem.attachInternals();
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    const hidden = create$1('input', { type: 'hidden', name: elem.name });

    // Polyfill internals object setFormValue
    hidden.setFormValue = function(value) {
        this.value = value;
    };

    return hidden;
}

function primeAttributes(elem) {
    elem._initialAttributes = {};
    elem._n = 0;
}

function advanceAttributes(elem, attributes, handlers) {
    const values = elem._initialAttributes;

    while(elem._n < attributes.length && values[attributes[elem._n]] !== undefined) {
        //console.log('ADVANCE ATTR', attributes[elem._n]);
        handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        ++elem._n;
    }
}

function flushAttributes(elem, attributes, handlers) {
    if (!elem._initialAttributes) { return; }

    const values = elem._initialAttributes;

    while(elem._n < attributes.length) {
        if (values[attributes[elem._n]] !== undefined && handlers[attributes[elem._n]]) {
            handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        }
        ++elem._n;
    }

    delete elem._initialAttributes;
    delete elem._n;
}



function element(name, options) {
    // Get the element constructor from options.extends, or the
    // base HTMLElement constructor
    const constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

    let template;

    function Element() {
        // Get a template node or HTML string from options.template
        template = template === undefined ?
            getTemplate(options.template) :
            template ;

        // Construct an instance from Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = createShadow(template, elem, options);

        if (Element.formAssociated) {
            // Get access to the internal form control API
            elem[$internals] = attachInternals(elem);
        }

        options.construct && options.construct.call(null, elem, shadow, elem[$internals]);

        // Preserve initialisation order of attribute initialisation by
        // queueing them
        if (options.attributes) {
            primeAttributes(elem);

            // Wait a tick to flush attributes
            Promise.resolve(1).then(function() {
                flushAttributes(elem, Element.observedAttributes, options);
            });
        }

        // At this point, if properties have already been set before the
        // element was upgraded, they exist on the elem itself, where we have
        // just upgraded it's protytype to define those properties those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype
        //    Object.defineProperties(elem, properties);
        //
        // 2. Take a great deal of care not to set properties before an element
        //    is upgraded. I can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy you have to do this, though.
        options.properties
        && Object.keys(options.properties).reduce(transferProperty, elem);

        return elem;
    }


    // Properties
    //
    // Must be defined before attributeChangedCallback, but I cannot figure out
    // why. Where one of the properties is `value`, the element is set up as a
    // form element.

    if (options.properties && options.properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;
        Element.prototype = Object.create(constructor.prototype, assign$a({}, formProperties, options.properties));
    }
    else {
        Element.prototype = Object.create(constructor.prototype, options.properties || {}) ;
    }


    // Attributes

    if (options.attributes) {
        Element.observedAttributes = Object.keys(options.attributes);
        Element.prototype.attributeChangedCallback = function(name, old, value) {
            if (!this._initialAttributes) {
                return options.attributes[name].call(this, value);
            }

            // Keep a record of attribute values to be applied in
            // observedAttributes order
            this._initialAttributes[name] = value;
            advanceAttributes(this, Element.observedAttributes, options.attributes);
        };
    }


    // Lifecycle

    Element.prototype.connectedCallback = function() {
        const elem      = this;
        const shadow    = elem[$shadow];
        const internals = elem[$internals];

        // Initialise any attributes that appeared out of order
        if (elem._initialAttributes) {
            flushAttributes(elem, Element.observedAttributes, options.attributes);
        }

        // If we have simulated form internals, append the hidden input now
        if (elem[$internals] && !elem.attachInternals) {
            elem.appendChild(elem[$internals]);
        }

        // If this is the first connect and there is an options.load fn,
        // _initialLoad is true
        if (elem._initialLoad) {
            const links = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (links.length) {
                let count  = 0;
                let n = links.length;

                // Avoid unstyled content by temporarily hiding elem while
                // links load
                elem.style.visibility = 'hidden';

                const load = function load(e) {
                    if (++count >= links.length) {
                        // Delete _initialLoad. If the element is removed
                        // and added to the DOM again, stylesheets do not load
                        // again
                        delete elem._initialLoad;
                        elem.style.visibility = 'visible';
                        if (options.load) {
                            options.load.call(elem, elem, shadow);
                        }
                    }
                };

                // Todo: But do we pick these load events up if the stylesheet is cached??
                while (n--) {
                    links[n].addEventListener('load', load, onceEvent);
                    links[n].addEventListener('error', function(e) {
                        console.log('Failed to load stylesheet', e.target.href);
                        load();
                    }, onceEvent);
                }

                if (options.connect) {
                    options.connect.call(null, elem, shadow, internals);
                }
            }
            else {
                if (options.connect) {
                    options.connect.call(null, elem, shadow, internals);
                }

                if (options.load) {
                    options.load.call(null, elem, shadow, internals);
                }
            }
        }
        else if (options.connect) {
            options.connect.call(null, elem, shadow, internals);
        }

        if (DEBUG$2) {
            console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', elem);
        }
    };

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            return options.disconnect.call(null, this, this[$shadow], this[$internals]);
        };
    }

    if (Element.formAssociated) {
        if (options.enable || options.disable) {
            Element.prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    options.disable && options.disable.call(null, this, this[$shadow], this[$internals]) :
                    options.enable && options.enable.call(null, this, this[$shadow], this[$internals]) ;
            };
        }

        if (options.reset) {
            Element.prototype.formResetCallback = function() {
                return options.reset.call(null, this, this[$shadow], this[$internals]);
            };
        }

        if (options.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                return options.restore.call(null, this, this[$shadow], this[$internals]);
            };
        }
    }

    // Define element
    // Todo: make this async regardless of external template, for consistency? Does
    // that cause problems? It shouldn't, we should be able to define custom elements 
    // whenever we like.
    if (typeof options.template === 'string' && /^(?:\.?\/|https?:\/\/)/.test(options.template)) {
        // Template src begins with ./ or / or http:// or https://
        // preload it before defining custom element
        requestTemplate(options.template)
        .then(function(node) {
            if (DEBUG$2) {
                console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', 'template "' + options.template + '" imported');
            }
            template = node;
            window.customElements.define(name, Element, options);
        });
    }
    else {
        window.customElements.define(name, Element, options);
    }

    return Element;
}

/**
escape(string)
Escapes `string` for setting safely as HTML.
*/

var pre  = document.createElement('pre');
var text = document.createTextNode('');

pre.appendChild(text);

function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}

curry(attribute, true);

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

curry(find$2, true);

function select(selector, node) {
	return toArray(node.querySelectorAll(selector));
}

curry(select, true);

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

curry(append$1, true);

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
const cancelAnimationFrame  = window.cancelAnimationFrame;

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
		cancelAnimationFrame(id);
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

function invert(curve, value, min, max) {
    return normalise$1[toCamelCase(curve)](min, max, value) ;
}


function outputMilliKilo(unit, value) {
    return value < 0.001 ? (value * 1000).toFixed(2) :
        value < 1 ? (value * 1000).toPrecision(3) :
        value > 1000 ? (value / 1000).toPrecision(3) :
        value.toPrecision(3) ;
}

const transformOutput = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? '-1.00' :
            value === 0 ? '0.00' :
            value === 1 ? '1.00' :
            value.toFixed(2) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db < -1 ? db.toPrecision(3) :
                db.toFixed(2) :
            db < 0 ?
                '-∞' :
                '∞' ;
    },

    Hz: function(unit, value) {
        return value < 1 ? value.toFixed(2) :
            value > 1000 ? (value / 1000).toPrecision(3) :
            value.toPrecision(3) ;
    },

    semitone: function(unit, value) {
        // detune value is in cents
        return value === 0 ? '0' :
            value < 0 ?
                '♭' + (-value / 100).toFixed(2) :
                '♯' + (value / 100).toFixed(2) ;
    },

    s: outputMilliKilo,

    bpm: function(unit, value) {
        // Input value is a rate in beats per second
        const bpm = value * 60;
        return bpm < 100 ?
            bpm.toFixed(1) :
            bpm.toFixed(0) ;
    },

    int: function(unit, value) {
        return Math.round(value);
    },

    default: function(unit, value) {
        return value < 0.1 ? value.toFixed(3) :
            value < 999.5 ? value.toPrecision(3) :
            value.toFixed(0) ;
    }
});

function tickMilliKilo(unit, value) {
    return value < 1 ? (value * 1000).toFixed(0) :
        value < 10 ? value.toFixed(1) :
        value < 1000 ? value.toPrecision(1) :
        (value / 1000).toPrecision(1) + 'k' ;
}

const transformTick = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? 'left' :
            value === 0 ? 'centre' :
            value === 1 ? 'right' :
            value.toFixed(1) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db.toFixed(0) :
            db < 0 ?
                '-∞' :
                '∞' ;
    },

    Hz: function(unit, value) {
        return value < 10 ? value.toFixed(1) :
            value < 1000 ? value.toFixed(0) :
            (value / 1000).toFixed(0) + 'k' ;
    },

    semitone: function(unit, value) {
        //console.log(unit, value, value / 100, (value / 100).toFixed(0));
        // detune value is in cents
        return (value / 100).toFixed(0);
    },

    s: tickMilliKilo,

    default: function(unit, value) {
        // Format numbers to precision 3 then remove trailing zeroes from floats
        return (value < 99.5 ?
            value.toPrecision(3) :
            value.toFixed(0)
        )
        .replace(/(\d+)(\.\d*?)0+$/, ($0, $1, $2) => {
            return $1 + ($2.length > 1 ? $2 : '');
        });
    }
});

function unitKilo(unit, value) {
    return value > 1000 ? 'k' + unit :
        unit ;
}

function unitMilliKilo(unit, value) {
    return value < 1 ? 'm' + unit :
        value > 1000 ? 'k' + unit :
        unit ;
}

function unitEmptyString() {
    return '';
}

const transformUnit = overload(id, {
    pan: unitEmptyString,

    dB: id,

    Hz: unitKilo,

    semitone: unitEmptyString,

    s: unitMilliKilo,
    
    int: () => '',

    default: function(unit, value) {
        // Return empty string if no unit
        return unit || '';
    }
});


function evaluate(string) {
    // Coerce null, undefined, false, '' to 0
    if (!string) { return 0; }

    const number = +string;
    if (number || number === 0) { return number; }

    const tokens = /^(-?[\d.]+)(?:(dB|bpm)|(m|k)?(\w+))$/.exec(string);
    if (!tokens) { return 0 }
    const value = parseFloat(tokens[1]) ;

    return tokens[2] === 'dB' ? toGain(value) :
        // BPM to rate in beats per second
        tokens[2] === 'bpm' ? value / 60 :
        // milli-
        tokens[3] === 'm' ? value / 1000 :
        // kilo-
        tokens[3] === 'k' ? value * 1000 :
        value ;
}

function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.law === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                value:        value,
                unitValue:    invert(data.law, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

function createSteps(data, tokens) {
    if (!tokens || /\s+any\s+/.test(tokens)) {
        return null;
    }

    const values = tokens.split(/\s+/);

    // Single step value not supported yet
    return values.length === 1 ?
        null :
        values
        .map(evaluate)
        .map((value) => {
            return {
                value: value,
                unitValue: invert(data.law, value, data.min, data.max)
            };
        })
        .sort(by$1(get$1('unitValue'))) ;
}

function nearestStep(steps, unitValue) {
    let n = steps.length;
    let diff = Infinity;
    let step;

    while (n--) {
        const d = Math.abs(unitValue - steps[n].unitValue);

        if (d < diff) {
            diff = d;
            step = steps[n];
        }
    }

    return step;
}


const attributes = {
    // Remember attributers are setup in this declared order

    /**
    min="0"
    Value at lower limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    min: function(value) {
        this.min = value;
    },

    /**
    max="1"
    Value at upper limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    max: function(value) {
        this.max = value;
    },

    /**
    law="linear"
    Fader law. This is the name of a transform to be applied over the range 
    of the fader travel. Possible values are:

- `"linear"`
- `"linear-logarithmic"`
- `"logarithmic"`
- `"quadratic"`
- `"cubic"`
    **/

    law: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        const scope    = privates$1.scope;

        data.law = value || 'linear';

        if (data.ticksAttribute) {
            data.ticks = createTicks(data, data.ticksAttribute);
        }

        if (data.step) {
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                data.stepsAttribute );
        }

        scope.unitZero(invert(data.law, 0, data.min, data.max));
    },

    /**
    unit=""
    The value's unit, if it has one. The output value and all ticks are 
    displayed in this unit. Possible values are:
- `"dB"` – `0-1` is displayed as `-∞dB` to `0dB`
- `"Hz"`
    **/

    unit: function(value) {
        privates(this).data.unit = value;
    },

    /**
    ticks=""
    A space separated list of values at which to display tick marks. Values
    may be listed with or without units, eg:
    
```html
ticks="0 0.2 0.4 0.6 0.8 1"
ticks="-48dB -36dB -24dB -12dB 0dB"
```
    **/

    ticks: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        const scope    = privates$1.scope;

        data.ticksAttribute = value;

        // Create ticks
        scope.ticks(createTicks(data, value));

        // If step is 'ticks' update steps
        if (data.stepsAttribute === 'ticks') {
            data.steps = createSteps(data, value || '');
        }
    },

    /**
    steps=""
    Steps is either:

- A space separated list of values. As with `ticks`, values may be listed with or without units.
- The string `"ticks"`. The values in the `ticks` attribute are used as steps.
    **/

    steps: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        data.stepsAttribute = value;

        // If steps is 'ticks' use ticks attribute as step value list
        data.steps = createSteps(data, value === 'ticks' ?
            data.ticksAttribute || '' :
            value );
    },

    /**
    value=""
    The initial value of the fader.
    **/

    value: function(value) {
        this.value = value;
    },

    prefix: function(value) {
        privates(this).data.prefix = value;
    }
};

const properties = {
    /**
    .type="number"
    A readonly property with the value `"number"` (provided for consistency 
    with native form elements, which all have a type).
    **/

    type: {
        value: 'number',
        enumerable: true
    },

    /**
    .min=0
    Value at lower limit of fader, as a number.
    **/

    min: {
        get: function() {
            return privates(this).data.min;
        },

        set: function(value) {
            const privates$1 = privates(this);
            const data     = privates$1.data;
            const scope    = privates$1.scope;

            data.min = evaluate(value);

            // Check for readiness
            if (data.max === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },

    /**
    .max=1
    Value at lower limit of fader, as a number.
    **/

    max: {
        get: function() {
            return privates(this).data.max;
        },

        set: function(value) {
            const privates$1 = privates(this);
            const data     = privates$1.data;
            const scope    = privates$1.scope;

            data.max = evaluate(value);

            if (data.min === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },
    
    /**
    .value=0
    Current value of the field, as a number.
    **/
    
    value: {
        get: function() {
            return privates(this).data.value;
        },

        set: function(value) {
            const privates$1  = privates(this);
            const data      = privates$1.data;
            const scope     = privates$1.scope;
            const internals = privates$1.internals;

            value = evaluate(value);

            if (value === data.value) { return; }

            // Are we ready?
            /*
            if (data.max === undefined || data.min === undefined) {
                data.value = value;
                return;
            }*/

            let unitValue = invert(data.law, value, data.min, data.max);

            // Round to nearest step
            if (data.steps) {
                const step = nearestStep(data.steps, unitValue);
                value     = step.value;
                unitValue = step.unitValue;
            }

            if (value === data.value) { return; }
            data.value = value;
            data.unitValue = unitValue;

            internals.setFormValue(value);
            scope.displayValue(transformOutput(data.unit, value));
            scope.displayUnit(transformUnit(data.unit, value));
            scope.unitValue(unitValue);
        },

        enumerable: true
    }
};

/**
parseEnvelope(string)

The string is parsed for envelope coordinates. Converts strings of the
following form (commas are optional):

```js
"0 0 linear, 1 0.5 exponential, 3 0.25 target 2"
```

Into a nested array of the form:

```js
[
    [0, 0,    "linear"],
    [1, 0.5,  "exponential"], 
    [3, 0.25, "target", 2]
]
```
**/

const parseTargetData = capture$1(/^([+-]?[0-9.]+)/, {
    // Parse:                     (float)
    1: function param(data, captures) {
        data[3] = parseFloat(captures[1]);
        return data;
    },

    catch: function(data) {
        data[3] = defaultTargetEventDuration;
        return data;
    }
});

const parseCoord = capture$1(/^([0-9.]+)\s+([+-]?[0-9.]+)\s+([\w-]+)/, {
    // Parse:                (x)         (y)              (string)
    0: function x(data, captures) {
        data = {
            0: parseFloat(captures[1]),
            1: parseFloat(captures[2]),
            2: captures[3],
        };

        return data[2] === 'target' ?
            parseTargetData(data, captures) :
            data ;
    },

    catch: noop
}, null);

const parseStart = capture$1(/^\s*|,\s*|\s+/, {
    // Parse:              start, ',' or ' '
    0: function(data, captures) {
        const coord = parseCoord(captures);
        if (coord) {
            data.push(coord);
            return parseStart(data, captures);
        }
        return data;
    }
});

function parseEnvelope(string) {
    return parseStart([], string)
}

const noop$1 = function() {};


const print = window.console ?
    console.log.bind(console, '%cSoundstage %c%s', 'color: #e02053; font-weight: 600;', 'color: #8e9e9d; font-weight: 300;') :
    noop$1 ;

const printGroup = window.console ?
    console.groupCollapsed.bind(console, '%cSoundstage %c%s', 'color: #e02053; font-weight: 600;', 'color: #8e9e9d; font-weight: 300;') :
    noop$1 ;

const printGroupEnd = window.console ?
    console.groupEnd.bind(console) :
    noop$1 ;

const logGroupEnd = window.console ?
    console.groupEnd.bind(console) :
    noop$1 ;

/**
PlayNode()

A mixin that sets up an object to be playable.

```
// Call the mixin constructor inside your constructor
MyNode() {
    PlayNode.call(this);
}

// Assign its' prototype properties to your object's prototype
Object.assign(MyNode.prototype, PlayNode.prototype);

// Define its' defined properties on your object's prototype
Object.defineProperties(MyNode.prototype, {
    playing: Object.getOwnPropertyDescriptor(PlayNode.prototype, 'playing')
});
```
**/
const assign$b = Object.assign;
const define$3 = Object.defineProperties;

const properties$1 = {
    /**
    .startTime
    The time at which playback is scheduled to start.
    **/

    startTime: { writable: true },

    /**
    .stopTime
    The time at which playback is scheduled to stop.
    **/

    stopTime:  { writable: true }
};

function PlayNode() {
    define$3(this, properties$1);
}

PlayNode.reset = function(node) {
    node.startTime = undefined;
    node.stopTime  = undefined;
    return node;
};

assign$b(PlayNode.prototype, {
    /**
    .start(time)
    Sets `.startTime` to `time`, or where `time` is undefined, to
    `context.currentTime`.

    Returns `this`.
    **/

    start: function(time) {

        this.startTime = time || this.context.currentTime;
        return this;
    },

    /**
    .stop(time)
    Sets `.stopTime` to `time` or where `time` is undefined, to
    `context.currentTime`, this time is before `.startTime`, in which case
    `.stopTime` is set equal to `.startTime`.

    Returns `this`.
    **/

    stop: function(time) {

        time = time || this.context.currentTime;

        // Clamp stopTime to startTime
        this.stopTime = (this.startTime === undefined || time > this.startTime) ?
            time :
            this.startTime ;

        return this;
    }
});

define$3(PlayNode.prototype, {
    /**
    .playing
    A boolean indicating whether the node is started and playing (`true`) or
    stopped and idle (`false`).
    **/

    playing: {
        get: function() {
            return this.startTime !== undefined
            && (this.startTime <= this.context.currentTime)
            && (this.stopTime === undefined
                || this.startTime > this.stopTime
                || this.context.currentTime < this.stopTime
            );
        }
    }
});

// Safari still requires a prefixed AudioContext
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// Crude polyfill for systems without getOutputTimeStamp()
if (!AudioContext.prototype.getOutputTimestamp) {
    AudioContext.prototype.getOutputTimestamp = function() {
        return {
            contextTime:     this.currentTime + this.outputLatency,
            performanceTime: window.performance.now()
        };
    };
}

const context = new window.AudioContext();
context.destination.channelInterpretation = "discrete";
context.destination.channelCount = context.destination.maxChannelCount;

if (context.baseLatency === undefined) {
    // Assume 128 * 2 buffer length, as it is in Chrome on MacOS
    context.baseLatency = 256 / context.sampleRate;
}

/*
if (!context.outputLatency) {
    // Just a quick guess.
    // You'll never get this on Windows, more like 0.02 - no ASIO drivers, see.
    context.outputLatency = 128 / context.sampleRate;
    context.outputLatencyEstimated = true;
}
*/

/*
In Chrome (at least) contexts are suspended by default according to
Chrome's autoplay policy:

https://developers.google.com/web/updates/2018/11/web-audio-autoplay
*/

if (context.state === 'suspended') {
    print('Audio context suspended', 'User interaction required');

    // Listen for user events, resume the context when one is detected.
    const types = ['mousedown', 'keydown', 'touchstart', 'contextmenu'];

    const add = (fn, type) => {
        document.addEventListener(type, fn);
        return fn;
    };

    const remove = (fn, type) => {
        document.removeEventListener(type, fn);
        return fn;
    };

    types.reduce(add, function fn(e) {
        context
        .resume()
        .then(function() {
            print('Audio context resumed on "' + e.type + '"');
            types.reduce(remove, fn);
        });
    });
}

function stampTimeAtDomTime(stamp, domTime) {
    return stamp.contextTime + (domTime - stamp.performanceTime) / 1000;
}

function timeAtDomTime(context, domTime) {
    var stamp = context.getOutputTimestamp();
    return stampTimeAtDomTime(stamp, domTime);
}

var config$2 = {
    // The maximum number of channels for the output node, a merger, of a
    // soundstage instance. If audioContext.destination's maxChannelCount
    // is lower, the output channelCount is set to that instead
    channelCountLimit: 12,

    // Path used by various modules to find and load their web workers, as
    // web workers require paths relative to the base document
    basePath: window.soundstageBasePath || '/soundstage/',

    // Expando names added to AudioParams in order to help observe
    // value changes
    automationEventsKey: 'automationEvents',
    animationFrameKey: 'animationFrame',

    // Value considered to be 0 for the purposes of scheduling
    // exponential curves.
    minExponentialValue: 1.40130e-45,

    // Multiplier for duration of target events indicating roughly when
    // they can be considered 'finished'
    targetDurationFactor: 9
};

// 60 frames/sec frame rate
const frameDuration = 1000 / 60;

function getAutomation(param) {

    // Todo: I would love to use a WeakMap to store data about AudioParams,
    // but FF refuses to allow AudioParams as WeakMap keys. So... lets use
    // an expando.
    return param[config$2.automationEventsKey] || (param[config$2.automationEventsKey] = []);
}


// Automate audio param

const validateParamEvent = overload(get$1(1), {
    "target": function(event) {
        if (event[3] === undefined) {
            throw new Error('Event "target" must have 2 parameters: [time, "target", value, duration]');
        }
    },

    "hold": function(event) {
        // ????
        if (event[2] !== undefined) {
            throw new Error('Event "hold" takes 0 parameters: [time, "hold"]');
        }
    },

    default: function(event) {
        if (event[2] === undefined) {
            throw new Error('Event "' + event[1] + '" must have 1 parameter: [time, "' + event[1] + '", value]');
        }
    }
});

function holdFn(param, event) {
    // Cancel values
    param.cancelScheduledValues(event.time);

    // Set a curve of the same type as the next to this time and value
    if (event.curve === 'linear') {
        param.linearRampToValueAtTime(event.value, event.time);
    }
    else if (event.curve === 'exponential') {
        param.exponentialRampToValueAtTime(event.value, event.time);
    }
    else if (event.curve === 'step') {
        param.setValueAtTime(event.value, event.time);
    }
}

const curves = {
    'step':        (param, event) => param.setValueAtTime(event.value, event.time),
    'linear':      (param, event) => param.linearRampToValueAtTime(event.value, event.time),
    'exponential': (param, event) => param.exponentialRampToValueAtTime(event.value, event.time),
    'target':      (param, event) => param.setTargetAtTime(event.value, event.time, event.duration),
    'curve':       (param, event) => param.setValueCurveAtTime(event.value, event.time, event.duration),
    'hold': AudioParam.prototype.cancelAndHoldAtTime ?
        function hold(param, event, event1) {
            // Work around a Chrome bug where target curves are not
            // cancelled by hold events inserted in front of them:
            // https://bugs.chromium.org/p/chromium/issues/detail?id=952642&q=cancelAndHoldAtTime&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
            if (event1 && event1.curve === 'target') {
                return holdFn(param, event);
            }

            param.cancelAndHoldAtTime(event.time);
        } :

        holdFn
};

const createEvent = overload(id, {
    'exponential': (curve, param, event0, event1, time, value) => {
        // Make an event object to be stored in param$automationEvents
        const event = {
            time:  time,
            value: Math.fround(value)
        };

        // Deal with exponential curves starting or ending with value 0. Swap them
        // for step curves, which is what they tend towards for low values.
        // Todo: deal with -ve values.
        if (event.value <= config$2.minExponentialValue) {
            event.time  = event0 ? event0.time : 0 ;
            event.curve = "step";
        }
        else if (event0 && event0.value < config$2.minExponentialValue) {
            event.curve = "step";
        }
        else {
            event.curve = "exponential";
        }

        return event;
    },

    'hold': function(curve, param, event0, event1, time) {
        // Set a curve of the same type as the next to this time and value
        return event1 && event1.curve === 'linear' ? {
            time:  time,
            curve: 'linear',
            value: Math.fround(getValueBetweenEvents(event0, event1, time))
        } :

        event1 && event1.curve === 'exponential' ? {
            time:  time,
            curve: 'exponential',
            value: Math.fround(getValueBetweenEvents(event0, event1, time))
        } :

        event0 && event0.curve === 'target' ? {
            time:  time,
            curve: 'step',
            value: getValueAtTime(param, time)
        } : {
            time: time
        } ;
    },

    'target': (curve, param, event0, event1, time, value, duration) => {
        return {
            time:     time,
            curve:    'target',
            value:    Math.fround(value),
            duration: duration
        };
    },

    'default': (curve, param, event0, event1, time, value, duration) => {
        return {
            time:     time,
            curve:    curve,
            value:    Math.fround(value)
        };
    }
});

const mutateEvents = choose({
    'hold': function(event1, event, events, n) {
        // Throw away following events
        events.length = n + 1;

        // Push in the replacement curve where there is one
        if (event.curve) {
            events.push(event);
        }
    },

    'default': function(event1, event, events, n) {
        // If the new event is at the end of the events list
        if (!event1) {
            events.push(event);
            return;
        }

        // Where the new event is at the same time as an existing event...
        if (event1.time === event.time) {
            // scan forward through events at this time...
            while (events[++n] && events[n].time === event.time) {
                // and if an event with the same curve is found, replace it...
                if (events[n].curve === event.curve) {
                    events.splice(n, 1, event);
                    return;
                }
            }

            // or tack it on the end of those events.
            events.splice(n, 0, event);
            return;
        }

        // The new event is between event1 and event2
        events.splice(n + 1, 0, event);
    }
});

function automateParamEvents(param, events, time, curve, value, duration) {
    var n = events.length;
    while (events[--n] && events[n].time >= time);

    // Before and after events
    const event0 = events[n];
    const event1 = events[n + 1];

    // Create an event where needed
    const event = createEvent(curve, param, event0, event1, time, value, duration);

    // Automate the change based on the requested curve. Note that the
    // event has been mutated to reflect any curve we may bifurcate
    curves[curve](param, event, event1);

    // Update the events list
    mutateEvents(curve, event1, event, events, n);
}

/**
automate(param, time, value, curve, decay)

param - AudioParam object
time  -
value -
curve - one of 'step', 'hold', 'linear', 'exponential' or 'target'
decay - where curve is 'target', decay is a time constant for the decay curve
**/

function automate(param, time, curve, value, duration, notify, context) {
    if (curve === 'target' && duration === undefined) {
        throw new Error('Automation curve "target" must have a duration');
    }

    const events = getAutomation(param);
    automateParamEvents(param, events, time, curve, value, duration);

    if (!notify) {
        return;
    }

    if (!context) {
        return;
    }

    // If param is flagged as already notifying, do nothing
    if (param[config$2.animationFrameId]) {
        return;
    }

    var n = -1;

    function frame(time) {
        // Notify at 1/3 frame rate
        n = (n + 1) % 3;
        if (n === 0) {
            param[config$2.animationFrameId] = requestAnimationFrame(frame);
            return;
        }

        const renderTime  = time + frameDuration;
        const outputTime  = timeAtDomTime(context, renderTime);
        const outputValue = getValueAtTime(param, outputTime);
        const lastEvent   = events[events.length - 1];

        // If outputTime is not yet beyond the end of the events list
        param[config$2.animationFrameId] = lastEvent && outputTime <= lastEvent.time ?
            requestAnimationFrame(frame) :
            undefined ;

        notify(param, 'value', outputValue);
    }

    param[config$2.animationFrameId] = requestAnimationFrame(frame);
}


/**
automato__(node, name, time, curve, value, duration, notify)

param    - AudioParam object
time     -
value    -
curve    - one of 'step', 'hold', 'linear', 'exponential' or 'target'
duration - where curve is 'target', decay is a time constant for the decay
notify   - a callback function
**/

function automato__(node, name, time, curve, value, duration, notify) {
    if (curve === 'target' && duration === undefined) {
        throw new Error('Automation curve "target" must have a duration');
    }

    const param  = node[name];
    const events = getAutomation(param);
    automateParamEvents(param, events, time, curve, value, duration);

    if (!notify) {
        return;
    }

    // If param is flagged as already notifying, do nothing
    if (param[config$2.animationFrameId]) {
        return;
    }

    var n = -1;

    function frame(time) {
        // Notify at 1/3 frame rate
        n = (n + 1) % 3;
        if (n === 0) {
            param[config$2.animationFrameId] = requestAnimationFrame(frame);
            return;
        }

        const renderTime  = time + frameDuration;
        const outputTime  = timeAtDomTime(node.context, renderTime);
        const outputValue = getValueAtTime(param, outputTime);
        const lastEvent   = events[events.length - 1];

        // If outputTime is not yet beyond the end of the events list
        param[config$2.animationFrameId] = lastEvent && outputTime <= lastEvent.time ?
            requestAnimationFrame(frame) :
            undefined ;

        notify(node, name, outputValue);
    }

    param[config$2.animationFrameId] = requestAnimationFrame(frame);
}

// Get audio param value at time

const interpolate = {
    // Automation curves as described at:
    // http://webaudio.github.io/web-audio-api/#h4_methods-3

    'step': function stepValueAtTime(value1, value2, time1, time2, time) {
        return time < time2 ? value1 : value2 ;
    },

    'linear': function linearValueAtTime(value1, value2, time1, time2, time) {
        return value1 + (value2 - value1) * (time - time1) / (time2 - time1) ;
    },

    'exponential': function exponentialValueAtTime(value1, value2, time1, time2, time) {
        return value1 * Math.pow(value2 / value1, (time - time1) / (time2 - time1)) ;
    },

    'target': function targetEventsValueAtTime(value1, value2, time1, time2, time, duration) {
        return time < time2 ?
            value1 :
            value2 + (value1 - value2) * Math.pow(Math.E, (time2 - time) / duration);
    },

    'curve': function(value1, value2, time1, time2, time, duration) {
        // Todo
    }
};

function getValueBetweenEvents(event1, event2, time) {
    return interpolate[event2.curve](event1.value, event2.value, event1.time, event2.time, time, event1.duration);
}

function getEventsValueAtEvent(events, n, time) {
    var event = events[n];
    return event.curve === "target" ?
        interpolate.target(getEventsValueAtEvent(events, n - 1, event.time), event.value, 0, event.time, time, event.duration) :
        event.value ;
}

function getEventsValueAtTime(events, time) {
    var n = events.length;

    while (events[--n] && events[n].time >= time);

    var event0 = events[n];
    var event1 = events[n + 1];

    // Time is before the first event in events
    if (!event0) {
        return 0;
    }

    // Time is at or after the last event in events
    if (!event1) {
        return getEventsValueAtEvent(events, n, time);
    }

    if (event1.time === time) {
        // Scan through to find last event at this time
        while (events[++n] && events[n].time === time);
        return getEventsValueAtEvent(events, n - 1, time) ;
    }

    if (time < event1.time) {
        return event1.curve === "linear" || event1.curve === "exponential" ?
            getValueBetweenEvents(event0, event1, time) :
            getEventsValueAtEvent(events, n, time) ;
    }
}

function getValueAtTime(param, time) {
    var events = getAutomation(param);

    if (!events || events.length === 0) {
        return param.value;
    }

    // Round to 32-bit floating point
    return Math.fround(getEventsValueAtTime(events, time));
}

function assignSetting(node, key, value, notify) {
    // Are we trying to get a value from an AudioParam? No no no.
    if (value && value.setValueAtTime) {
        return;
        //throw new Error('Cannot set ' + key + ' from param on node ' + JSON.stringify(node));
    }

    // Does it quack like an AudioParam?
    if (node[key] && node[key].setValueAtTime) {

        // If we are assigning settings we can assume we are in a state to
        // purge old automation events. Keep an eye, might be a bit aggressive
        getAutomation(node[key]).length = 0;

        // node, name, time, curve, value, duration, notify, context
        automato__(node, key, node.context.currentTime, 'step', value, null, notify);
    }

    // Or an AudioNode?
    else if (node[key] && node[key].connect) {
        assignSettings(node[key], value);
    }

    // Then set it as a property
    else {
        node[key] = value;
    }
}

function assignSettings(node, defaults, settings, ignored) {

    const keys = {};

    if (settings) {
        for (let key in settings) {
            // Ignore ignored key
            if (ignored && ignored.indexOf(key) > -1) { continue; }

            // Ignore AudioParams coming from a parent node
            if (settings[key] && settings[key].setValueAtTime) { continue; }

            // We want to assign only when a property has been declared, as we may
            // pass composite options (options for more than one node) into this.
            if (node.hasOwnProperty(key) && settings[key] !== undefined) {
                assignSetting(node, key, settings[key]);
                keys[key] = true;
            }
        }
    }

    for (let key in defaults) {
        // Ignore ignored key
        if (ignored && ignored.indexOf(key) > -1) { continue; }

        // If we have already set this, or it's not settable, move on
        if (!keys[key]) {
            assignSetting(node, key, defaults[key]);
        }
    }
}

function assignSettingz__(node, settings, ignored) {

    var key;

    for (key in settings) {
        // Ignore ignored key
        if (ignored && ignored.indexOf(key) > -1) { continue; }

        // Ignore AudioParams coming from a parent node
        if (settings[key] && settings[key].setValueAtTime) { continue; }

        // We want to assign only when a property has been declared, as we may
        // pass composite options (options for more than one node) into this.
        if ((node[key] || node.hasOwnProperty(key)) && settings[key] !== undefined) {
            assignSetting(node, key, settings[key]);
        }
    }

    return node;
}

const assign$c = Object.assign;
const define$4 = Object.defineProperties;
const getDefinition = Object.getOwnPropertyDescriptor;

// Time multiplier to wait before we accept target value has 'arrived'
const targetDurationFactor = config$2.targetDurationFactor;

const properties$2 = {
    /** .attack
    An array of param events describing an arbitrary attack curve for the
    envelope. Param events have the form [time, type, value] (or if type is
    `'target'`, [time, type, value, duration]), where `time` is the time since
    the time passed to `.start(time)`.

    The default envelope value at time `0` is `0`.
    **/

    attack:  { writable: true, enumerable: true },

    /** .release
    An array of param events describing the release curve of the envelope. Param
    events have the form [time, type, value] (or if type is `'target'`
    [time, type, value, duration]), where `time` is the time since the time
    passed to `.stop(time)`.

    Values are scaled to the current value of the envelope – if the attack
    envelope decays to a value of `0.5`, say, by the scheduled stop time, all
    values in the release envelope are multiplied by `0.5`. The last event
    should have a value of `0`, otherwise the envelope will never stop.
    **/

    release: { writable: true, enumerable: true },

    /** .gain
    A float, nominally in the rage `0–1`, that is read on `.start()` to
    determine the gain to apply to the curve.
    **/

    gain:    { writable: true, enumerable: true },

    /** .rate
    A float that is read on `.start()` or `.stop()` to determine the rate of
    playback to apply to the curve.
    **/

    rate:    { writable: true, enumerable: true }
};

const defaults$1 = {
    attack: [
        [0.008, 'linear', 1]
    ],

    release: [
        [0.008, 'linear', 0]
    ],

    offset: 0,
    gain: 1,
    rate: 1
};

function cueAutomation(param, events, time, gain, rate) {
    var event;
    automate(param, time, 'hold');

    for (event of events) {
        validateParamEvent(event);

        // param, time, curve, value, decay
        automate(param, time + event[0] / rate, event[1], event[2] * gain, event[3]);
    }
}

class Envelope extends ConstantSourceNode {
    constructor(context, settings) {
        super(context);
        super.start.call(this, context.currentTime);

        // Define .start(), .stop(), .startTime and .stopTime
        PlayNode.call(this, context);

        // Properties
        define$4(this, properties$2);

        // Set properties and params
        assignSettingz__(this, assign$c({}, defaults$1, settings));
    }

    /**
    .start(time)
    Start playback of envelope at `time`.
    Returns envelope.
    **/

    start(time) {
        if (!this.attack) { return this; }
        PlayNode.prototype.start.apply(this, arguments);
        cueAutomation(this.offset, this.attack, this.startTime, this.gain, this.rate);

        // If attack ends with value 0 we may set a stopTime already, even if it
        // is to be overridden later with a call to .stop(), helping guarantee 
        // the pooled object will be released even without release events
        const event = last(this.attack);

        if (event[2] === 0) {
            this.stopTime = time + (
                event[1] === 'target' ?
                    event[0] + event[3] * targetDurationFactor :
                    event[0]
            );
        }

        return this;
    }

    /**
    .stop(time)
    Stop playback of envelope at `time`.
    Returns envelope.
    **/

    stop(time) {
        if (!this.release) { return this; }
        PlayNode.prototype.stop.apply(this, arguments);

        // Use the current signal as the start gain of the release
        const gain = getValueAtTime(this.offset, this.stopTime);
        cueAutomation(this.offset, this.release, this.stopTime, gain, this.rate);

        // Update stopTime to include release tail
        const event = last(this.release);

        if (event[2] !== 0) {
            console.warn('Envelope.release does not end with value 0. Envelope will never stop.', this);
            this.stopTime = Infinity;
        }
        else {
            this.stopTime += event[1] === 'target' ?
                event[0] + event[3] * targetDurationFactor :
                event[0] ;
        }

        return this;
    }
}

define$4(Envelope.prototype, {
    playing: getDefinition(PlayNode.prototype, 'playing')
});

function drawXLine(ctx, box, valueBox, x, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = '1';
    ctx.lineCap     = 'round';
    ctx.beginPath();
    var xPx = box[0] + box[2] * (x - valueBox[0]) / valueBox[2];
    ctx.moveTo(xPx, box[1]);
    ctx.lineTo(xPx, box[1] + box[3]);
    ctx.closePath();
    ctx.stroke();
}

function drawYLine(ctx, box, valueBox, y, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = '1';
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(box[0], box[1] + (box[3]) - (y * box[3]));
    ctx.lineTo(box[0] + box[2], box[1] + (box[3]) - (y * box[3]));
    ctx.closePath();
    ctx.stroke();
}

/**
drawCurvePositive(ctx, box, rate, data, color)

Draws a filled automation curve.

ctx:   canvas context
box:   array of 4 numbers describing view box
rate:  data points per px
data:  array of data points
color: base color
**/

function drawCurvePositive(ctx, box, rate, data, color) {
    let n = 0;

    ctx.lineWidth   = '2';
    ctx.lineCap     = 'round';

    ctx.beginPath();
    ctx.moveTo(
        box[0],
        box[1] + (box[3]) - (data[n] * box[3])
    );

    while (++n < data.length) {
        ctx.lineTo(
            box[0] + n / rate,
            box[1] + (box[3]) - (data[n] * box[3])
        );
    }

    // Stroke the waveform
    ctx.strokeStyle = color;
    ctx.stroke();

    // Now complete its area and then fill it
    ctx.lineTo(
        box[0] + box[2],
        box[1] + box[3]
    );

    ctx.lineTo(
        box[0],
        box[1] + box[3]
    );

    ctx.fillStyle = color + '2b';
    ctx.fill();
    ctx.closePath();
}

/* Canvas */

// Todo: in supported browsers, render the canvas directly to background
// https://stackoverflow.com/questions/3397334/use-canvas-as-a-css-background

const canvas  = document.createElement('canvas');
canvas.width  = 600;
canvas.height = 300;
const ctx     = canvas.getContext('2d');

// Oversampling produces graphs with fewer audio aliasing artifacts
// when curve points fall between pixels.
const samplesPerPixel = 4;

function requestEnvelopeDataURL(data, options) {
    // Allow 1px paddng to accomodate half of 2px stroke of graph line
    const viewBox  = [
        1,
        canvas.height * (1 - 1 / options.viewbox[3]),
        598,
        canvas.height / options.viewbox[3]
    ];
    const valueBox = [0, 1, 2.25, -1];

    // Draw lines / second
    const drawRate = samplesPerPixel * viewBox[2] / valueBox[2];
    const offline  = new OfflineAudioContext(1, samplesPerPixel * viewBox[2], 22050);
    const events   = data.map((e) => ({
        0: e[0] * drawRate / 22050,
        1: e[1],
        2: e[2],
        3: e[3] ? e[3] * drawRate / 22050 : undefined
    }));

    events.unshift({
        0: 0,
        1: 'step',
        2: options.yMax
    });

    const envelope = new Envelope(offline, {
        // Condense time by drawRate so that we generate samplePerPixel
        // samples per pixel.
        'attack': events
    });

    envelope.connect(offline.destination);
    envelope.start(valueBox[0], 'attack');
    envelope.stop(valueBox[2]);

    return offline
    .startRendering()
    .then(function(buffer) {
        //canvas.width = 300;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        options.xLines && options.xLines
        .map(options.xScale)
        .forEach((x) => drawXLine(ctx, viewBox, valueBox, x, options.gridColor));

        options.yLines && options.yLines
        .map(options.yScale)
        .forEach((y) => drawYLine(ctx, viewBox, valueBox, y, options.gridColor));

        const data = buffer.getChannelData(0).map(options.yScale);
        drawCurvePositive(ctx, viewBox, samplesPerPixel, data, options.valueColor);

        return canvas.toDataURL();
    });
}

const assign$d = Object.assign;

const config$3 = {
    path: window.customElementStylesheetPath || ''
};

const defaults$2 = {
    law: 'linear',
    min: 0,
    max: 1
};

const maxTapDuration = 0.25;
const maxDoubleTapDuration = 0.4;
const defaultTargetEventDuration$1 = 0.4;


/* Views */

function insertView(marker, views, index, view) {
    if (index > 0) {
        views[index - 1].node.after(view.node);
    }
    else if (views[index]) {
        views[index].node.before(view.node);
    }
    else {
        // Todo: put a marker node in place to handle collections
        marker.appendChild(view.node);
    }

    views.splice(index, 0, view);
}

function destroyView(view) {
    view.unobserve();
    view.node.remove();
}

function arrayMutate(views, changes, marker, createView, destroyView) {
    const index   = changes.index; 
    const removed = changes.removed;
    const added   = changes.added;

    // Cut views out
    var n = removed.length;
    while (n--) {
        if (!views[index + n]) {
            throw new Error('There is no handle to remove at index ' + (index + n));
        }
        
        destroyView(views[index + n]);
        console.log('Removed', views[index + n]);
    }

    views.splice(index, removed.length);

    // Add new views in
    var n = added.length;
    while (n--) {
        const view = createView(added[n]);
        insertView(marker, views, index, view);
        console.log('Added  ', view);
    }
}


const entryScope = {
    // Time
    '0': function(node, data) {
        console.log('x', data[0]);
        node.setAttribute('cx', data[0]);
    },

    '1': function(handle, data) {
        console.log('y', data[1]);
        node.setAttribute('cy', -data[1]);
    },

    '2': function(handle, data) {
        console.log('type', data[2]);
    },

    '3': function(handle, data) {
        console.log('duration', data[3]);
    }
};

function createHandleView(scope, data) {
    const node = create$1('circle', {
        class: 'control control-handle control-point',
        cx: '0',
        cy: '0',
        r:  '0.0375'
    });

    // Return a view object
    return {
        node: node,
        unobserve: observe('.', function(data, change) {
            return entryScope[change.name]
                && entryScope[change.name](node, data) ;
        }, data)
    };
}


/*
toCoordinates()
Turn gesture positions into coordinates
*/

function setXY(e, data) {
    const rect = box(data.svg);

    // New pixel position of control, compensating for initial
    // mousedown offset on the control
    const px = e.clientX - rect.left - data.offset.x;
    const py = e.clientY - rect.top - data.offset.y;

    // Normalise to 0-1, allowing x position to extend beyond viewbox
    const rx = clamp(0, 4, px / rect.height);
    const ry = clamp(0, 1, py / rect.height);

    // Assume viewbox is always full height, use box height as scale
    data.x = data.viewbox[0] + rx * data.viewbox[3];
    data.y = data.viewbox[1] + ry * data.viewbox[3];
}

const toCoordinates = overload((data, e) => e.type, {
    'mousemove': (data, e) => {
        data.events.push(e);
        const e0 = data.events[0];

        // If the duration is too short or the mouse has not travelled far
        // enough it is too early to call this a move gesture
        if ((e.timeStamp - e0.timeStamp) < maxTapDuration
            && (e.clientX - e0.clientX) < 4
            && (e.clientY - e0.clientY) < 4) {
            return data;
        }

        data.type = 'move';
        setXY(e, data);

        return data;
    },

    'mouseup': (data, e) => {
        data.events.push(e);
        data.duration = e.timeStamp / 1000 - data.time;

        // If the gesture does not yet have a type, check whether duration is
        // short and call it a tap
        if (!data.type && (data.duration < maxTapDuration)) {
            data.type = 'tap';
        }

        return data;
    }
});


/*
Handle gesture
*/

const getTime   = get$1('0');
const getTarget = get$1('target');
const getType   = get$1('type');

function match(getNode, fns) {
    return function() {
        const node = getNode.apply(this, arguments);
        const selectors = Object.keys(fns);
        var n = -1;

        while (selectors[++n]) {
            if (node.matches(selectors[n])) {
                return fns[selectors[n]].apply(this, arguments);
            }
        }

        throw new Error('Match not found in selectors');
    };
}

const handleGesture = match(getTarget, {
    '.duration-handle': overload(getType, {
        'move': function(data) {
            //const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[3] = data.x <= scope[0] ?
                // Just using it for a small number... Todo: check why this
                // objects being set to 0
                minExponential :
                data.x - scope[0] ;
            scope[2] = y;

            //notify(data.collection, '.', data.collection);

            return data;
        },

        default: noop
    }),

    '.control-handle': overload(getType, {
        'tap': function(data) {
            //const scope = getScope(data.target);
            cycleType(scope);
            //notify(data.collection, '.', data.collection);

            // We store scope on data here so that we may pick it up on
            // double-tap, at whcih time the target will no longer have scope
            // because it will have been replaced by another node.
            //
            // Two other approaches:
            //
            // 1. Get scope earlier in the chain. Not elegant, as earlier steps
            // really have nothing to do with scope.
            //
            // 2. Delay tap for 300ms or so until we can be certain it's not
            // going to turn into a double-tap. This is probably most
            // reasonable but will require a little guddling about.
            data.scope = scope;

            return data;
        },

        'double-tap': function(data) {
            // Pick up scope from previous tap data as outlined above.
            const scope = data.previous.scope;
            remove$1(data.collection, scope);
            //notify(data.collection, '.', data.collection);
            return data;
        },

        'move': function(data) {
            //const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[0] = data.x < 0 ? 0 : data.x ;
            scope[2] = scope[1] === 'exponential' ?
                y < minExponential ? minExponential : y :
                // Don't move target handles in the y direction, y is
                // controlled by duration handle
                scope[1] === 'target' ? scope[2] :
                y ;

            //notify(data.collection, '.', data.collection);
            data.scope.unitValue0(scope[2]);

            return data;
        },

        default: function(data) {
            console.log('Untyped gesture', data);
        }
    }),

    '*': overload(getType, {
        'double-tap': function(data) {
            const x = data.x;
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            // Insert new control point
            insert$1(getTime, data.collection, [x, 'step', y]);
            notify$1(data.collection, '.', data.collection);
            return data;
        },

        default: noop
    })
});

function assignValueAtBeat(value, event) {
    event.valueAtBeat = value;
    return event[2];
}


/*
Cycle types
*/

const types$1 = {
    "step": function(event) {
        event[1] = 'step';
        delete event[3];
    },

    "linear": function(event) {
        event[1] = 'linear';
        delete event[3];
    },

    "exponential": function(event) {
        event[1] = 'exponential';
        delete event[3];
    },

    "target": function(event) {
        event[1] = 'target';
        if (typeof event[3] !== 'number') {
            event[3] = defaultTargetEventDuration$1;
        }
    }
};

function cycleType(event) {
    const arr = Object.keys(types$1);
    const i = arr.indexOf(event[1]);
    return types$1[arr[(i + 1) % arr.length]](event);
}


/**
<envelope-control>
**/

element('envelope-control', {
    template: function(elem, shadow) {
        const link  = create$1('link',  { rel: 'stylesheet', href: config$3.path + 'envelope-control.css' });
        const css   = create$1('style', ':host {}');
        const label = create$1('label', { for: 'svg', children: [create$1('slot')] });
        const svg   = create$1('svg', {
            class: 'envelope-svg',
            viewBox: '0 -1.125 2 1.125', 
            preserveAspectRatio: 'xMinYMid slice',
            html: `<defs>
                    <linearGradient id="handle-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop class="stop-1" offset="0%"/>
                        <stop class="stop-2" offset="100%"/>
                    </linearGradient>
                </defs>`
        });

        shadow.appendChild(link);
        shadow.appendChild(css);
        shadow.appendChild(label);
        shadow.appendChild(svg);

        // Get the :host {} style rule from style
        const style = style.sheet.cssRules[0].style;

        const views   = [];
        var unobserve = noop;

        const privates$1 = privates(elem);
        var promise = Promise.resolve();

        var graphOptions = {
            yMin:   0,//this.min,
            yMax:   1,//this.max,
            xLines: [0.5, 1, 1.5, 2],
            //yLines: yLines,
            xScale: id,
            yScale: (y) => normalise[yTransform](this.min, this.max, y),
            viewbox: [0, -1.125, 2, 1.125]
                //privates.svg
                //.getAttribute('viewBox')
                //.split(/\s+/)
                //.map(parseFloat)
        };

        function renderBackground(url) {
            svg.style.backgroundImage = 'url(' + url + ')';
        }

        privates$1.scope = {
            'value': function(array) {
                console.log('scope.value', array);
                unobserve();
                unobserve = observe('.', (array, changes) => {
                    arrayMutate(views, changes, svg, createHandleView, destroyView);
                    console.log(array.length, JSON.stringify(array));

                    // Keep rendering smoothish by throttling dataURL renders to the
                    // rate at which they can be generated by the OfflineAudioContext
                    if (!promise) { return; }
    
                    promise.then(() => {
                        array
                        .sort(by$1(getTime))
                        .reduce(assignValueAtBeat, 0);
    
                        const style = getComputedStyle(elem);
                        graphOptions.gridColor = style.getPropertyValue('--grid-color');
                        graphOptions.valueColor = style.getPropertyValue('--value-color');
    
                        promise = requestEnvelopeDataURL(array, graphOptions)
                        .then(renderBackground);
                    });
    
                    promise = undefined;
                }, array);
            },

            'ticks': noop,
            'steps': noop,
            'unitZero': noop
        };
    },

    construct: function(elem, shadow, internals) {
        // Setup internal data store `privates`
        const privates$1 = privates(elem);
        const data     = privates$1.data  = Observer(assign$d({}, defaults$2));
    
        privates$1.element   = elem;
        privates$1.shadow    = shadow;
        privates$1.internals = internals;

        // Attach template scope to data 
        observe('.', function(data, change) {
            return privates$1.scope[change.name]
                && privates$1.scope[change.name](data[change.name]) ;
        }, data);

        var yTransform = data.law;
        yTransform = yTransform ?
            toCamelCase(yTransform) :
            'linear' ;

        // Todo: We never .stop() this stream, does it eat memory? Probs.
        gestures({ threshold: 0 }, shadow.querySelector('svg'))
        .scan(function(previous, gesture) {
            const e0 = gesture.shift();
            const controlBox = box(e0.target);
            const time = e0.timeStamp / 1000;

            const context = {
                target: e0.target,
                time:   time,
                svg:    privates$1.svg,
                yMin:   elem.min,
                yMax:   elem.max,
                yTransform: yTransform,
                events: [e0],
                scope: privates$1.scope,

                // Grab the current viewBox as an array of numbers
                // This is bollocks, should be part of scope/template code
                viewbox: elem.graphOptions ?
                    elem.graphOptions.viewbox :
                    [],

                collection: elem.value,

                previous: previous,

                offset: e0.target === e0.currentTarget ?
                    // If target is the SVG
                    {
                        x: 0,
                        y: 0
                    } :
                    // If target is an object in the SVG
                    {
                        x: e0.clientX - (controlBox.left + controlBox.width / 2),
                        y: e0.clientY - (controlBox.top + controlBox.height / 2)
                    }
            };

            // If it's within maxDoubleTapDuration of the previous gesture,
            // it's a double tap
            if (previous
                && previous.type === 'tap'
                && time - previous.time < maxDoubleTapDuration) {
                data.type   = 'double-tap';
                data.target = previous.target;
            }

            gesture
            .scan(toCoordinates, context)
            .each(handleGesture);

            return context;
        })
        .each(noop);
    },

    attributes: attributes,

    properties: assign$d({}, properties, {
        type: {
            value: 'array',
            enumerable: true
        },

        value: {
            get: function() {
                const privates$1 = privates(this);
                return privates$1.data.value;
            },

            set: function(value) {
                const privates$1 = privates(this);
                const data     = privates$1.data;
                const scope    = privates$1.scope;

                if (value === data.value) {
                    return;
                }

                if (typeof value === 'string') {
                    value = parseEnvelope(value);
                }

                // Force value array to contain at least one control point
                // at [0,1] if it does not already have one at time 0
                if (!value.length || value[0][0] !== 0) {
                    value.unshift([0, 1, 'step']);
                }

                data.value = Observer(value);
            },

            enumerable: true
        }
    })
});
