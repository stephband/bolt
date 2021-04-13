
import compileAsyncFn from '../../../fn/modules/compile-async.js';
import * as library   from './functions.js';
import renderString   from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { dimgreendim, dimyellow, dimred, dim, red, yellow, redwhitedim } from './log.js';


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

function logCompile(source, scope, params) {
    console.log(dimgreendim, 'Literal', 'compile', source + ' { ' + params + ' }');

    // Sanity check params for scope overrides
    params
    .split(/\s*[,\s]\s*/)
    .filter((name) => name !== '')
    .forEach((name) => {
        if (!isValidConst(name)) {
            console.log(redwhitedim, 'Word cannot be used as parameter name', '{ ' + name + ' }');
        }

        if (scope[name]) {
            console.log(dimred, 'Literal', 'warning', 'const ' + name
                + ' overrides scope ' + typeof scope[name] + ' '
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

function isValidConst(name) {
    return /^[a-zA-Z]/.test(name)
        && !illegal.includes(name)
        && name !== 'data';
}

function sanitiseVars(vars) {
    const names = vars.split(/\s*[,]\s*/).filter(isValidConst).sort();
    return names.join(', ');
}

export default function Literal(parameters, template, source) {
    if (typeof template !== 'string') {
        throw new Error('Template is not a string ' + source);
    }

    // Extract names, throw out illegals, format params
    const params = sanitiseVars(parameters);

    if (cache[source + '(' + params + ')']) {
        return cache[source + '(' + params + ')'];
    }

    // Where there are params define them as consts
    const code = (params.length ? 'const {' + params + '} = data;\n' : '')
        + 'return render`' + template + '`;\n';

    var fn;
    if (DEBUG) {
        logCompile(source, library, params);
        // scope, paramString, code [, context]        
        try {
            fn = compileAsyncFn(library, 'data = {}, render, include, imports, documentation', code);
        }
        catch(e) {
            logError(source, template, e);
            throw e;
        }
    }
    else {
        fn = compileAsyncFn(library, 'data = {}, render, include, imports, documentation', code);
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
            data,
            // render()
            render,
            // include()
            (url, data) => library.include(source, target, rewriteURL(source, target, url), data),
            // imports()
            (url)       => library.imports(source, target, url),
            // documentation
            (...urls)   => library.documentation(source, target, ...urls)
        )
        .then(DEBUG ?
            (text) => prependComment(source, target, rewriteURLs(source, target, text)) :
            (text) => rewriteURLs(source, target, text)
        ) ;
    };
}
