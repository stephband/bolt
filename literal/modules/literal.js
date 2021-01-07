
import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import * as registry from './functions.js';
import renderString  from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { dimgreendim, dimreddim, dimyellow } from './log.js';


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

export default function Literal(params, template, source, target) {
    if (!template) {
        throw new Error('Template is not a string');
    }

    // Format params
    params = params.split(/\s*[,\s]\s*/).join(', ');

    if (cache[source + '(' + params + ')']) {
        return cache[source + '(' + params + ')'];
    }

    // Overload scope functions that import from other sources
    const scope = Object.assign({}, registry, {
        render:  render,
        include: (url, data) => registry.include(rewriteURL(source, target, url), data, source, target),
        imports: (url)       => registry.imports(source, target, url),
        documentation: (...urls)   => registry.documentation(source, target, ...urls)
    });

    if (DEBUG) {
        // Add source comment to top of template
        template = prependComment(source, target, template);
    }

    const code = 'return render`' + template + '`;';

    if (DEBUG) {
        console.log(dimgreendim, 'Literal', 'compile', source + ' (' + params + ')');

        // Sanity check params for scope overrides
        params.split(/\s*[,\s]\s*/).forEach((name) => {
            if (illegal.includes(name)) {
                throw new Error('Literal param cannot override reserved ' + name);
            }

            if (scope[name]) {
                console.log(dimyellow, 'Literal', 'warning', 'param ' + name + ' overrides literal ' + typeof scope[name] + ' ' + (typeof scope[name] === 'function' ? name + '()' : name));
            }
        });

        // Catch parsing of template for SyntaxErrors
        try {
            var fn = compileAsyncFn(scope, params, code);
        }
        catch(e) {
            e.code = code;
            e.template = template;
            console.log(dimreddim, 'Literal', e.message, '\n\n', code);
            throw(e);
        }
    }
    else {
        var fn = compileAsyncFn(scope, params, code);
    }

    // Store a reference to the global object
    const self = this;

    // fn(render, data, ...functions)
    return cache[source + '(' + params + ')'] = function render() {
        return fn
        // Where this is just a reference to the global context, create a new 
        // context object for the `this` keyword inside the template. If this
        // function is a used as a method, `this` refers to the 
        .apply(this === self ? {} : this, arguments)
        .then((text) => rewriteURLs(source, target, text)) ;
    };
}
