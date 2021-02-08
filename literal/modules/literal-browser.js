
/* Quick browser version */

import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import renderString   from './to-text.js';
import { dimgreendim, dimyellow, dim, red, yellow, redwhitedim } from './log-browser.js';


const DEBUG = true;

const illegal = [
    // Reserved by literal
    "render",
    // Globals
    'NaN', 'Infinity', 'undefined',
    // ES reserved words
    'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 
    'enum', 'eval', 'null', 'this', 'true', 'void', 'with', 'await', 'break', 
    'catch', 'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 
    'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 
    'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 
    'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 
    'instanceof'
];

const hints = {
    'Unexpected':
        '• Non-template backticks must be escaped: \\`\n' +
        '• ${} accepts any valid JS expression\n'
};

function logCompile(source, scope, params, names) {
    console.log(dimgreendim, 'Literal', 'compile', source + ' { ' + params + ' }');

    // Sanity check params for scope overrides
    names.forEach((name) => {
        if (illegal.includes(name)) {
            console.log(redwhitedim, 'SyntaxError', 'Reserved word cannot be used as parameter name', '{ ' + params + ' }')
            throw new SyntaxError('Reserved word cannot be used as parameter name ' + name);
        }

        if (scope[name]) {
            console.log(dimyellow, 'Literal', 'warning', 'param ' + name
                + ' overrides literal ' + typeof scope[name] + ' '
                + (typeof scope[name] === 'function' ? name + '()' : name));
        }
    });
}

function logError(source, template, e) {
    // Print source code to console
    console.log('');
    console.log(dim, template.slice(0, 1000) + (template.length > 1000 ? '\n\n...\n' : '\n'));
    console.log(red, e.constructor.name + ':', e.message, 'parsing', source);
    const key = e.message.slice(0, 10);
    if (hints[key]) { console.log(yellow, '\nHints\n' + hints[key]); }
    console.log('');
    //console.log(e.stack);
    console.log('');
}


/* Scope functions */

import overload    from '../../../fn/modules/overload.js';
import { addDate } from '../../../fn/modules/date.js';
import { addTime } from '../../../fn/modules/time.js';
import by          from '../../../fn/modules/by.js';
import equals      from '../../../fn/modules/equals.js';
import matches     from '../../../fn/modules/matches.js';
import get         from '../../../fn/modules/get-path.js';
import px, { em, rem } from './parse-length.js';
import exec        from '../../../fn/modules/exec.js';
import slugify     from '../../../fn/modules/slugify.js';
import Pipe        from './pipe.js';


/**
add(number|date|time)

Adds `n` to value. Behaviour is overloaded to accept various types of 'n'.
Where `n` is a number, it is summed with value. So to add 1 to any value:

```html
${ pipe(add(1), data.number) }
```

Where 'n' is a duration string in date-like format, value is expected to be a
date and is advanced by the duration. So to advance a date by 18 months:

```html
${ pipe(add('0000-18-00'), data.date) }
```

Where 'n' is a duration string in time-like format, value is expected to be a
time and is advanced by the duration. So to put a time back by 1 hour and 20
seconds:

```html
${ pipe(add('-01:00:20'), data.time) }
```
**/

function toAddType(n) {
    const type = typeof n;
    return type === 'string' ?
        /^\d\d\d\d(?:-|$)/.test(n) ? 'date' :
        /^\d\d(?::|$)/.test(n) ? 'time' :
        'string' :
    type;
}



/**
render(array, param)
**/

const join = (strings) => strings.join('');
const isPromise = (object) => object && object.then;

function stringify(value, string) {
    return value && typeof value === 'object' ? (
        // If expression returns a promise
        value.then ? value.then((value) => string + value) :
        // If expression returns an array with promises
        value.join ? value.find(isPromise) ?
            // Resolve promises and join to string
            Promise.all(value).then((strings) => string + strings.map(renderString).join('')) :
            // Otherwise join to string immediately
            string + value.map(renderString).join('') :
        // pass any other value to renderString
        string + renderString(value)
    ) :
    string + renderString(value) ;
}

function render(strings) {
    return Promise.all(
        strings.map((string, i) => (i + 1 < arguments.length ?
            stringify(arguments[i + 1], string) :
            string
        ))
    )
    .then(join);
}

const lib = {
    add: overload(toAddType, {
        'date': addDate,
        'time': addTime,
        'string': (a) => (b) => b + a,
        'number': (a) => (b) => b + a,
        'default': function(n) {
            throw new Error('add(value) does not accept values of type ' + typeof n);
        }
    }),

    by, entries: Object.entries, em, equals, exec, get, keys: Object.keys,
    matches, Pipe, px, rem, render, slugify, values: Object.values
};

/**
Literal(params, template)
Returns a function that renders a literal template.
**/

// Store render functions against their template strings
const cache   = {};

export default function Literal(params, template, source) {
    if (!template) {
        throw new Error('Template is not a string');
    }

    // Extract names, format params
    const names = params.split(/\s*[,\s]\s*/).sort();
    params = names.join(', ');
    source = source || '';
    const key = source + '(' + params + ')';

    // Return cached fn
    if (cache[key]) {
        return cache[key]; 
    }

    const code = 'return render`' + template + '`;';
    const self = this;

    logCompile(source, lib, params, names);

    var fn;

    try {
        fn = compileAsyncFn(lib, params, code);
    }
    catch(e) {
        logError(source, template, e);
        throw e;
    }

    return cache[key] = function literal() {
        return fn.apply(this === self ? {} : this, arguments);
    };
}

export function register(name, fn) {
    lib[name] = fn;
}
