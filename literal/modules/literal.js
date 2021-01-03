
import get           from '../../../fn/modules/get.js';

import { equals }    from '../../../fn/modules/equals.js';
import * as registry from './functions.js';
import renderString  from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { red, green, dim, dimgreen, dimgreendim } from './log.js';


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

const reserved = ['this', 'data', 'await', 'console', 'function', 'global', 'Promise'];

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

function smoosh(array, param, string) {
    return param && param.then ?
        param.then((value) => string + value) :
        string + renderString(param) ;
}

function render(literal) {
    return Promise.all(
        literal.map((a, i, array) => (i + 1 < arguments.length ?
            smoosh(array, arguments[i + 1], a) :
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

function prependComment(source, string) {
    return (source.endsWith('.css.literal') || source.endsWith('.js.literal')) ?
        '/* Literal: "' + source + '" */\n\n' + string.replace(/^\s*, ''/) :
    string.replace(/^\s(\<\!DOCTYPE html\>)?/, ($0, doctype) =>
        (doctype ? doctype + '\n' : '') +
        '<!-- Literal: "' + source + '" -->\n\n'
    );
}

export default function Literal(context, string, source, target) {
    if (!string) {
        throw new Error('Template is not a string');
    }

    if (cache[source]) {
        return cache[source];
    }

    const fns = Object.assign({}, context, registry, {
        // Functions are executed in the context of the module ./literal.js
        // so we need to rewrite them to that context
        include: (url, context) => registry.include(rewriteURL(source, target, url), context, source, target),
        imports: (url)          => registry.imports(url, source, target),
        request: (url, name)    => registry.request(url, source, target),
        docs:    (...urls)      => registry.docs(source, target, ...urls)
    });

    const entries = Object.entries(fns);
    const params  = entries.map(get(0));
    const api     = entries.map(get(1));
    const vars    = [];

    if (DEBUG) {
        // Add source comment to top of template
        string = prependComment(source, string);
    }

    const code = createCode(params, vars, string);

    if (DEBUG) {
        console.log(dimgreendim, 'Literal', 'compile', source, vars.length ? '{ ' + vars.join(', ') + ' }'  : '');

        // Catch parsing of template for SyntaxErrors
        try {
            var fn = new AsyncFunction('render', 'data', ...params, code);
        }
        catch(e) {
            e.code = code;
            e.literal = string;
            throw(e);
        }
    }
    else {
        // Name the parameters
        var fn = new AsyncFunction('render', 'data', ...params, code);
    }

    // fn(render, data, ...functions)
    return cache[source] = (data) => fn
        // Call fn with a blank `this` that we can use to set variables on,
        // the render fn for nested rendering, our data, and the fn library api
        .call({}, render, data, ...api)
        .then((text) => rewriteURLs(source, target, text));
}
