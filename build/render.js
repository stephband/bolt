
import get      from '../../fn/modules/get.js';
import noop     from '../../fn/modules/noop.js';
import overload from '../../fn/modules/overload.js';
import toText   from '../../sparky/modules/to-text.js';

import request       from './request.js';
import parseTemplate from './parse-template.js';
import parseComments from './parse-comments.js';


function join(partials) {
    return partials.join('');
}


/**
renderToken(token, scope)

Takes a parsed token and returns a promise that resolves to a string
of HTML.
**/
/*
array.reduce(function(output, data) {
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
*/

const filters = {
    'selector': (comments) =>
        comments.filter((comment) => comment.type !== 'var'),
};

const renderToken = overload(get('type'), {
    // Render tags and properties. All tags must return either a promise that 
    // resolves to an HTML string, or undefined.

    'tag': overload(get('fn'), {
        'docs': function docs(token, data) {
            // Lop off hash refs, for now (Todo: support file partials? 
            // Could be tricky.)
            const path = token.src.replace(/#.*$/, '');
            const type = token.filterType;

            return request(path)
            .then(parseTemplate)
            .then((tree) => 
                Promise
                .all(token.sources.map((path) =>
                    request(path)
                    .then(parseComments)
                    .then(filters[type])
                ))
                .then((comments) => renderTree(tree, comments.flat()))
                // Render includes at the tag's indentation
                .then((html) => html.replace(/\n/g, '\n' + token.indent))
            );
        },

        'each': function docs(token, scope) {
            return Promise
            .all(scope.map((data) => renderTree(token.tree, data)))
            .then(join);
        },

        'include': function docs(token, data) {
            // Lop off hash refs, for now (Todo: support file partials? 
            // Could be tricky.)
            const path = token.src.replace(/#.*$/, '');
console.log(path, token.import);
            return token.import ?

                // Import JSON data as scope
                Promise.all([
                    request(path).then(parseTemplate),
                    request(token.import).then(JSON.parse)
                ])
                .then((res) => renderTree(res[0], res[1]))
                .then((html) => html.replace(/\n/g, '\n' + token.indent)) :

                // Use current scope as scope
                request(path)
                .then(parseTemplate)
                .then((tree) => renderTree(tree, data))
                .then((html) => html.replace(/\n/g, '\n' + token.indent)) ;
        },

        'with': function docs(token, scope) {
            return renderTree(token.tree, token.param.transform(scope));
        }
    }),

    'property': function(token, scope) {
        return Promise.resolve(toText(token.transform(scope)));
    },

    'text': function(token, scope) {
        return Promise.resolve(token.text);
    },

    // Don't render comments
    'comment': noop
});


/**
renderTree(tree, scope)

Takes a parsed template tree and returns a promise that resolves to a string
of HTML.
**/

export default function renderTree(tree, scope) {
    return Promise
    .all(tree.reduce(function(promises, token) {
        const promise = renderToken(token, scope);

        if (promise) {
            promises.push(promise);
        }

        return promises;
    }, []))
    .then(join);
}