
/**
Parse template
**/

import capture  from '../../fn/modules/capture.js';
import id       from '../../fn/modules/id.js';
import last     from '../../fn/modules/lists/last.js';
import noop     from '../../fn/modules/noop.js';
import nothing  from '../../fn/modules/nothing.js';
import overload from '../../fn/modules/overload.js';
import pipe     from '../../fn/modules/pipe.js';
import { retrieve as getPipe } from './pipes.js';

const assign = Object.assign;


/** 
parseString(string)
**/

//                                     "string"                   'string'                   string
export const parseString = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.\-#/?:\\]+))\s*/, {
    // "string"
    1: (nothing, tokens) => tokens[1],
    // 'string'
    2: (nothing, tokens) => tokens[2],
    // string
    3: (nothing, tokens) => tokens[3],
    // return undefined
    catch: noop
}, null);

const parseStrings1 = capture(/^/, {
    close: function(array, groups) {
        const string = parseString(groups);
        if (string) {
            array.push(string);
            parseStrings1(array, groups);
        }
        return array;
    }
});

function parseStrings(input) {
    return parseStrings1([], input);
}



/**
createTransform(pipes)
Create a transform function from an array of pipe tokens.
**/

export function createTransform(pipes) {
    const fns = pipes.map((data) => {
        // Look in global pipes first
        var fn = getPipe(data.name);

        if (!fn) {
            throw new ReferenceError('Template pipe "' + data.name + '" not found.');
        }

        // If there are arguments apply them to fn
        return data.args && data.args.length ?
            (value) => fn(...data.args, value) :
            fn ;
    });

    // Cache the result
    return pipe.apply(null, fns);
}



/**
parseFilter(string)
Parses "selector|filter:param" syntax.
*/

import { parsePipe } from '../../fn/modules/parse-pipe.js';

const parseFilter = capture(/^([\w.-]*)\s*(\|)?\s*/, {
    1: (nothing, groups) => (groups[1] === '.' ?
        // No initial transform
        [] :
        // Object path 'xxxx.xxx.xx-xxx'
        [{ name: 'get', args: [groups[1]] }]
    ),

    // Pipe '|'
    2: function(pipes, groups) {
        parsePipe(pipes, groups);
        return pipes;
    }
}, undefined);



/** 
parseTag(string)
Parses tags, properties. comments and plain text
**/

const parseCloseTag = capture(/^\%\}/, {
    0: (token, groups) => {
        token.end += groups.index + groups[0].length;
        return token;
    },

    catch: function(token, groups) {
        throw new SyntaxError('Unclosed tag \n\n'
            + groups.input.slice(Math.max(0, token.begin - 24), token.begin)
            + '⮕'
            + groups.input.slice(token.begin, token.begin + 24)
            + '\n'
        );      
    }
});

function indentation(groups) {
    const i = groups.input.lastIndexOf('\n', groups.index);
    const string = groups.input.slice(i + 1, groups.index);
    return /^\s*/.exec(string)[0];
}

const parseTag = capture(/\{(?:(\%)|(\{)|(#))\s*|(src=['"]?|href=['"]?|url\(\s*['"]?|from\s+['"]|import\s+['"])([\:\.\/\w-\d\%]+)/, {
    // Create new object tracking start and end of token
    0: (nothing, groups) => ({
        begin:  groups.index,
        end:    groups.index + groups[0].length,
        indent: indentation(groups)
    }),

    // {% tag %}
    1: capture(/^([\w-]+)\s*/, {
        0: (token, groups) => {
            token.type = 'tag';
            token.end += groups.index + groups[0].length;
            token.fn   = groups[1];
            return token;
        },

        1: overload((token, groups) => groups[1], {
            // {% docs url from source-urls %}
            'docs': capture(/^([^\s]+)(?:\s+type\s+([\w-]+))?(\s+from\s+)\s*/, {
                // {% docs template.html %}
                1: (token, groups) => {
                    token.end += groups.index + groups[0].length;
                    token.src = groups[1];
                    return token;
                },

                // {% docs template.html type string from file.css file.js ... %}
                2: (token, groups) => {
                    token.filterType = groups[2];
                    return token;
                },

                // {% docs template.html from file.css file.js ... %}
                3: (token, groups) => {
                    token.sources = parseStrings(groups);
                    token.end += groups.consumed;
                    return token;
                },

                close: parseCloseTag
            }),

            'each': capture(/^/, {
                // {% each %}
                close: function(token, groups) {
                    parseCloseTag(token, groups);
                    const consumed = groups.consumed;
                    token.tree = parseTemplate([], groups);
                    token.end += groups.consumed - consumed;
                    return token;
                }
            }),

            'if': capture(/^/, {
                // {% if property %}
                close: function(token, groups) {
                    token.selector = parseString(groups);
                    token.end += groups.consumed;
                    parseCloseTag(token, groups);
                    const consumed = groups.consumed;
                    token.tree = parseTemplate([], groups);
                    token.end += groups.consumed - consumed;
                    return token;
                }
            }),

            'import': capture(/^(\w+)\s+from\s+/, {
                0: (token, groups) => {
                    token.var    = groups[1];
                    token.import = parseString(groups);
                    token.end   += groups.index + groups[0].length + groups.consumed;
                    return token;
                },

                close: parseCloseTag
            }),

            'include': capture(/^([^\s]+)(?:\s+(import)\s+|\s+(with)\s+)?\s*/, {
                // {% include template.html %}         
                1: (token, groups) => {
                    token.end += groups.index + groups[0].length;
                    token.src  = groups[1];
                    return token;
                },
            
                // {% include template.html import package.json %}
                2: (token, groups) => {
                    token.import = parseString(groups);
                    token.end += groups.consumed;
                    return token;
                },
            
                // {% include template.html with name="value" %}
                3: (token, groups) => {
                    // Todo
                    //token.import = parseAttributes(groups);
                    token.end += groups.consumed;
                    return token;
                },
            
                close: parseCloseTag
            }),

            'with': capture(/^/, {
                // {% with path|pipe:param %}
                0: (token, groups) => {
                    token.param = { pipes: parseFilter(groups) };
                    token.param.transform = createTransform(token.param.pipes);
                    token.end += groups.consumed;
                    return token;
                },

                close: function(token, groups) {
                    parseCloseTag(token, groups);
                    const consumed = groups.consumed;
                    token.tree = parseTemplate([], groups);
                    token.end += groups.consumed - consumed;
                    return token;
                }
            }),

            // {% end %}
            'end': function(token, groups) {
                token.type = 'end';
                parseCloseTag(token, groups);
                return token;
            },

            default: function(token, groups) {
                throw new SyntaxError('Unrecognised tag {% ' + groups[1] + ' %} (possible tags: docs, each, if, include, with, end)');
            }
        }),

        catch: function(token, groups) {
            throw new SyntaxError('Cannot parse {% tag %} at index ' + token.begin + '');  
        }
    }),

    // {{ Property }}
    2: capture(/^/, {
        0: (token, groups) => {
            token.type  = 'property';
            token.pipes = parseFilter(groups);
            token.end  += groups.consumed;
            return token;
        },

        close: capture(/^\}\}/, {
            0: (token, groups) => {
                token.end += groups.index + groups[0].length;
                token.transform = createTransform(token.pipes);
                return token;
            },

            catch: function(token, groups) {
                throw new SyntaxError('Unclosed property {{ at index ' + token.begin + '');     
            }
        }),

        catch: function() {
            throw new SyntaxError('Cannot parse {{ property }} at index ' + token.begin + '');
        }
    }),

    // {# Comment #}
    3: capture(/\#\}/, {
        0: (token, groups) => {
            token.end += groups.index + groups[0].length;
            token.type = 'comment';
            token.text = groups.input.slice(0, groups.index).replace(/\s*$/, '');
            return token;
        },

        catch: function(token, groups) {
            throw new SyntaxError('Unclosed comment {# at index ' + token.begin + '');     
        }
    }),

    // URL
    4: (token, groups) => {
        // Group 4 is the prefix src=", href=", url( or from ", group 5 is the
        // URL itself. Don't include the prefix in the token's begin index.
        token.begin += groups[4].length;
        token.type   = 'url';
        token.url    = groups[5];
        return token;        
    },

    // If no tags are found return undefined
    catch: noop
}, null);

const parseTemplate = capture(/^/, {
    0: (array, groups) => {
        let tag;
        let i = 0;

        // Loop through tags in the template
        while ((tag = parseTag(groups))) {
            if (tag.begin > 0) {
                array.push({
                    begin: 0,
                    end:  tag.begin,
                    type: 'text',
                    text: groups.input.slice(i, i + tag.begin)
                });
            }

            // End tag stops processing and returns immediately
            if (tag.type === 'end') {
                return array;
            }

            array.push(tag);
            i += tag.end;
        }

        // Push in the final text to the end
        array.push({
            type: 'text',
            text: groups.input.slice(i)
        });

        return array;
    }
});

export default function(template) {
    return parseTemplate([], template);        
}
