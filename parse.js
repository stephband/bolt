
/*
Parse files for documentation comments
*/


// markdown library
// https://marked.js.org/#/README.md#README.md
import '../fn/libs/marked/marked.min.js';

// Syntax highlighter
// https://prismjs.com/
import '../fn/libs/prism/prism.js';

import { cache, capture, id, invoke, last, nothing, slugify, Stream } from './module.js';

// Import from direct path so that Sparky is not launched on templates immediately
import { register } from '../sparky/modules/fn.js';

const Prism = window.Prism;
const marked = window.marked;
const A = Array.prototype;

const fetchOptions = {
    method: 'GET'
};

const markedOptions = {
    // GitHub Flavored Markdown
    gfm: true,

    // Highlight code blocks
    highlight: function(code, lang, callback) {
        return Prism.highlight(code, Prism.languages[lang || 'js'], lang || 'js');
    },

    // Emit self-closing tags
    xhtml: true,

    // Typographic niceties
    smartypants: true
};



capture(/\/\*\*+\s*(?:(\.)|(--)|(::part\()|(")|(<)|(\{\[)|(\b))?/, {
    // Property .property = default
    1: capture(/^([\w-]+)\s*(?:(=)|(\())?\s*/, {
        // property name
        1: function(data, strings) {
            return data;
        },

        // default value
        2: function(data, strings) {
            return data;
        },

        // It's a method
        3: function(data, strings) {
            const params = parseParams(strings, []);
            return data;
        }
    }),

    // CSS --variable: default
    2: capture(/^([\w-]+)(?:\s*:\s*([\w\d-]+))?/, {
        // variable name
        1: function(data, strings) {
            return data;
        },

        // default value
        2: function(data, strings) {
            return data;
        }
    }),

    // CSS ::part()
    3: capture(/^(\w+)\)/, {
        1: function(data, strings) {
            return data;
        }
    }),

    // String "text"
    4: capture(/^([^"]*)"/, {
        1: function(data, strings) {
            return data;
        }
    }),

    // Element <tag>
    5: capture(/^(\w[\w-]*)\s*>/, {
        // variable name
        1: function(data, strings) {
            return data;
        },

        // default value
        2: function(data, strings) {
            return data;
        }
    }),

    // Django or sparky tag {[ tag ]}
    6: function (data, results) {
        data.push({
            id: slugify(results[7]),
            prefix: '',
            name: results[7],
            params: '',
            type: 'title',
            title: results[7]
        });
        return data;
    },

    // Word
    7: capture(/^([\w-]+)\s*(?:(=")|(:)|(\())?\s*/, {
        // name
        1: function(data, strings) {
            data.push({
                id: slugify(results[1]),
                prefix: '',
                name: results[1],
                params: '',
                type: 'title',
                title: results[1]
            });
            return data;
        },

        // attribute
        2: function(data, strings) {
            const object = last(data);
            object.type = 'attribute';
            //object.default = parseString();
            return data;
        },

        // Django or Sparky :params
        3: function(data, strings) {
            const object = last(data);
            object.type = 'fn';
            return data;
        },

        // function or constructor
        4: function(data, strings) {
            const object = last(data);
            // If first letter is a capital it's a constructor
            object.type = object.title[0].toUpperCase() === object.title[0] ?
                'constructor' :
                'function' ;
            const params = parseParams(strings, []);
            return data;
        }
    }),

    // Markdown (anything) close comment
    close: capture(/^\s*([\s\S]*?)\*+\//, {
        1: function(data, results) {
            var exampleHTML;

            last(data).body = marked(results[1], Object.assign(markedOptions, {
                // Highlight code blocks
                highlight: function (code, lang, callback) {
                    // Grab the first HTML code block and use it as example code
                    exampleHTML = exampleHTML || (lang === 'html' && code);
                    return Prism.highlight(code, Prism.languages[lang || 'js'], lang || 'js');
                }
            }));

            last(data).example = exampleHTML || '';

            return data;
        },

        close: function(data, results) {
            return parseDoc(data, results);
        }
    }),

    catch: id
});



/*


//                Open comment followed by    spaces and (dot)(name or selector[anything])      ((params)) or (:params)       or (="")                    OR (<tag>)       OR ({[ tag ]} or {% tag %})
const parseDoc = window.parseDoc = capture(/\/\*\*+\s*(?:(\.|--|::part\(|")?(\w[\w-, .…"]*(?:\[[^\]]+\])?)(?:(\([^)]*\))|:[ \t]*([\w-, .:'"…]*)|=(["\w-#,/%\]}[{ .:']*))?|(<[\w- ="]+\/?>)|(\{[\[\]\w%|:. ]+\}))/, {
    // .property or title or {[tag]}
    2: function(data, results) {
        data.push({
            id:     slugify(results[2] + (results[3] || '')),
            prefix: results[1],
            name:   results[2],
            type:   results[1] ?
                results[1] === '.' ? 'property' :
                results[1] === '::part(' ? 'part' :
                results[1] === '"' ? 'string' :
                'var' :
                'title',
            title: (results[1] === undefined || results[1] === '::part(' ? '' : results[1]) + results[2]
        });
        return data;
    },

    // .method() or function()
    3: function(data, results) {
        const object  = last(data);
        object.type =
            // Preceding '.' means it's a method
            results[1] ? 'method' :
            // Lowercase first letter it's a function
            results[2][0].toLowerCase() === results[2][0] ? 'function' :
            // Otherwise, it's a constructor
            'constructor' ;

        object.params = results[3];
        object.title  = Prism.highlight(
            (results[1] || '') + results[2] + results[3],
            Prism.languages['js'],
            'js'
        );

        return data;
    },

    // fn:param
    4: function(data, results) {
        const object = last(data);
        object.type  = 'fn';
        object.title = results[4] ?
                // Catch the case where token is a .thumb-3:4 class. Very dodgy,
                // ultimately we need to make this parser more robust!
                results[1] ? results[1] + results[2] + ':' + results[4] :
            results[2] + ': ' + results[4] :
            results[2] ;
        return data;
    },

    // attribute="value"
    5: function(data, results) {
        const object = last(data);
        if (results[1]) {
            // Default of a property or var
            object.default = results[5];
            return data;
        }

        object.type  = 'attribute';
        object.title  = results[2];
        // Don't include empty strings
        object.default = results[5] !== '""' && results[5];
        return data;
    },

    // <element>
    6: function(data, results) {
        //console.log('TAG', results)
        data.push({
            id:     slugify(results[6]),
            prefix: '',
            name:   results[6],
            params: '',
            type:   'tag',
            title:  Prism.highlight(results[6], Prism.languages['html'], 'html')
        });
        return data;
    },

    // {[ tag ]}
    7: function (data, results) {
        data.push({
            id: slugify(results[7]),
            prefix: '',
            name: results[7],
            params: '',
            type: 'title',
            title: results[7]
        });
        return data;
    },

    // Markdown (anything) close comment
    close: capture(/^\s*([\s\S]*?)\*+\//, {
        1: function(data, results) {
            var exampleHTML;

            last(data).body = marked(results[1], Object.assign(markedOptions, {
                // Highlight code blocks
                highlight: function (code, lang, callback) {
                    // Grab the first HTML code block and use it as example code
                    exampleHTML = exampleHTML || (lang === 'html' && code);
                    return Prism.highlight(code, Prism.languages[lang || 'js'], lang || 'js');
                }
            }));

            last(data).example = exampleHTML || '';

            return data;
        },

        close: function(data, results) {
            return parseDoc(data, results);
        }
    }),

    // If there are no comments return data
    catch: id
});
*/