
import cache from '../../fn/modules/cache.js';
import noop  from '../../fn/modules/noop.js';
import library, { register } from './modules/lib.js';
import compile from './modules/compile.js';

function empty() {
    return '';
}

function pushParams(args, key) {
    args.push(args[0][key])
    return args;
}

const fromTemplateId = cache(function(id) {
    const element = document.getElementById(id);

    if (!element) {
        console.error('<template id="' + id + '"> not found in document');
        return empty;
    }

    const keys     = Object.keys(element.dataset);
    const params   = 'data' + (keys.length ? ', ' + keys.join(', ') : '');
    const template = element.innerHTML;
    const render   = compile(library, params, template, element.id ? '#' + element.id : '');

    return function literal(data) {
        // Assemble params data, ...keys
        const args = arguments.length === 1 ?
            arguments :
            keys.reduce(pushParams, [data]) ;
    
        return render.apply(this, args);
    };
});

function Literal(template) {
    return typeof template === 'string' ?
        /^#/.test(template) ?
            fromTemplateId(template.slice(1)) :
            compile(library, 'data', template) :
        template.id ?
            fromTemplateId(template) :
            noop ;
}

Literal.register = register;

register('include', function include(url, data) {
    if (!/^#/.test(url)) {
        throw new Error('Literal: Only #hashrefs currently supported as include() urls ("' + url + '")');
    }

    const render = fromTemplateId(url.slice(1));
    return render(data);
});

export default Literal;
