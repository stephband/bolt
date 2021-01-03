
import get           from '../../../fn/modules/get.js';

import { equals }    from '../../../fn/modules/equals.js';
import * as registry from './functions.js';
import renderString  from './to-text.js';
import { rewriteURL, rewriteURLs } from './url.js';
import { red, green, dim } from './log.js';


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

const reserved = ['this', 'await', 'console', 'function', 'global', 'Promise'];

function createCode(names, template) {
    const vars = parseVars(template);

    var n = -1;
    var name;
    // fn(render = compose, fns, Value.of, this = context)
    var code = '';//'const { ' + names.join(', ') + ' } = arguments[1];\n';

    while (name = vars[++n]) {
        // Variable already declared
        if (names.includes(name) || reserved.includes(name)) {
            continue;
        }

        names.push(name);

        // Declare variables
        // Don't think all that stuff was needed now we have a fn library
        //code += //Value.prototype[name] ?
            // Function
            //'var ' + name + ' = (...params) => Pipe(this).' + name + '(...params);\n' :
            // Property of context
        code += 'var ' + name + ' = this.' + name + ';\n' ;
    }

    return code + 'return render`' + template + '`;';
}

/**
render(array, param)
**/

const join = (strings) => strings.join('');

function render(array, param, string) {
    return param && param.then ?
        param.then((value) => string + value) :
        string + renderString(param) ;
}

function renderText(literal) {
    return Promise.all(
        literal.map((a, i, array) => (i + 1 < arguments.length ?
            render(array, arguments[i + 1], a) :
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

function createAsyncFunction(names, code) {
    return new AsyncFunction('render', ...names, code);
}

export default function Literal(context, string, source, target) {
    if (!string) {
        throw new Error('Template is not a string');
    }

    if (cache[string]) {
        return cache[string];
    }

    const fns = Object.assign({}, context, registry, {
        // Functions are executed in the context of the module ./literal.js
        // so we need to rewrite them to that context
        include: (url, context) => registry.include(rewriteURL(source, target, url), context, source, target),
        fetch:   (url, name)    => registry.fetch(url, name, source, target)
    });

    const entries = Object.entries(fns);
    const names   = entries.map(get(0));
    const api     = entries.map(get(1));
    const code    = createCode(names.slice(), string);

    if (DEBUG) {
        // Catch parsing of template for SyntaxErrors
        try {
            var fn = createAsyncFunction(names, code);
        }
        catch(e) {
            e.code = code;
            throw(e);
        }

        console.log(green + ' ' + dim, 'Literal compiled template', source);
    }
    else {
        var fn = createAsyncFunction(names, code);
    }

    // fn(data, render, ...names)
    return cache[string] = (context) => fn
        .call(context, renderText, ...api)
        .then((text) => rewriteURLs(source, target, text));
}
