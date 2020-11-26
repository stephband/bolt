
import path     from 'path';

import get      from '../../fn/modules/get.js';
import id       from '../../fn/modules/id.js';
import noop     from '../../fn/modules/noop.js';
import overload from '../../fn/modules/overload.js';
import toString from './to-string.js';

import request        from './request.js';
import parseTemplate  from './parse-template.js';
import parseComments  from './parse-comments.js';
import { rewriteURL } from './url.js';
import { dim, cyan, red, yellow, reset }  from './log.js';


const DEBUG = false;//true;

function validateScope(scope) {
    if (scope === undefined) {
        console.log(red, 'Scope is undefined!')
        throw new Error('Scope is undefined!');
    }
}

function join(partials) {
    return partials.join('');
}


/**
renderToken(token, scope)

Takes a parsed token and returns a promise that resolves to a string
of HTML.
**/

function filterByType(type, array) {
    return array.reduce(function(output, data) {
        // Remove preceeding title where it is not followed by a
        // data of the right type
        if (data.type !== type && output[output.length - 1] && output[output.length - 1].type === 'title') {
            --output.length;
        }
    
        if (data.type === type || data.type === 'title') {
            output.push(data);
        }
    
        return output;
    }, []);
}

const docsFilters = {
    'all': id,
    'selector':  (comments) => comments.filter((comment) => (comment.type === 'class' || comment.type === 'text')),
    'attribute': (comments) => filterByType('attribute', comments),
    'property':  (comments) => filterByType('property', comments),
    'string':    (comments) => filterByType('string', comments),
    'part':      (comments) => filterByType('part', comments),
    'var':       (comments) => filterByType('var', comments),
    'tag':       (comments) => filterByType('tag', comments),
    'method':    (comments) => filterByType('method', comments),
    'function':  (comments) => filterByType('function', comments)
};

function throwError(error) {
    console.log(red, error.message);
    throw error;
}

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

const rURL = /(src=['"]?|href=['"]?|url\(\s*['"]?)([\:\.\/\w-\d\%]+)/g;

function rewriteURLs(source, target, html) {
    return html.replace(rURL, ($0, $1, $2) => $1 + rewriteURL(source, target, $2));
}

const renderToken = overload(get('type'), {
    // Render tags and properties. All tags must return either a promise that 
    // resolves to an HTML string, or undefined.
    'tag': overload(get('name'), {
        'docs': function docs(token, scope, source, target, level) {
            if (DEBUG) { validateScope(scope); }

            // Get src relative to working directory 
            const src  = getRootSrc(source, token.src);
            const type = token.filterType;

            return request(src)
            .catch((error) => {
                console.log(red, 'Missing', src, error.message);
                throw new Error();
            })
            .then(extractBody)
            .then(parseTemplate)
            //.then((tree) => (console.log('DOCS\n' + src + '\n', tree), tree))
            .then((tree) => 
                Promise
                .all(token.sources.map((path) => {
                    const url = getRootSrc(source, path);
                    return request(url)
                    .catch(throwError)
                    .then(parseComments)
                    //.then(comments => (console.log('CSS\n' + url + '\n', comments), comments))
                    .then(docsFilters[type])                  
                    .then((comments) => {
                        comments.forEach((comment) => {
                            comment.body    = comment.body && rewriteURLs(url, target, comment.body);
                            comment.example = comment.example && rewriteURLs(url, target, comment.example);
                        });
                        return comments;
                     });
                }))
                //.then((comments) => (console.log('BEFORE', comments.flat()), comments))
                .then((comments) => renderTree(tree, comments.flat(), src, target, ++level))
                // Render includes at the tag's indentation
                .then((html) => html.replace(/\n/g, '\n' + token.indent))
            )
            //.then((c) => (console.log(c.type), c))
        },

        'each': function docs(token, scope, source, target, level) {
            if (DEBUG) { validateScope(scope); }

            return scope ?
                Promise
                .all(scope.map((data) => renderTree(token.tree, data, source, target, ++level)))
                .then(join) :
                Promise
                .resolve('') ;
        },

        'if': function docs(token, scope, source, target, level) {
            if (DEBUG) { validateScope(scope); }

            const selector = token.selector;
            return (scope && scope[selector]) ? 
                renderTree(token.tree, scope, source, target, ++level) :
                Promise.resolve('') ;
        },

        'import': function(token, scope, source, target) {
            if (DEBUG) { validateScope(scope); }

            Promise.all(token.imports.map((data) => {
                return (
                    (/\.json$/).test(data.url) ?
                        request(getRootSrc(source, data.url))
                        .then(JSON.parse) :
                    (/\.js$/).test(data.url) ?
                        // This is going to be the wrong url for import, need
                        // relative to this file
                        import(getRootSrc(source, data.url))
                        .then((module) => module.default) :
                    Promise.reject()
                )
                .then((object) => scope[data.name] = object)
                .catch((error) => {
                    console.log(red + ' ' + yellow + ' ' +  red + ' ' + yellow, 'Import', getRootSrc(source, data.url), error.constructor.name, error.message);
                })
            }))
            .then(() => '');
        },

        'include': function docs(token, scope, source, target, level) {
            if (DEBUG) { validateScope(scope); }

            // Get src relative to working directory 
            const src      = getRootSrc(source, token.src);
            const template = request(src)
                .catch((error) => console.log(red, 'Missing', src, error.message))
                .then(extractBody)
                .then(parseTemplate)
//                .then((tree) => (console.log('INCLUDE\n' + src + '\n', tree), tree));

            return token.import ?
                // Import JSON data as scope
                Promise.all([
                    template,
                    request(getRootSrc(source, token.import))
                    .catch((error) => console.log(red, 'Missing', getRootSrc(source, token.import), error.message))
                    .then(JSON.parse)
                ])
//                .then((res) => (console.log(yellow, 'template', res[0]), res))
                .then((res) => renderTree(res[0], res[1], src, target, ++level))
                .then((html) => html.replace(/\n/g, '\n' + token.indent)) :

                // Use current scope as scope
                template
                .then((tree) => renderTree(tree, scope, src, target, ++level))
                //.then((html) => (console.log(html), html))
                .then((html) => html.replace(/\n/g, '\n' + token.indent))
                .catch((error) => console.log(red, error.constructor.name, error.message)) ;
        },

        'with': function docs(token, scope, source, target, level) {
            if (DEBUG) { validateScope(scope); }
//console.log('WITH', scope, token.param.transform(scope), '\n-------------------');
            return renderTree(token.tree, token.param.transform(scope), source, target, ++level);
        }
    }),

    // Apply transform to property and render
    'property': function(token, scope) {
        if (DEBUG) { validateScope(scope); }
        return Promise.resolve(toString(token.transform(scope)));
    },

    // Render text as-is
    'text': function(token, scope) {
        if (DEBUG) { validateScope(scope); }
        return Promise.resolve(token.text);
    },

    // Rewrite relative URLs
    'url': function(token, scope, source, target) {
        if (DEBUG) { validateScope(scope); }
        const isAbsolute = /^#|^\w+:\/\/|^\//.test(token.url);

        /*
        if (!isAbsolute) {
            console.log('Rewrite URL ', source, target, token.url, rewriteURL(source, target, token.url));
        }
        else {
            console.log('Absolute URL', token.url);
        }
        */

        return isAbsolute ?
            Promise
            .resolve(token.url) :
            Promise
            .resolve(rewriteURL(source, target, token.url))
            .then((url) => (/^[\.\/]/.test(url) ? url : './' + url)) ;
    },

    // Ignore comments, leading whitespace and imports
    'comment': noop,
    'ignored': noop
});


/**
renderTree(tree, scope, source, target)

Takes a parsed template tree and returns a promise that resolves to a string
of HTML.
**/

export default function renderTree(tree, scope, source, target, level = 0) {
    if (DEBUG) { validateScope(scope); }

    // If first tag is an import, wait for imports to resolve before render
    /* return (tree[0] && tree[0].fn === 'import' ?
        renderToken(tree.shift(), scope, source, target) :
        Promise.resolve('')
    )*/
    return Promise
    .resolve('')
    .then(() => 
        Promise
        .all(tree.reduce(function(promises, token) {
            if (DEBUG) {
                console.log(dim + ' ' + yellow, level, (
                    token.type === 'text' ? token.text.replace(/^\s*/, '').slice(0, 32).replace(/\s*$/, '') + '…' :
                    token.type === 'comment' ? token.code :
                    token.type === 'ignored' ? token.code :
                    token.type === 'tag' ? token.code :
                    token.type === 'property' ? token.code :
                    token.type === 'url' ? token.code :
                    ''
                ));
            }

            const promise = renderToken(token, scope, source, target, level);

            if (promise) {
                promises.push(promise);
            }

            return promises;
        }, []))
        .then(join)
        //.then((html) => console.log(yellow, 'renderTree', '(' + html.length + ') ' + html.slice(0, 32) + '...'))
    );
}
