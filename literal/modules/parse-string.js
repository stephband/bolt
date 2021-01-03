import capture from '../../fn/modules/capture.js';
import noop    from '../../fn/modules/noop.js';


/** 
parseString(string)
**/

//                                      "string"                   'string'                    string
export const parseString = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([\w.\-#/?:\\]+))\s*/, {
    // "string"
    1: (nothing, captures) => captures[1],
    // 'string'
    2: (nothing, captures) => captures[2],
    // string
    3: (nothing, captures) => captures[3],
    
    catch: noop
}, null);


/** 
parseQuotedString(string)
**/

//                                      "string"                   'string'
export const parseQuoted = capture(/^(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')\s*/, {
    // "string"
    1: (nothing, captures) => captures[1],
    // 'string'
    2: (nothing, captures) => captures[2]
}, null);


