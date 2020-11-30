import capture from '../../fn/modules/capture.js';
import noop    from '../../fn/modules/noop.js';

const assign = Object.assign;


/** 
parseString(string)
**/

//                                      "string"                   'string'                    string
export const parseString = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.\-#/?:\\]+))\s*/, {
    // "string"
    1: (nothing, tokens) => tokens[1],
    // 'string'
    2: (nothing, tokens) => tokens[2],
    // string
    3: (nothing, tokens) => tokens[3],
    
    catch: noop
}, null);


/** 
parseQuotedString(string)
**/

//                                      "string"                   'string'
export const parseQuoted = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')\s*/, {
    // "string"
    1: (nothing, tokens) => tokens[1],
    // 'string'
    2: (nothing, tokens) => tokens[2]
}, null);
