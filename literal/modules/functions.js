
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const current = dirname(fileURLToPath(import.meta.url));

import exec                from '../../../fn/modules/exec.js';
import get                 from '../../../fn/modules/get.js';
import id                  from '../../../fn/modules/id.js';
import overload            from '../../../fn/modules/overload.js';
import toType              from '../../../fn/modules/to-type.js';

import { addDate }         from '../../../fn/modules/date.js';
import { addTime }         from '../../../fn/modules/time.js';

export { default as by }      from '../../../fn/modules/by.js';
export { default as equals }  from '../../../fn/modules/equals.js';
export { default as get }     from '../../../fn/modules/get-path.js';
export { default as id }      from '../../../fn/modules/id.js';
export { default as pipe }    from '../../../fn/modules/pipe.js';
export { default as px, em, rem } from './parse-length.js';

export { default as exec }    from '../../../fn/modules/exec.js';
export { default as slugify } from '../../../fn/modules/slugify.js';

import request from './request.js';
import { rewriteURL, rewriteURLs } from './url.js';

import { red, yellow }     from './log.js';

function requestURL(url, source, target) {
    return request(rewriteURL(source, target,getRootSrc(source, url)));
}

export { requestURL as request };


import Value from './value.js';
export const Pipe    = (value) => new Value(value);
export const entries = Object.entries;
export const keys    = Object.keys;
export const values  = Object.values;

import Literal from './literal.js';

const toExtension  = exec(/\.[\w\d]+$/, get(0));
const toExtensions = exec(/\.[\w\d]+\.[\w\d]+$/, get(0))


/**
imports(url)

Imports all exports of a JS module or JSON file.
**/

export const imports = overload(toExtension, {
    // TODO: correctly get the path
    '.js': (url, source, target) =>
        import(rewriteURL(source, target, '../../../' + getRootSrc(source, url))),

    // TODO: correctly get the path
    '.json': (url, source, target) =>
        import(rewriteURL(source, target, '../../../' + getRootSrc(source, url)))
        .then(get('default')),

    'undefined': (url) => {
        throw new TypeError('File extension required by imports("' + url + '")');
    },

    default: (url) => {
        throw new TypeError('File extension ".'
            + toExtension(url) 
            + '" not supported by imports("' + url + '")'
        );
    }
});


/**
include(url, context)

Includes a template from `url`, rendering it with `context`.
**/

const resolveContext = overload(toType, {
    'string': (url, source, target) => {
        return imports(url, source, target);
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
                .then((template) => Literal({}, template, src, target)),
                resolveContext(object, source, target)
            ])
            .then(([render, context]) => render(context));
        },

        default: (url, object, source, target) => {
            // Get src relative to working directory 
            const src    = getRootSrc(source, url);
            const render = request(src)
            return Promise.all([
                request(src).then((template) => Literal({}, template, src, target)),
                resolveContext(object, source, target)
            ])
            .then(([render, context]) => {
                //console.log('Render', url, 'with', context);
                return render(context);
            });
        }
    }),

    '.html': (url, n, source, target) => {
        // Get src relative to working directory 
        const src    = getRootSrc(source, url);
        return request(src)
        .then(extractBody)
        .then((html) => rewriteURLs(url, target, html));
    },
    
    '.css': (url, n, source, target) => {
        // Get src relative to working directory 
        const src = getRootSrc(source, url);
        return request(src).then((text) => rewriteURLs(url, target, text));
    },

    default: (url) => {
        throw new TypeError('File extension ".'
            + toExtension(url) 
            + '" not supported by include("' + url + '")'
        );
    }
});


/**
add(number|date|time)

Adds `n` to value. Behaviour is overloaded to accept various types of 'n'.
Where `n` is a number, it is summed with value. So to add 1 to any value:

```html
${ pipe(add(1), data.number) }
```

Where 'n' is a duration string in date-like format, value is expected to be a
date and is advanced by the duration. So to advance a date by 18 months:

```html
${ pipe(add('0000-18-00'), data.date) }
```

Where 'n' is a duration string in time-like format, value is expected to be a
time and is advanced by the duration. So to put a time back by 1 hour and 20
seconds:

```html
${ pipe(add('-01:00:20'), data.time) }
```
**/

function toAddType(n) {
    const type = typeof n;
    return type === 'string' ?
        /^\d\d\d\d(?:-|$)/.test(n) ? 'date' :
        /^\d\d(?::|$)/.test(n) ? 'time' :
        'string' :
    type;
}

export const add = overload(toAddType, {
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


/**
docs(template, array)
**/

import parseDocs  from './parse-docs.js';

export function docs(source, target, ...urls) {
    return Promise.all(urls.map((path) => {
        const url = getRootSrc(source, path);

        return request(url)
        .then(parseDocs)
        //.then(comments => (console.log('CSS\n' + url + '\n', comments), comments))
        //.then(docsFilters[type])                  
        .then((comments) => {
            comments.forEach((comment) => {
                // Type property or selector tokens by file extension
                if (comment.type === 'property|selector') {
                    comment.type = /\.js(on)?$/.test(url) ?
                        'property' :
                        'selector' ;
                }
    
                // Indent lines that start with a word by one space in selectors
                if (comment.type === 'selector') {
                    comment.name = comment.name
                        .replace(/^(\w)/, ($0, $1) => ' ' + $1)
                        .replace(/\n(\w)/, ($0, $1) => '\n ' + $1);
                }
    
                // Rewrite relative URIs in body and examples
                comment.body = comment.body && rewriteURLs(url, target, comment.body);
                comment.examples.forEach((example, i, examples) => {
                    // Overwrite in place
                    examples[i] = rewriteURLs(url, target, example);
                });
            });

            return comments;
        });
    }))
    .then((comments) => comments.flat())
    .catch((error) => {
        console.log(red + ' ' + yellow + ' ' +  red + ' ' + yellow, 'Import', urls.join(', '), error.constructor.name, error.message, error.stack);
    });
};
