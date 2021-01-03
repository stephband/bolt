
import get           from '../../fn/modules/get.js';

import { equals }    from '../../fn/modules/equals.js';
import Value         from './value.js';
import * as registry from './functions.js';
import renderString  from './to-string.js';
import { red, green, dim }       from './log.js';

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
        code += Value.prototype[name] ?
            // Function
            'var ' + name + ' = (...params) => Pipe(this).' + name + '(...params);\n' :
            // Property of context
            'var ' + name + ' = this.' + name + ';\n' ;
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

function compose(literal) {
    return Promise.all(
        literal.map((a, i, array) => (i + 1 < arguments.length ?
            render(array, arguments[i + 1], a) :
            a
        ))
    )
    .then(join);
}

// Store render functions against their template strings
const cache = {};
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export default function Template(functions, string) {
    if (!string) {
        throw new Error('Template is not a string');
    }

    const isEmpty = equals({}, functions);

    if (isEmpty && cache[string]) { return cache[string]; }

    const fns = isEmpty ?
        registry :
        Object.assign({}, functions, registry) ;

    const entries = Object.entries(fns);
    const names   = entries.map(get(0));
    const values  = entries.map(get(1));

    // TEMP
    const vars    = names.slice();
    const code    = createCode(vars, string);
    var fn;

    if (DEBUG) {
        // Catch parsing of template for SyntaxErrors
        try { fn = new AsyncFunction('render', ...names, code); }
        catch(e) {
            e.code = code;
            throw(e);
        }

        console.log(green + ' ' + dim, 'Template compiled', 'context', '{ ' + vars.join(', ') + ' }');
        //console.log(Object.toString.apply(fn));
    }
    else {
        fn = new AsyncFunction('render', code);
    }

    const render = (context) => fn.call(context, compose, ...values);
    if (isEmpty) { cache[string] = render; }
    return render;
}

// Enable #{ each('') }
Value.prototype.each = function(template) {
    const array  = this.value;
    const render = Template({}, template);
    return Promise.all(array.map(render)).then(join);
};
