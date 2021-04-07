
/* Quick browser version */

import id     from '../../../fn/modules/id.js';
import compileAsync from '../../../fn/modules/compile-async-function.js';
import toText from './to-text.js';
import log    from './log-browser.js';


const illegals = [
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

const indent = '  ';

function logCompile(source, scope, vars) {
    log('compile', source + ' { ' + vars + ' }');

    // Sanity check params for scope overrides
    vars.split(/\s*,\s*/).forEach((name) => {
        if (illegals.includes(name)) {
            throw new SyntaxError('Reserved word ' + name + ' cannot be used as template variable');
        }

        if (scope[name]) {
            log('warning', 'template variable ' 
                + name
                + ' overrides scope ' + typeof scope[name] + ' '
                + (typeof scope[name] === 'function' ? name + '()' : name),
                'red'
            );
        }
    });
}

function logError(source, template, e) {
    // Print source code to console
    console.log('');
    console.log(template.slice(0, 1000) + (template.length > 1000 ? '\n\n...\n' : '\n'));
    console.log(
        e.constructor.name + ':',
        e.message, 
        'parsing', 
        '"' + (source.length < 60 ? source : source.slice(0,16) + ' ... ' + source.slice(-8)) + '"'
    );
    const key = e.message.slice(0, 10);
    if (hints[key]) { console.log('\nHints\n' + hints[key]); }
    console.log('');
    //console.log(e.stack);
    console.log('');
}


/**
render(array, param)
**/

//const join = (strings) => strings.join('');
const reduce = (values) => values.reduce((output, value) => (
    // Ignore undefined and empty strings
    value === '' || value === undefined ?
        output :
        output + value
));

const isPromise = (object) => object && object.then;

function stringify(value, string, render) {
    return value && typeof value === 'object' ? (
        // If expression returns a promise
        value.then ?
            value.then((value) => (
                string === '' ?
                    value :
                    string + value
            )) :
        // If expression returns an array with promises
        value.find ?
            value.find(isPromise) ?
                // Resolve promises and join to string
                Promise.all(value).then((strings) => (
                    string === '' ?
                        reduce(strings.map(render)) :
                        string + reduce(strings.map(render))
                )) :
            // Otherwise join to string immediately
            string === '' ? 
                reduce(value.map(render)) :
                string + reduce(value.map(render)) :
        // pass any other value to render
        string === '' ?
            render(value) :
            string + render(value)
    ) :
    string === '' ?
        render(value) :
        string + render(value) ;
}

function renderString(strings, ...values) {
    return Promise.all(strings.map((string, i) => (
        i < values.length ?
            // Strings 0 to n - 1
            stringify(values[i], string, toText) :
            // Final string
            string === '' ? undefined :
            string
    )))
    .then(reduce);
}

function renderValue(strings, ...values) {
    return Promise.all(strings.map((string, i) => (
        console.log(typeof string, string),
        i < values.length ?
            // Strings 0 to n - 1
            stringify(values[i], string, id) :
            // Final string
            string === '' ? undefined :
            string
    )))
    .then(reduce);
}

function valueify(values, value) {
    if (!value) {
        values.push(value);
    }
    else if (value.then) {
        values.push(value);
    }
    else if (value.forEach) {
        values.push.apply(values, value);
    }
    else {
        values.push(value);
    }
}

function renderValues(strings) {
    const values = [];
    var n = -1 ;
    var value;
    while (strings[++n] !== undefined) {
        // If a string is more than just space push it in
        if (/[^\s]/.test(strings[n])) {
            values.push(strings[n].trim());
        }

        // If a value is more than nothing push it in
        value = arguments[n + 1];
        if (value !== undefined && value !== '') {
            console.log('VALUE', value);
            valueify(values, value);
        }
    }

    return Promise.all(values).then((values) => values.flat(8));
}


/**
compile(scope, params, template)
Returns a function that renders a literal template.
**/

// Store render functions against their template strings
const cache = {};

function sanitiseVars(vars) {
    const names = vars.split(/\s*[,\s]\s*/).sort();
    return names.join(', ');
}

export default function compile(scope, varstring, string, id, consts = 'data', render = renderString) {
    if (typeof string !== 'string') {
        throw new Error('Template is not a string');
    }

    const key = id || string;

    // Return cached fn
    if (cache[key]) { return cache[key]; }

    // Alphabetise and format
    const vars = sanitiseVars(varstring);

    // Make it impossible to override render
    scope.render = render;

    const self = this;
    const code = '\n'
        + (id ? indent + '// Render ' + id + '\n' : '')
        + (vars ? indent + 'const { ' + vars + ' } = ' + consts + ';\n' : '')
        + indent + 'return render`' + string + '`;\n';

    var fn;

    try {
        logCompile(id ? id : key.length > 45 ? '`' + key.slice(0, 33) + '...' +  key.slice(-8) + '`' : '`' + key + '`', scope, 'data' + (vars ? ', ' + vars : ''));

        // Allow passing nothing to a render function by defaulting data to an 
        // empty object. Compiled function cannot be given a name as it will 
        // appear in template scope. Todo: does outer function's name 'anonymous',
        // which appears to be automatic, appear in scope?
        fn = compileAsync(scope, 'data = {}', code);
    }
    catch(e) {
        logError(key, string, e);
        throw e;
    }

    return cache[key] = function literal() {
        log('render ', id ? id : key.length > 45 ? '`' + key.slice(0, 33) + '...' +  key.slice(-8) + '`' : '`' + key + '`', 'orange');
        // Where this is global, neuter it
        return fn.apply(this === self ? {} : this, arguments);
    };
}

export function compileStringRender(scope, varstring, string, consts = 'data') {
    return compile(scope, varstring, string, null, consts, renderString);
}

export function compileValueRender(scope, varstring, string, consts = 'data') {
    return compile(scope, varstring, string, null, consts, renderValue);
}

export function compileValues(scope, varstring, string, consts = 'data') {
    return compile(scope, varstring, string, null, consts, renderValues);
}
