
import capture  from '../../fn/modules/capture.js';
import id       from '../../fn/modules/id.js';
import noop     from '../../fn/modules/noop.js';
import nothing  from '../../fn/modules/nothing.js';
import overload from '../../fn/modules/overload.js';
import pipe     from '../../fn/modules/pipe.js';
import { retrieve as getPipe } from './pipes.js';
import { parseString } from './parse-string.js';
import { parseParams } from './parse-params.js';


/**
parseString(string)
**/

const parseStrings1 = capture(/^/, {
    done: function(array, captures) {
        const string = parseString(captures);
        if (string) {
            array.push(string);
            parseStrings1(array, captures);
        }
        return array;
    }
});

function parseStrings(input) {
    return parseStrings1([], input);
}


/**
parseProperty(string)
**/

const parseProperty = capture(/^([\w][\w\d]*)\s*=\s*/, {
    1: (nothing, captures) => ({
        name:  captures[1],
        value: parseTypedParam(captures)
    }),

    catch: noop
}, null);

const parseWith = capture(/^/, {
    0: () => [],

    done: (array, captures) => {
        let property;
        while (property = parseProperty(captures)) {
            array.push(property);
        }
        return array;
    }
}, null);


/**
createTransform(pipes)
Create a transform function from an array of pipe tokens.
MOVED TO RENDER TREE
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

import parsePipe from '../../fn/modules/parse-pipe.js';

const parseFilter = capture(/^([\w.-]*)\s*(\|)?\s*/, {
    1: (nothing, captures) => (captures[1] === '.' ?
        // No initial transform
        [] :
        // Object path 'xxxx.xxx.xx-xxx'
        [{ name: 'get', args: [captures[1]] }]
    ),

    // Pipe '|'
    2: function(pipes, captures) {
        parsePipe(pipes, captures);
        return pipes;
    }
}, undefined);


/** 
parseTypedParam(string)
**/

const parseArrayClose = capture(/^]\s*/, nothing, nothing);


/**
parseKeyValue(object, string)
**/

const parseKeyValue = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w][\w\d]*))\s*:\s*/, {
    // String key "
    1: (data, captures) => {
        data[captures[1]] = parseTypedParam(captures);
        return data;
    },

    // String key '
    2: (data, captures) => {
        data[captures[2]] = parseTypedParam(captures);
        return data;
    },

    // Unquoted key
    3: (data, captures) => {
        data[captures[3]] = parseTypedParam(captures);
        return data;
    },

    // Another key:value or object close
    done: capture(/^(?:(,)|\})\s*/, {
        1: (data, captures) => parseKeyValue(data, captures),
        catch: () => { throw new SyntaxError('Badly formed object'); }
    }),

    // Allow empty object
    catch: capture(/^}\s*/, {
        catch: (data, captures) => { throw new SyntaxError('Unclosed object at \n\n' + captures.input.slice(captures.index, 32) + '\n\n'); }
    })
});


//                                          "string"                   'string'                   [array {object
export const parseTypedParam = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\[)|(\{))\s*/, {
    // String
    1: (nothing, captures) => ({
        type:  'string',
        value: captures[1]
    }),

    // String
    2: (nothing, captures) => ({
        type:  'string',
        value: captures[2]
    }),

    // Array
    3: (nothing, captures) => {
        const data = {
            type:  'array',
            value: parseParams(captures)
        };
        parseArrayClose(captures);
        return data;
    },

    // Object
    4: (nothing, captures) => ({
        type: 'object',
        value: parseKeyValue({}, captures)
    }),

    // If it's not a value, assume it's a pipe
    catch: (nothing, captures) => ({
        type:  'pipe',
        value: parseFilter(captures)
    })
}, null);


/** 
parseTagClose(string)
Parses tag close `%}` (and it consumes an immediate line break, if there is 
one, and following whitespace).
**/

const parseTagClose = capture(/^\%\}(?:\n\s*)?/, {
    0: (token, captures) => {
        token.end += captures.index + captures[0].length;
        return token;
    },

    catch: function(token, captures) {
        throw new SyntaxError('Unclosed tag \n\n'
            + captures.input.slice(Math.max(0, token.begin - 24), token.begin)
            + '⮕'
            + captures.input.slice(token.begin, token.begin + 24)
            + '\n'
        );      
    }
});


/** 
parseTag(string)
Parses tags, properties. comments and plain text.
**/

function indentation(captures) {
    const i = captures.input.lastIndexOf('\n', captures.index);
    const string = captures.input.slice(i + 1, captures.index);
    return /^\s*/.exec(string)[0];
}

//                            1          2               3
const parseImport = capture(/^(\w+)\s+(?:(from-comments)|(from))\s+/, {
    2: (token, captures) => {
        token.imports.push({
            name: captures[1],
            type: 'comments',
            from: parseTypedParam(captures)
        });
        token.end += captures.index + captures[0].length + captures.consumed;
        return token;
    },

    3: (token, captures) => {
        token.imports.push({
            name: captures[1],
            type: 'json',
            from: parseTypedParam(captures)
        });
        token.end += captures.index + captures[0].length + captures.consumed;
        return token;
    },

    done: parseTagClose,

    catch: () => {
        throw new SyntaxError('Failed to parse {% import %}');
    } 
});

const parseImports = capture(/^/, {
    0: parseImport,

    done: capture(/^\s*\{\%\s*import\s*/, {
        0: (token, captures) => {
            token.end += captures.index + captures[0].length;
            parseImports(token, captures);
            return token;
        },

        catch: id
    })
});

const parseTag = capture(/\{(?:(\%)|(\{)|(#))\s*|(src=['"]?|href=['"]?|url\(\s*['"]?|from\s+['"]|import\s+['"])([\:\.\/\w-\d\%]+)/, {
    // Create new object tracking start and end of token
    0: (nothing, captures) => ({
        begin:  captures.index,
        end:    captures.index + captures[0].length,
        indent: indentation(captures)
    }),

    // {% tag %}
    1: capture(/^([\w-]+)\s*/, {
        0: (token, captures) => {
            token.type = 'tag';
            token.end += captures.index + captures[0].length;
            token.name = captures[1];
            return token;
        },

        1: overload((token, captures) => captures[1], {
            'context': capture(/^/, {
                // {% context path|pipe:param %}
                0: (token, captures) => {
                    token.param = {
                        pipes: parseFilter(captures)
                    };

                    token.param.transform = createTransform(token.param.pipes);
                    token.end += captures.consumed;
                    return token;
                },

                done: function(token, captures) {
                    parseTagClose(token, captures);
                    const consumed = captures.consumed;
                    token.tree = parseTemplate([], captures);
                    token.end += captures.consumed - consumed;
                    return token;
                }
            }),

            'each': capture(/^/, {
                // {% each %}
                done: function(token, captures) {
                    parseTagClose(token, captures);
                    const consumed = captures.consumed;
                    token.tree = parseTemplate([], captures);
                    token.end += captures.consumed - consumed;
                    return token;
                }
            }),

            'if': capture(/^/, {
                // {% if property %}
                done: function(token, captures) {
                    token.selector = parseString(captures);
                    token.end += captures.consumed;
                    parseTagClose(token, captures);
                    const consumed = captures.consumed;
                    token.tree = parseTemplate([], captures);
                    token.end += captures.consumed - consumed;
                    return token;
                }
            }),

            'import': (token, captures) => {
                throw new SyntaxError(
                    'Import tags must be declared at the start of bolt templates\n{% ' 
                    + captures.input.slice(0, captures.input.indexOf('%}')) 
                    + '%}'
                );
            },

            'include': capture(/^([^\s]+)(?:\s+(comments)\s+|\s+(import)\s+|\s+(context)\s+|\s+(with)\s+)?\s*/, {
                // {% include template.html %}         
                1: (token, captures) => {
                    token.end += captures.index + captures[0].length;
                    token.src  = captures[1];
                    return token;
                },

                // {% include template.html comments file.css %}
                2: (token, captures) => {
                    // TODO: implement import-comments 
                    /* token.imports.push({
                        type: 'comments',
                        from: parseTypedParam(captures)
                    });
                    token.end += captures.index + captures[0].length + captures.consumed;
                    return token; */
                },

                // {% include template.html import package.json %}
                3: (token, captures) => {
                    token.import = parseString(captures);
                    token.end += captures.consumed;
                    return token;
                },

                // {% include template.html context value|pipe %}
                4: (token, captures) => {
                    token.context = {
                        type:  'context',
                        value: parseTypedParam(captures)
                    };
                    token.end += captures.consumed;
                    return token;
                },

                // {% include template.html with name="value" %}
                5: (token, captures) => {
                    token.with = parseWith(captures);
                    token.end += captures.consumed;
                    return token;
                },

                done: parseTagClose
            }),

            'with': capture(/^/, {
                // {% with path|pipe:param %}
                0: (token, captures) => {
                    token.param = { pipes: parseFilter(captures) };
                    token.param.transform = createTransform(token.param.pipes);
                    token.end += captures.consumed;
                    return token;
                },

                done: function(token, captures) {
                    parseTagClose(token, captures);
                    const consumed = captures.consumed;
                    token.tree = parseTemplate([], captures);
                    token.end += captures.consumed - consumed;
                    return token;
                }
            }),

            // {% end %}
            'end': function(token, captures) {
                token.name = 'end';
                parseTagClose(token, captures);
                return token;
            },

            default: function(token, captures) {
                throw new SyntaxError('Unrecognised tag {% ' + captures[1] + ' %} (possible tags: docs, each, if, include, with, end)');
            }
        }),

        catch: function(token, captures) {
            throw new SyntaxError('Cannot parse {% tag %} at index ' + token.begin + '');  
        }
    }),

    // {{ Property }}
    2: capture(/^/, {
        0: (token, captures) => {
            token.type  = 'property';
            token.pipes = parseFilter(captures);
            token.end  += captures.consumed;
            return token;
        },

        done: capture(/^\}\}/, {
            0: (token, captures) => {
                token.end += captures.index + captures[0].length;
                token.transform = createTransform(token.pipes);
                return token;
            },

            catch: function(token, captures) {
                throw new SyntaxError('Unclosed property {{ at index ' + token.begin + '');     
            }
        }),

        catch: function() {
            throw new SyntaxError('Cannot parse {{ property }} at index ' + token.begin + '');
        }
    }),

    // {# Comment #}
    3: capture(/\#\}/, {
        0: (token, captures) => {
            token.end += captures.index + captures[0].length;
            token.type = 'comment';
            token.text = captures.input.slice(0, captures.index).replace(/\s*$/, '');
            return token;
        },

        catch: function(token, captures) {
            throw new SyntaxError('Unclosed comment {# at index ' + token.begin + '');     
        }
    }),

    // URL
    4: (token, captures) => {
        // Group 4 is the prefix src=", href=", url( or from ", group 5 is the
        // URL itself. Don't include the prefix in the token's begin index.
        token.begin += captures[4].length;
        token.type   = 'url';
        token.url    = captures[5];
        return token;        
    },

    done: (token, captures) => {
        // Capture the actual code of the token
        token.code = captures.input.slice(
            captures.index, 
            captures.index + captures[0].length + captures.consumed
        )
        // throw away everything beyond the first line
        .replace(/\n[\S\s]*$/, '');

        return token;
    },

    // If no tags are found return undefined
    catch: noop
}, null);

const parseTemplate = capture(/^(\s*\{\%\s*import\s+)?/, {
    1: (array, captures) => {
        const token = parseImports({
            type:    'tag',
            name:    'import',
            begin:   0,
            end:     captures[0].length,
            imports: []
        }, captures);

        token.code = captures.input.slice(0, token.end);
        array.push(token);
        return array;
    },

    done: (array, captures) => {
        let tag;
        let i = array[0] && array[0].end || 0;

        // Loop through tags in the template
        while ((tag = parseTag(captures))) {
            if (tag.begin > 0) {
                array.push({
                    begin: 0,
                    end:   tag.begin,
                    type:  'text',
                    text:  captures.input.slice(i, i + tag.begin)
                });
            }

            // End tag stops processing and returns immediately
            if (tag.type === 'tag' && tag.name === 'end') {
                return array;
            }

            array.push(tag);
            i += tag.end;
        }

        // Push in the final text to the end
        const remainder = captures.input.slice(i);
        if (remainder) {
            array.push({
                type: 'text',
                text: captures.input.slice(i)
            });
        }

        return array;
    }
});

export default function(template) {
    return parseTemplate([], template);
}
