
import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import * as library   from './functions.js';
import renderString   from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { dimgreendim, dimyellow, dim, red, yellow, redwhitedim } from './log.js';


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
    console.log(e.stack);
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
            Promise.all(value).then((strings) => string + strings.join('')) :
            // Otherwise join to string immediately
            string + value.join('') :
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
Literal(params, template)
Returns a function that renders a literal template.
**/

// Store render functions against their template strings
const cache = {};

function prependComment(source, target, string) {
    return (target.endsWith('.css') || target.endsWith('.js')) ?
        '/* Literal template "' + source + '" */\n' + string.replace(/^\s*, ''/) :
    string.replace(/^\s(\<\!DOCTYPE html\>)?/, ($0, doctype) =>
        (doctype ? doctype + '\n' : '') +
        '<!-- Literal template "' + source + '" -->\n'
    );
}

export default function Literal(params, template, source) {
    if (!template) {
        throw new Error('Template is not a string');
    }

    // Extract names, format params
    const names = params.split(/\s*[,\s]\s*/).sort();
    params = names.join(', ');

    if (cache[source + '(' + params + ')']) {
        return cache[source + '(' + params + ')'];
    }

    // Where there are params define them as const
    const code = (names.length ? 'const {' + params + '} = arguments[4];' : '')
        + 'return render`' + template + '`;';

    var fn;
    if (DEBUG) {
        logCompile(source, library, params, names);
        try { fn = compileAsyncFn(library, 'render, include, imports, documentation', code); }
        catch(e) {
            logError(source, template, e);
            throw e;
        }
    }
    else {
        fn = compileAsyncFn(library, 'render, include, imports, documentation', code);
    }

    // Store a reference to the global object
    const self = this;

    // fn(render, data, ...functions)
    return cache[source + '(' + params + ')'] = function literally(data, target) {
        return fn
        // Where this is just a reference to the global context, create a new 
        // context object for the `this` keyword inside the template. If this
        // function is a used as a method, `this` refers to the object.
        .call(this === self ? {} : this, 
            render,
        // TODO: is there a better way of passing source, target to library 
        // functions? Bind this?
            (url, data) => library.include(source, target, rewriteURL(source, target, url), data),
            (url)       => library.imports(source, target, url),
            (...urls)   => library.documentation(source, target, ...urls),
            data
        )
        .then(DEBUG ?
            (text) => prependComment(source, target, rewriteURLs(source, target, text)) :
            (text) => rewriteURLs(source, target, text)
        ) ;
    };
}
