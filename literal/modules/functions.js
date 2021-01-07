
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Absolute path to module
const moduleAbs = dirname(fileURLToPath(import.meta.url));

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
export { default as px, em, rem } from './parse-length.js';

export { default as exec }    from '../../../fn/modules/exec.js';
export { default as slugify } from '../../../fn/modules/slugify.js';
export { default as Pipe }    from './pipe.js';

import request from './request.js';
import { rewriteURL, rewriteURLs } from './url.js';

import { red, yellow }     from './log.js';

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

export const imports = overload((source, target, url) => toExtension(url), {
    '.js': (source, target, url) => {
        // Current directory absolute
        const currentAbs  = process.cwd();
        // Source dir relative to current working directory
        const sourcedir   = path.dirname(source);
        // Resource path relative to current working directory
        const resource    = path.join(sourcedir, url);
        // Resource path absolute
        const resourceAbs = path.join(currentAbs, resource);
        // Resource path relative to module
        const resourceRel = path.relative(moduleAbs, resourceAbs);

        return import(resourceRel);
    },

    '.json': (source, target, url) => {
        // Current directory absolute
        const currentAbs  = process.cwd();
        // Source dir relative to current working directory
        const sourcedir   = path.dirname(source);
        // Resource path relative to current working directory
        const resource    = path.join(sourcedir, url);
        // Resource path absolute
        const resourceAbs = path.join(currentAbs, resource);
        // Resource path relative to module
        const resourceRel = path.relative(moduleAbs, resourceAbs);

        return import(resourceRel).then(get('default'));
    },

    'undefined': (source, target, url) => {
        throw new TypeError('File extension required by imports("' + url + '")');
    },

    default: (source, target, url) => {
        throw new TypeError('File extension ".'
            + toExtension(url) 
            + '" not supported by imports("' + url + '")'
        );
    }
});


/**
include(url, data)
Includes a template from `url`, rendering it with properties of `data` 
as in-scope variables.
**/

const resolveScope = overload(toType, {
    'string': (url, source, target) => {
        return imports(source, target, url);
    },

    'object': (object) => Promise.resolve(object),

    'undefined': () => Promise.resolve(),

    default: (object) => {
        throw new Error('include(url, object) cannot be called with object of type ' + toType(object));
    }
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
    return path.join(dir, relative).replace(/^\s+/, '');
}

export const include = overload((source, target, url) => toExtension(url), {
    '.literal': overload((source, target, url) => toExtensions(url), {
        '.html.literal': (source, target, url, scope) => {
            // Get src relative to working directory 
            const src = getRootSrc(source, url);
            return resolveScope(scope, source, target)
            .then((data) => {
                // Get data keys so that we can reference them as params 
                // inside the template
                const params = data && Object.keys(data).join(',') || '';
                return request(src)
                .then(extractBody)
                .then((template) => Literal(params, template, src))
                .then((render) => render(data, target));
            });
        },

        default: (source, target, url, scope) => {
            // Get src relative to working directory 
            const src = getRootSrc(source, url);
            return resolveScope(scope, source, target)
            .then((data) => {
                // Get data keys so that we can reference them as params 
                // inside the template
                const params = data && Object.keys(data).join(',') || '';
                return request(src)
                .then((template) => Literal(params, template, src))
                .then((render) => render(data, target));
            });
        }
    }),

    '.html': (source, target, url) => {
        // Get src relative to working directory 
        const src = getRootSrc(source, url);
        return request(src)
        .then(extractBody)
        .then((html) => rewriteURLs(url, target, html));
    },
    
    '.css': (source, target, url) => {
        // Get src relative to working directory 
        const src = getRootSrc(source, url);
        return request(src).then((text) => rewriteURLs(url, target, text));
    },

    default: (source, target, url) => {
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
    'date': addDate,
    'time': addTime,
    'string': (a) => (b) => b + a,
    'number': (a) => (b) => b + a,
    'default': function(n) {
        throw new Error('add(value) does not accept values of type ' + typeof n);
    }
});


/**
documentation(urls)
Parses documentation comments from files. Returns a promise of an array of
comments.
**/

import parseDocs  from './parse-docs.js';

export function documentation(source, target, ...urls) {
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
