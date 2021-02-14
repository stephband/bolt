
/* Quick browser version */

import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import renderString   from './to-text.js';
import log from './log-browser.js';


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
    log('compile', source + ' { ' + params + ' }');

    // Sanity check params for scope overrides
    names.forEach((name) => {
        if (illegal.includes(name)) {
            console.log(redwhitedim, 'SyntaxError', 'Reserved word cannot be used as parameter name', '{ ' + params + ' }')
            throw new SyntaxError('Reserved word cannot be used as parameter name ' + name);
        }

        if (scope[name]) {
            log('warning', 'param ' 
                + name
                + ' overrides literal ' + typeof scope[name] + ' '
                + (typeof scope[name] === 'function' ? name + '()' : name),
                'orange'
            );
        }
    });
}

function logError(source, template, e) {
    // Print source code to console
    console.log('');
    console.log(template.slice(0, 1000) + (template.length > 1000 ? '\n\n...\n' : '\n'));
    console.log(e.constructor.name + ':', e.message, 'parsing', source);
    const key = e.message.slice(0, 10);
    if (hints[key]) { console.log('\nHints\n' + hints[key]); }
    console.log('');
    //console.log(e.stack);
    console.log('');
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


/**
compile(scope, params, template)
Returns a function that renders a literal template.
**/

// Store render functions against their template strings
const cache = {};

export default function compile(scope, params, template, source) {
    if (!template) {
        throw new Error('Template is not a string');
    }

    // Extract names, format params
    // const names = params.split(/\s*[,\s]\s*/).sort();
    const names = params.split(/\s*[,\s]\s*/);
    //params = names.join(', ');
    source = source || '';
    const key = source + '(' + params + ')';

    // Return cached fn
    if (cache[key]) {
        return cache[key]; 
    }

    const code = 'return render`' + template + '`;';
    const self = this;

    // Make it impossible to override render
    scope.render = render;

    logCompile(source, scope, params, names);

    var fn;

    try {
        fn = compileAsyncFn(scope, params, code);
    }
    catch(e) {
        logError(source, template, e);
        throw e;
    }

    return cache[key] = function literal() {
        return fn.apply(this === self ? {} : this, arguments);
    };
}
