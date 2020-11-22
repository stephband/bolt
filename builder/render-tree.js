
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
import { cyan, red, yellow, reset }  from './log.js';

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
    'selector':  (comments) => comments.filter((comment) => comment.type !== 'var'),
    'attribute': (comments) => filterByType('attribute', comments),
    'property':  (comments) => filterByType('property', comments),
    'string':    (comments) => filterByType('string', comments),
    'part':      (comments) => filterByType('part', comments),
    'var':       (comments) => filterByType('var', comments),
    'tag':       (comments) => filterByType('tag', comments),
    'method':    (comments) => filterByType('method', comments),
    'function':  (comments) => filterByType('function', comments)
};

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

    'tag': overload(get('fn'), {
        'docs': function docs(token, data, source, target) {
            // Get src relative to working directory 
            const src  = getRootSrc(source, token.src);
            const type = token.filterType;

            return request(src)
            .then(extractBody)
            .then(parseTemplate)
            .then((tree) => 
                Promise
                .all(token.sources.map((path) => {
                    const url = getRootSrc(source, path);
                    return request(url)
                    .then(parseComments)
                    .then(docsFilters[type])
                    .then((comments) => {
                        comments.forEach((comment) => {
                            comment.body = rewriteURLs(url, target, comment.body);
                            comment.example = rewriteURLs(url, target, comment.example);
                        });
                        return comments;
                     })
                }))
                .then((comments) => renderTree(tree, comments.flat(), src, target))
                // Render includes at the tag's indentation
                .then((html) => html.replace(/\n/g, '\n' + token.indent))
            )
            .catch(() => {
                //console.log(source, token.src, src, type);
                //console.log(red, 'docs', '"' + src + '" not found');
                return '<pre><code>' + src + ' not found</code></pre>';
            })
        },

        'each': function docs(token, scope, source, target) {
            return scope ?
                Promise
                .all(scope.map((data) => renderTree(token.tree, data, source, target)))
                .then(join) :
                Promise
                .resolve('') ;
        },

        'if': function docs(token, scope, source, target) {
            const selector = token.selector;
            return (scope && scope[selector]) ? 
                renderTree(token.tree, scope, source, target) :
                Promise.resolve('') ;
        },

        'include': function docs(token, scope, source, target) {
            // Get src relative to working directory 
            const src = getRootSrc(source, token.src);

            return token.import ?
                // Import JSON data as scope
                Promise.all([
                    request(src)
                    .then(extractBody)
                    .then(parseTemplate)
                    .catch((error) => {
                        console.log(red, 'include', src + ' not found');
                    }),
                    request(getRootSrc(source, token.import))
                    .then(JSON.parse)
                    .catch((error) => {
                        console.log(red + ' ' + yellow + ' ' +  red + ' ' + yellow, 'Import', getRootSrc(source, token.import), error.constructor.name, error.message);
                    })
                ])
                .then((res) => renderTree(res[0], res[1], src, target))
                .then((html) => html.replace(/\n/g, '\n' + token.indent)) :

                // Use current scope as scope
                request(src)
                .then(extractBody)
                .then(parseTemplate)
                .then((tree) => renderTree(tree, scope, src, target))
                .then((html) => html.replace(/\n/g, '\n' + token.indent))
                .catch(() => {
                    console.log(red, 'include', src + ' not found');
                }) ;
        },

        'with': function docs(token, scope) {
            return renderTree(token.tree, token.param.transform(scope));
        }
    }),

    'property': function(token, scope) {
        return Promise.resolve(toString(token.transform(scope)));
    },

    'text': function(token, scope) {
        return Promise.resolve(token.text);
    },

    // Rewrite relative URLs
    'url': function(token, scope, source, target) {
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

    // Ignore comments  
    'comment': noop
});


/**
renderTree(tree, scope)

Takes a parsed template tree and returns a promise that resolves to a string
of HTML.
**/

export default function renderTree(tree, scope, source, target) {
    return Promise
    .all(tree.reduce(function(promises, token) {
        const promise = renderToken(token, scope, source, target);

        if (promise) {
            promises.push(promise);
        }

        return promises;
    }, []))
    .then(join);
}