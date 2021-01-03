
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const current = dirname(fileURLToPath(import.meta.url));

import exec                from '../../../fn/modules/exec.js';
import get                 from '../../../fn/modules/get.js';
import id                  from '../../../fn/modules/id.js';
import overload            from '../../../fn/modules/overload.js';
import request             from './request.js';
import toType              from '../../../fn/modules/to-type.js';

import { addDate }         from '../../../fn/modules/date.js';
import { addTime }         from '../../../fn/modules/time.js';

export { default as get }  from '../../../fn/modules/get-path.js';
export { default as id }   from '../../../fn/modules/id.js';
export { default as pipe } from '../../../fn/modules/pipe.js';
export { default as px, em, rem } from './parse-length.js';

import { rewriteURL, rewriteURLs } from './url.js';
import { red, yellow }     from './log.js';

import Value from './value.js';
export const Pipe = (value) => new Value(value);

import Template from './literal.js';

const toExtension  = exec(/\.[\w\d]+$/, get(0));
const toExtensions = exec(/\.[\w\d]+\.[\w\d]+$/, get(0))

export const fetch = overload(toExtension, {
    // TODO: correctly get the path
    '.js':   (url, name, source, target) =>
        import(rewriteURL(source, target, '../../../' + getRootSrc(source, url)))
        .then(get(name)),

    // TODO: correctly get the path
    '.json': (url, name, source, target) =>
        import(rewriteURL(source, target, '../../../' + getRootSrc(source, url)))
        .then(get('default')),

    'undefined': (url) => {
        throw new TypeError('File extension required by fetch("' + url + '")');
    },

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
    'string': (url, source, target) => {
        return fetch(url, 'default', source, target);
    },
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

export const include = overload(toExtension, {
    '.literal': overload(toExtensions, {
        '.html.literal': (url, object, source, target) => {
            // Get src relative to working directory 
            const src = getRootSrc(source, url);
            return Promise.all([
                request(src)
                .then(extractBody)
                .then((template) => Template({}, template, src, target)),
                resolveContext(object, source, target)
            ])
            .then(([render, context]) => render(context));
        },

        default: (url, object, source, target) => {
            // Get src relative to working directory 
            const src    = getRootSrc(source, url);
            const render = request(src)
            return Promise.all([
                request(src).then((template) => Template({}, template, src, target)),
                resolveContext(object, source, target)
            ])
            .then(([render, context]) => render(context));
        }
    }),

    '.html': (url, n, source) => {
        // Get src relative to working directory 
        const src    = getRootSrc(source, url);
        return request(src)
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
