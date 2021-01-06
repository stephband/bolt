
import get           from '../../../fn/modules/get.js';

import { equals }    from '../../../fn/modules/equals.js';
import compileAsyncFn from '../../../fn/modules/compile-async-function.js';
import * as registry from './functions.js';
import renderString  from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { red, green, dim, dimgreen, dimgreendim, dimreddim } from './log.js';


const DEBUG = true;

/**
Template(string)
**/

function parseVars(string) {
    if (!string || !string.matchAll) {
        throw new Error();
    }

    return Array
        .from(string.matchAll(/\$\{\s*([\w][\w\d]*)/g))
        .map((captures) => captures[1]);
}

/**
createCode(functions, template)
**/

const reserved = ['Array', 'Object', 'this', 'data', 'await', 'console', 'function', 'global', 'Promise'];

function createCode(params, names, template) {
    const vars = parseVars(template);

    var n = -1;
    var name;
    var code = '';

    while (name = vars[++n]) {
        // Variable already declared
        if (names.includes(name) || params.includes(name) || reserved.includes(name)) {
            continue;
        }

        names.push(name);

        // Declare variables
        code += 'var ' + name + ' = data.' + name + ';\n' ;
    }

    return code + 'return render`' + template + '`;';
}

/**
render(array, param)
**/

const join = (strings) => strings.join('');

function stringify(array, param, string) {
    return param && typeof param === 'object' ? (
        param.then ? param.then((value) => string + value) :
        //param.join ? string + param.join('') :
        string + renderString(param)
    ) :
    string + renderString(param) ;
}

function render(literal) {
    return Promise.all(
        literal.map((a, i, array) => (i + 1 < arguments.length ?
            stringify(array, arguments[i + 1], a) :
            a
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

export default function Literal(context, string, source, target) {
    if (!string) {
        throw new Error('Template is not a string');
    }

    if (cache[source]) {
        return cache[source];
    }

    const scope = Object.assign({}, context, registry, {
        // Functions are executed in the context of the module ./literal.js
        // so we need to rewrite them to that context
        include: (url, context) => registry.include(rewriteURL(source, target, url), context, source, target),
        imports: (url)          => registry.imports(source, target, url),
        request: (url, name)    => registry.request(url, source, target),
        docs:    (...urls)      => registry.docs(source, target, ...urls),
        render:  render
    });

    const names = Object.keys(scope);
    const vars  = [];

    if (DEBUG) {
        // Add source comment to top of template
        string = prependComment(source, target, string);
    }

    const code = createCode(names, vars, string);

    if (DEBUG) {
        console.log(dimgreendim, 'Literal', 'compile', source, vars.length ? '{ ' + vars.join(', ') + ' }'  : '');

        // Catch parsing of template for SyntaxErrors
        try {
            var fn = compileAsyncFn(scope, 'data', code);
        }
        catch(e) {
            e.code = code;
            e.literal = string;
            console.log(dimreddim, 'Literal', e.message, '\n\n', code);
            throw(e);
        }
    }
    else {
        var fn = compileAsyncFn(scope, 'data', code);
    }

    // fn(render, data, ...functions)
    return cache[source] = (data) => fn
        // Call fn with a blank `this` context that we can use to set 
        // variables on inside the template, and our data
        .call({}, data)
        .then((text) => rewriteURLs(source, target, text));
}
