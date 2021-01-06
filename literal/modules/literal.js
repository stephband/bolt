
import get           from '../../../fn/modules/get.js';

import { equals }    from '../../../fn/modules/equals.js';
import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import * as registry from './functions.js';
import renderString  from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { red, green, dim, dimgreen, dimgreendim, dimreddim, dimyellow } from './log.js';


const DEBUG = true;

const illegal = [
    // Literal reserved words
    'render', 
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

function stringify(param, string) {
    return param && typeof param === 'object' ? (
        param.then ? param.then((value) => string + value) :
        //param.join ? string + param.join('') :
        string + renderString(param)
    ) :
    string + renderString(param) ;
}

function render(strings) {
    return Promise.all(
        strings.map((string, i, array) => (i + 1 < arguments.length ?
            stringify(arguments[i + 1], string) :
            string
        ))
    )
    .then(join);
}

/**
Literal()
**/

// Store render functions against their template strings
const cache = {};

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

function prependComment(source, target, string) {
    return (target.endsWith('.css') || target.endsWith('.js')) ?
        '/* Literal source "' + source + '" */\n\n' + string.replace(/^\s*, ''/) :
    string.replace(/^\s(\<\!DOCTYPE html\>)?/, ($0, doctype) =>
        (doctype ? doctype + '\n' : '') +
        '<!-- Literal source "' + source + '" -->\n\n'
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

    const scope = Object.assign({}, registry, {
        render:  render,
        include: (url, data) => registry.include(rewriteURL(source, target, url), data, source, target),
        imports: (url)       => registry.imports(source, target, url),
        request: (url, name) => registry.request(url, source, target),
        docs:    (...urls)   => registry.docs(source, target, ...urls)
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
                throw new Error('Literal param cannot override built-in ' + name);
            }

            if (scope[name]) {
                console.log(dimyellow, 'Literal', 'warning', 'param ' + name + ' overrides scope ' + typeof scope[name] + ' ' + (typeof scope[name] === 'function' ? name + '()' : name));
            }
        });

        // Catch parsing of template for SyntaxErrors
        try {
            var fn = compileAsyncFn(scope, params, code);
        }
        catch(e) {
            e.code = code;
            e.literal = template;
            console.log(dimreddim, 'Literal', e.message, '\n\n', code);
            throw(e);
        }
    }
    else {
        var fn = compileAsyncFn(scope, params, code);
    }

    const self = this;

    // fn(render, data, ...functions)
    return cache[source + '(' + params + ')'] = function() {
        return fn
        // Call fn with a blank `this` context that we can use to set 
        // variables on inside the template, and our data
        .apply(this === self ? {} : this, arguments)
        .then((text) => rewriteURLs(source, target, text)) ;
    };
}
