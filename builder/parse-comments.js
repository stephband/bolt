
/*
Parse files for documentation comments
*/


// markdown library
// https://marked.js.org/#/README.md#README.md
import '../libs/marked/marked.min.js';

// Syntax highlighter
// https://prismjs.com/
import '../libs/prism/prism.js';

import capture from '../../fn/modules/capture.js';
import id      from '../../fn/modules/id.js';
import noop    from '../../fn/modules/noop.js';
import slugify from '../../fn/modules/strings/slugify.js';
import { parseString } from './parse-string.js';
import { parseParams } from './parse-params.js';

import { cyan, blue, dim } from './log.js';

const DEBUG = false;//true;

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

//                             1                                2
const parseSelector = capture(/^([\w\d:.[][\w\d:\-[\]="' …>+().]+)(?:,\s*(\n)\s*|,(\s*))?/, {
    // Class, element, attribute, pseudo selector
    1: (selector, captures) => selector + captures[1],
    // Comma new lines, stripping extra whitespace
    2: (selector, captures) => parseSelector(selector + ',\n', captures),
    // Comma spaces, preserving whitespace
    3: (selector, captures) => parseSelector(selector + ',' + captures[3], captures),
    // Doesn't parse
    catch: (selector, captures) => console.log('Parse selector undefined: ', captures.input.slice(0, 18)) 
});

//                                        1           2      3            4
const parsePropertyToSelector = capture(/^(,\s*\n\s*)|(,\s*)|(\s*[>+]\s*)|(-)/, {
    // Comma and new lines, stripping spaces
    1: (selector, captures) => selector + ',\n',
    // Comma and whitespace
    2: (selector, captures) => selector + captures[2],
    // Child or sibling selector
    3: (selector, captures) => selector + captures[3],
    // The rest of a class selector
    4: (selector, captures) => selector + captures[4],
    // Continue parsing
    done: parseSelector,
    // Compound selector
    catch: parseSelector
});
        
//                         1 word     2 (        3 =       4 line     5 anything else
const parseDotted = capture(/^(\w[\w\d]*)(?:(\(\s*)|(\s*=\s*)|(\s*\n\s*)|(\s*))/, {
    // If it is .xxx it could be a property or selector
    1: (data, captures) => {
        data.prefix = '.';
        data.name   = '.' + captures[1];
        return data;
    },

    // Is it a method
    2: (data, captures) => {
        data.type   = 'method';
        data.name  += captures[2];
        data.params = parseParams([], captures);
        parseParensClose(captures);
        return data;
    },

    // Is it a property with a default value
    3: (data, captures) => {
        data.type    = 'property';
        // TODO
        //data.default = parseValue(captures);
        return data;
    },

    // Could be a property without a default value, could be a class selector
    4: (data, captures) => {
        data.type    = 'property|selector';
        return data;        
    },

    5: (data, captures) => {
        // Is it a selector
        const selector = parsePropertyToSelector(data.name, captures);

        if (!selector) {
            throw new Error('Failed to parse .name ' + captures.input.slice(0, 18));
        }

        data.type = 'selector';
        data.name = selector;
        return data;
    }
});

//                             1 attribute =    2 key:             3 N     4 n  5 ame function    6 Title
const parseName = capture(/^(?:([\w-:]+)\s*=\s*|([\w-]+)\s*:\s*|(?:([A-Z])|(\w))([\w\d]*)\s*\(\s*|([A-Z](?:[^\n]|,\s*)*))\s*/, {
    // name="value" name='value' name=value
    1: (data, captures) => {
        data.type    = 'attribute';
        data.name    = captures[1];
        data.default = parseString(captures);
        return data;
    },

    // name: param, param, ...
    2: (data, captures) => {
        data.type   = 'fn';
        data.name   = captures[2];
        data.params = parseParams([], captures);
        return data;
    },

    // function or Constructor
    3: (data, captures) => {
        // If first letter is a capital it's a constructor
        data.type   = 'constructor';
        data.name   = captures[3] + captures[5];
        data.params = parseParams([], captures);
        return data;
    },
    
    // function or Constructor
    4: (data, captures) => {
        // If first letter is a capital it's a constructor
        data.type   = 'function' ;
        data.name   = captures[4] + captures[5];
        data.params = parseParams([], captures);
        return data;
    },

    // Title (begins with a capital and continues until newline that is not 
    // preceded by a comma)
    6: (data, captures) => {
        data.type = 'title';
        data.name = captures[4];
        return data;
    },
    
    catch: (data, captures) => {
        const selector = parseSelector('', captures);

        if (!selector) {
            throw new Error('Failed to parse name ' + captures.input.slice(0, 18));
        }

        data.type = 'selector';
        data.name = selector;
        return data;
    }
});

//                                         1 .  2 -- 3 ::part(     4 " 5 < 6 {[        7 word
const parseComment = capture(/\/\*\*+\s*(?:(\.)|(--)|(::part\()\s*|(")|(<)|(\{[\{\[%])|(\b))/, {
    // New data object
    0: function(nothing, captures) {
        //console.log(captures.input.slice(captures.index, captures.index + 16), '(' + captures[1] + ')');
        return {};       
    },

    1: (data, captures) => {
        data.prefix = '.';
        data.name   = '.';
        parseDotted(data, captures);
        return data;
    },

    // CSS Variable (name): (value)
    //           1                 2
    2: capture(/^([\w-]+)(?:\s*:\s*([\w\d-]+))?\s*/, {
        // --variable
        1: (data, captures) => {
            data.type   = 'var';
            data.prefix = '--';
            data.name   = captures[1];
            return data;
        },
    
        // --variable: default
        2: (data, captures) => {
            data.default = captures[2];
            return data;
        },
    
        catch: function(data) {
            throw new SyntaxError('Invalid --variable');        
        }
    }),
    
    // Part ::part( (name) )
    3: capture(/^([\w-]+)\s*\)\s*/, {
        1: (data, captures) => {
            data.type = 'part';
            data.prefix = '::';
            data.name = captures[1];
            return data;
        },
    
        catch: (data, captures) => {
            throw new SyntaxError('Invalid ::part()');        
        }
    }),
    
    // String "text"
    4: capture(/^([^"]*)"/, {
        1: (data, captures) => {
            data.type = 'string';
            data.name = captures[1];
            return data;
        },
    
        catch: function(data) {
            throw new SyntaxError('Unclosed "string');        
        }
    }),
    
    // Element <tag>
    5: capture(/^(\w[^>]*)>/, {
        // Element name
        1: (data, captures) => {
            data.type = 'element';
            data.name = captures[1];
            return data;
        },
    
        catch: function(data) {
            throw new SyntaxError('Invalid <tag>');        
        }
    }),
    
    // Django or sparky tag {[ tag ]}
    6: (data, captures) => {
        data.type = 'tag';
        data.name = '';
        /* TODO
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

    // attribute="", key:, Constructor(, function(, Title or selector
    7: parseName,

    //                 1 all until **/
    done: capture(/^\s*([\s\S]*?)\*+\//, {
        1: (data, captures) => {
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
    
        done: (data, captures) => {
            // TODO params?
            data.id = createId(data.type + '-' + slugify(data.name) + (data.params ? '' : ''));
            return data;
        }
    }),

    // Return undefined where no (more) comments found
    catch: noop
}, null);

/**
parseComments(string)
Parses documentation comments out of JS or CSS files.
**/

export default capture(/^/, {
    // We use capture here to guarantee a captures object
    0: (nothing, captures) => [],
    done: (comments, captures) => {
        let comment;
        while ((comment = parseComment(captures))) {
            comments.push(comment);
        }
        return comments;
    }
}, null);
