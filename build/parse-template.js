
/*
Parse template
*/

import capture from '../../fn/modules/capture.js';
import id from '../../fn/modules/id.js';
import last from '../../fn/modules/lists/last.js';
import noop from '../../fn/modules/noop.js';
import nothing from '../../fn/modules/nothing.js';
import overload from '../../fn/modules/overload.js';


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
parseToken(string)
**/

//         {%     {{    
const parseTag = capture(/(\{(?:\%|\{|#))\s*/, {
    // Create new object tracking start and end of token
    0: (nothing, groups) => ({
        begin: groups.index,
        end:   groups.index + groups[0].length
    }),

    // Property .property = default
    1: overload((token, groups) => groups[1], {
        // Tags
        '{%': capture(/^([\w-]+)\s*/, {
            0: (token, groups) => {
                token.end += groups.index + groups[0].length;
                token.type = 'tag';
                token.fn  = groups[1];
                return token;
            },

            1: overload((token, groups) => groups[1], {
                // {% docs template-url from source-urls %}
                'docs': capture(/^([^\s]+)(\s+from\s+)?\s*/, {
                    0: (token, groups) => {
                        token.end += groups.index + groups[0].length;
                        return token;
                    },

                    1: (token, groups) => {
                        token.template = groups[1];
                        return token;
                    },

                    2: (token, groups) => {
                        token.sources = parseStrings(groups);
                        token.end += groups.consumed;
                        return token;
                    }
                }),

                default: function(token, groups) {
                    throw new SyntaxError('Unrecognised tag {% ' + groups[1] + ' %} (possible tags: docs)');
                }
            }),

            close: capture(/^\%\}/, {
                0: (token, groups) => {
                    token.end += groups.index + groups[0].length;
                    return token;
                },

                catch: function(token, groups) {
                    throw new SyntaxError('Unclosed tag {% at index ' + token.begin + '');      
                }
            }),

            catch: function(token, groups) {
                throw new SyntaxError('Cannot parse {% tag %} at index ' + token.begin + '');  
            }
        }),

        // Properties
        '{{': capture(/^([\w-]+)\s*/, {
            1: (token, groups) => {
                token.end += groups.index + groups[0].length;
                token.type = 'property';
                token.selector = groups[1];
                return token;
            },

            close: capture(/^\}\}/, {
                0: (token, groups) => {
                    token.end += groups.index + groups[0].length;
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

        // Comments
        '{#': capture(/\#\}/, {
            0: (token, groups) => {
                token.end += groups.index + groups[0].length;
                token.type = 'comment';
                token.text = groups.input.slice(0, groups.index).replace(/\s*$/, '');
                return token;
            },

            catch: function(token, groups) {
                throw new SyntaxError('Unclosed comment {# at index ' + token.begin + '');     
            }
        })
    }),

    // If no tags are found return undefined
    catch: noop
}, null);

const parseTemplate = capture(/^/, {
    close: function(array, groups) {
        const tag = parseTag(groups);
        if (tag) {
            array.push(tag);
            parseTemplate(array, groups);
        }
        return array;
    }
});

export default function(template) {
    return parseTemplate([], template);        
}




