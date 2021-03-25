
import cache from '../../fn/modules/cache.js';
import noop  from '../../fn/modules/noop.js';
import library, { register } from './modules/lib.js';
import compile from './modules/compile.js';
import log from './modules/log-browser.js';


const textarea = document.createElement('textarea');

function empty() {
    return '';
}

function decode(html) {
    // Converts &amp;, &lt; and &gt; to &, < and >
    textarea.innerHTML = html;
    return textarea.value;
}

const fromTemplateId = cache(function(id) {
    const element = document.getElementById(id);

    if (!element) {
        console.error('<template id="' + id + '"> not found in document');
        return empty;
    }

    const keys = Object.keys(element.dataset);

    if (keys.includes('data')) {
        log('render', 'template has data-data attribute but variable data not allowed', 'red');
    }

    const vars     = keys.join(', ');
    const source   = decode(element.innerHTML);
    return compile(library, vars, source, element.id ? '#' + element.id : '');
});


/**
Literal(template)
Takes a literal template and compiles it into a render function. The parameter
`template` may be:

- A DOM element
- The id of an element in the DOM, eg. `'#my-template'`
- A template string
**/

function Literal(template) {
    return typeof template === 'string' ?
        /^#/.test(template) ?
            fromTemplateId(template.slice(1)) :
            compile(library, 'data', template) :
        template.id ?
            fromTemplateId(template) :
            noop ;
}


/** 
Literal.register(name, fn)
Define a function or value that is made available in the scope of all templates.
**/

Literal.register = register;


/** 
Literal.render(template, data)
Compiles and renders a template in a single call.
**/

Literal.render = function(template, data) {
    return Literal(template)(data);
};


/**

**/

register('include', function include(url, data) {
    if (!/^#/.test(url)) {
        throw new Error('Literal: Only #hashrefs currently supported as include() urls ("' + url + '")');
    }

    const render = fromTemplateId(url.slice(1));
    return render(data);
});

export default Literal;
