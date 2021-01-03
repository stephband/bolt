
import exec                from '../../fn/modules/exec.js';
import get                 from '../../fn/modules/get.js';
import id                  from '../../fn/modules/id.js';
import overload            from '../../fn/modules/overload.js';
import request             from './request.js';
import toType              from '../../fn/modules/to-type.js';
import { red, yellow }     from './log.js';

import { addDate }         from '../../fn/modules/date.js';
import { addTime }         from '../../fn/modules/time.js';

export { default as get }  from '../../fn/modules/get-path.js';
export { default as id }   from '../../fn/modules/id.js';
export { default as pipe } from '../../fn/modules/pipe.js';
export { default as px, em, rem }     from './parse-length.js';

import Value from './value.js';
export const Pipe = (value) => new Value(value);

import Template from './template.js';

const toExtension  = exec(/\.[\w\d]+$/, get(0));
const toExtensions = exec(/\.[\w\d]+\.[\w\d]+$/, get(0))

export const fetch = overload(toExtension, {
    '.js':   (url, name) => import(url).then(get(name)),
    '.json': (url) => import(url).then(get('default')),
    default: (url) => {
        throw new TypeError('File extension ".'
            + toExtension(url) 
            + '" not supported by fetch("' + url + '")'
        );
    }
});



//'include': function include(token, scope, source, target, level) {

/**
resolveValue(data, context)

Where `data` is an object of the form:
```
{
    type: 'object',
    value: { ... }
}
```
**/

const resolveContext = overload(toType, {
    'string': (url) => fetch(url),
    default: id
});

function extractBody(html) {
    const pre = /<body[^>]*>/.exec(html);
    if (!pre) { return html; }
    const post = /<\/body\s*>/.exec(html);    
    return html.slice(pre.index + pre[0].length, post.index);
}

function getRootSrc(source, src) {
    const root     = path.parse(source);
    const dir      = root.dir;
    const relative = src.replace(/#.*$/, '');
    return path.join(dir, relative);
}

//            1 src=" or href=" or url('                                2 anything not beginning with a / or #
const rURL = /(src=['"]?\s*|href=['"]?\s*|url\(\s*['"]?)(?:[a-z]+\:\/\/|([^\/\#'"][\:\.\/\w-\d\%]*))/g;

function rewriteURLs(source, target, html) {
    return html.replace(rURL, ($0, $1, $2) => {
        // Check for $2 - if a protocol was found $2 is undefined and we don't 
        // want to rewrite. Todo: write the regexp to not match protocol:// urls  
        return $2 ?
            $1 + rewriteURL(source, target, $2) :
            $0 ;
    });
}

export const include = overload(toExtension, {
    '.bolt': overload(toExtensions, {
        '.html.bolt': (url, object) => {
            // Get src relative to working directory 
            //const src    = getRootSrc(source, url);
            //const render = request(src)
    
            return Promise.all([
                request(url)
                .then(extractBody)
                .then((template) => Template({}, template)),
                resolveContext(object)
            ])
            .then(([render, context]) => render(context));
        },

        default: (url, object) => {
            // Get src relative to working directory 
            //const src    = getRootSrc(source, url);
            //const render = request(src)
    
            return Promise.all([
                request(url).then((template) => Template({}, template)),
                resolveContext(object)
            ])
            .then(([render, context]) => render(context));
        }
    }),

    '.html': (url) => {
        // Get src relative to working directory 
        //const src    = getRootSrc(source, url);
        //const render = request(src)
        return request(url)
        .then(extractBody);
    },

    default: (url) => {
        throw new TypeError('File extension ".'
            + toExtension(url) 
            + '" not supported by include("' + url + '")'
        );
    }
});

export const add = overload(toType, {
    'number': (a) => (b) => (
        typeof b === 'number' ? b + a :
            b && b.add ? b.add(a) :
            undefined
    ),

    'date': addDate,
    'time': addTime,

    'default': function(n) {
        throw new Error('Bolt add(value) does not accept values of type ' + typeof n);
    }
});
