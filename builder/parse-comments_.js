
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


/** 
parseComment(string)
Where a documentation comment is found, returns a token object of the form:

```js
{
    id:       unique id for this token object
    type:     type of comment, one of 'attribute', 'property', 'element'
    name:     name of attribute, property, function, element or class
    title:    
    prefix:   syntax characters that precede declaration
    postfix:  syntax characters that follow declaration
    default:  default value
    params:   where `type` is method or function, list of parameters
    body:     body of comment, code highlighted
    examples: array of html code examples found in comment body, unhighlighted 
}
```
**/

const ids = {};

function createId(string) {
    if (ids[string] === undefined) {
        ids[string] = 0;
        return string;
    }
    else {
        ++ids[string];
        return string + '-' + ids[string];   
    }
}

// Documentation comment
// /** (.) (--) (::part() (") (<) ({[) (word)
const parseComment = capture(/\/\*\*+\s*(?:(\.)|(--)|(::part\()\s*|(")|(<)|(\{\[)|(\b))?/, {
    // New data object
    0: function() {
        return {};       
    },

    // Class, property or method .(name) (=) (()
    1: capture(/^([\w-]+)\s*(?:(=)|(\())?\s*/, {
        // Class
        // .class
        1: function(data, captures) {
            data.type = 'class';
            data.name = captures[1];
            return data;
        },

        // Property 
        // .property = default
        2: function(data, captures) {
            data.type    = 'property';
            data.default = captures[2];
            return data;
        },

        // Method
        // .method(param, param, ...)
        3: function(data, captures) {
            data.type   = 'method';
            data.params = parseParams([], captures);
            // Todo capture end bracket )
            return data;
        },

        catch: function(data) {
            throw new SyntaxError('Invalid .property or .method()');        
        }
    }),

    // CSS Variable (name): (value)
    2: capture(/^([\w-]+)(?:\s*:\s*([\w\d-]+))?\s*/, {
        // --variable
        1: function(data, captures) {
            data.type   = 'var';
            data.prefix = '--';
            data.name   = captures[1];
            return data;
        },

        // --variable: default
        2: function(data, captures) {
            data.default = captures[2];
            return data;
        },

        catch: function(data) {
            throw new SyntaxError('Invalid --variable');        
        }
    }),

    // Part ::part( (name) )
    3: capture(/^(\w+)\s*\)\s*/, {
        1: function(data, captures) {
            data.type = 'part';
            data.name = captures[1];
            return data;
        },

        catch: function() {
            throw new SyntaxError('Invalid ::part()');        
        }
    }),

    // String "text"
    4: capture(/^([^"]*)"/, {
        1: function(data, captures) {
            data.type = 'string';
            data.name = captures[1];
            return data;
        },

        catch: function(data) {
            throw new SyntaxError('Unclosed "string');        
        }
    }),

    // Element <tag>
    5: capture(/^(\w[\w-]*)\s*>/, {
        // variable name
        1: function(data, captures) {
            data.type = 'element';
            data.name = captures[1];
            return data;
        },

        catch: function(data) {
            throw new SyntaxError('Invalid <tag>');        
        }
    }),

    // Django or sparky tag {[ tag ]}
    6: function (data, captures) {
        data.type = 'tag';
        data.name = '';
        /*
        data.push({
            id: slugify(captures[7]),
            prefix: '',
            name: captures[7],
            params: '',
            type: 'title',
            title: captures[7]
        });
        */
        return data;
    },

    // Attribute (name) = 
    7: capture(/^([\w-]+)(?:\s*(=")|\s*(:)\s*|\s*(\()\s*)?/, {
        // name
        1: function(data, captures) {
            data.name = captures[1];
            return data;
        },

        // name="value"
        2: capture(/^([^"]*)"\s*/, {
            0: function(data, captures) {
                data.type = 'attribute';
                return data;
            },

            1: function(data, captures) {
                data.default = captures[1];
                return data;
            },

            catch: function(data) {
                throw new SyntaxError('Invalid attribute="value"');        
            }
        }),

        // name : params
        3: function(data, captures) {
            data.type   = 'fn';
            data.params = parseParams([], captures);
            return data;
        },

        // function or Constructor
        4: function(data, captures) {
            // If first letter is a capital it's a constructor
            data.type = /^[A-Z]/.test(data.name) ?
                'constructor' :
                'function' ;
            const params = parseParams([], captures);
            return data;
        }
    }),

    // Markdown (anything) close comment */
    close: capture(/^\s*([\s\S]*?)\*+\//, {
        1: function(data, captures) {
            data.examples = [];

            // Alias body 
            data.body = 
            data.html = marked(captures[1], Object.assign(markedOptions, {
                // Highlight code blocks
                highlight: function (code, lang, callback) {
                    // Grab HTML code blocks and add to examples
                    if (lang === 'html') { data.examples.push(code); }
                    // Highlight code inside documentation HTML 
                    return Prism.highlight(code, Prism.languages[lang || 'js'], lang || 'js');
                }
            }));

            return data;
        },

        close: function(data, captures) {
            data.id = createId(data.type + '-' + slugify(data.name) + (data.params ? '' : ''));
            return data;
        }
    }),

    catch: function(data, captures) {
        throw new Error('Cannot parse documentation comment /** ... **/');
    }
});


/**
parseComments(string)
Parses documentation comments out of JS or CSS files.
**/

export const parseComments = capture(/^/, {
    // We only use capture here to guarantee a captures object
    0: function(nothing, captures) {
        const comments = [];
        let comment;
        while ((comment = parseComment(captures))) {
            comments.push(comment);
        }
        return comments;
    }
});
