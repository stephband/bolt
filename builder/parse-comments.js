
/*
Parse files for documentation comments
*/


// markdown library
// https://marked.js.org/#/README.md#README.md
import '../libs/marked/marked.min.js';

// Syntax highlighter
// https://prismjs.com/
import '../libs/prism/prism.js';

import cache   from '../../fn/modules/cache.js';
import capture from '../../fn/modules/capture.js';
import id      from '../../fn/modules/id.js';
import invoke  from '../../fn/modules/invoke.js';
import last    from '../../fn/modules/lists/last.js';
import nothing from '../../fn/modules/nothing.js';
import slugify from '../../fn/modules/strings/slugify.js';
import { parseString } from './parse-string.js';
import parseParams from '../../fn/modules/parse-params.js';

import { cyan, blue, dim } from './log.js';

const DEBUG = false;//true; 
const A = Array.prototype;

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

const parseParensClose = capture(/^\)\s*/, {}, null);

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
//                             /**         (.)  (--) (::part()     (") (<) ({[ {{ {%)  (word)
//                                         1    2    3             4   5   6           7    
const parseComment = capture(/\/\*\*+\s*(?:(\.)|(--)|(::part\()\s*|(")|(<)|(\{[\{\[%])|(\b))/, {
    // New data object
    0: function(nothing, captures) {
        //console.log(captures.input.slice(captures.index, captures.index + 16), '(' + captures[1] + ')');
        return {};       
    },

    // Class, property or method .(name) (=) (()
    //              1                  2   3     4        
    1: capture(/^(?:([\w][\w\d]*)\s*(?:(=)|(\())|([\w\d:\-[\]="]+(?:,\s*[\w\d.:\-[\]="]+)*))\s*/, {
        // Property 
        // .property="default"
        2: function(data, captures) {
            data.type    = 'property';
            data.prefix = '.';
            data.name = captures[1];
            // Todo: capture default value of arbitrary type
            //data.default = captures[2];
            return data;
        },

        // Method
        // .method(param, param, ...)
        3: function(data, captures) {
            data.type   = 'method';
            data.prefix = '.';
            data.name   = captures[1];
            data.params = parseParams([], captures);
            parseParensClose(captures);
            // Todo capture end bracket )
            return data;
        },

        // Selector(s)
        // .class, .class-2, element
        4: function(data, captures) {
            data.type = 'selector';
            data.prefix = '.';
            data.name = captures[4];
            return data;
        },

        catch: function(data) {
            throw new SyntaxError('Invalid .property=default, .method(param, ...) or selector');        
        }
    }),

    // CSS Variable (name): (value)
    //           1                 2
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
    3: capture(/^([\w-]+)\s*\)\s*/, {
        1: function(data, captures) {
            data.type = 'part';
            data.name = captures[1];
            return data;
        },

        catch: function(data, captures) {
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

    // Attribute name="value" or fn:params or function() or Contructor() or 
    // arbitrary text including any newlines preceded by a comma
    //              1                2               3                     4                      5       
    7: capture(/^(?:([\w-:]+)\s*=\s*|([\w-]+)\s*:\s*|([\w][\w\d]*)\s*\(\s*|([A-Z](?:[^\n]|,\s*)*)|([^\n](?:[^\n]|,\n)*))\s*/, {
        // name="value" name='value' name=value
        1: function(data, captures) {
            data.type    = 'attribute';
            data.name    = captures[1];
            data.default = parseString(captures);
            return data;
        },

        // name: param, param, ...
        2: function(data, captures) {
            data.type   = 'fn';
            data.name   = captures[2];
            data.params = parseParams([], captures);
            return data;
        },

        // function or Constructor
        3: function(data, captures) {
            // If first letter is a capital it's a constructor
            data.type   = /^[A-Z]/.test(data.name) ? 'constructor' : 'function' ;
            data.name   = captures[3];
            data.params = parseParams([], captures);
            return data;
        },

        // Title (begins with a capital and continues until newline that is not 
        // preceded by a comma)
        4: function(data, captures) {
            data.type = 'title';
            data.name = captures[4];
            return data;
        },

        // Assume it's a selector
        5: function(data, captures) {
            data.type = 'selector';
            data.name = captures[5];
            return data;
        }
    }),

    // Markdown (anything) close comment */
    close: capture(/^\s*([\s\S]*?)\*+\//, {
        1: function(data, captures) {
            data.examples = [];

            // Alias body 
            data.body = marked(captures[1], Object.assign(markedOptions, {
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

    catch: id
}, null);


/**
parseComments(string)
Parses documentation comments out of JS or CSS files.
**/

export default capture(/^/, {
    // We only use capture here to guarantee a captures object
    0: function(nothing, captures) {
        const comments = [];
        let comment;
        while ((comment = parseComment(captures))) {
            if (DEBUG) {
                console.log(dim + ' ' + cyan, 'Comment', comment.type);
            }

            comments.push(comment);
        }
        return comments;
    }
}, null);
