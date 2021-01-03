import capture from '../../fn/modules/capture.js';
import id      from '../../fn/modules/id.js';


/**
parseParams(array, string)
**/

//                              1 number                           2 "string"                 3 'string'                 4 null 5 true 6 false 7 [array]    8 {object}  9 function(args) 10 /regex/         dot  string            
const parseParam = capture(/^(?:(-?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?)|"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|(null)|(true)|(false)|(\[[^\]]*\])|(\{[^}]*\})|(\w+)\(([^)]+)\)|\/((?:[^/]|\.)*)\/|(\.)?([\w.\-#/?:\\]+))\s*/, {
    // number
    1: function(params, tokens) {
        params.push(parseFloat(tokens[1]));
        return params;
    },

    // "string"
    2: function(params, tokens) {
        params.push(tokens[2]);
        return params;
    },

    // 'string'
    3: function(params, tokens) {
        params.push(tokens[3]);
        return params;
    },

    // null
    4: function(params) {
        params.push(null);
        return params;
    },

    // true
    5: function(params) {
        params.push(true);
        return params;
    },

    // false
    6: function(params) {
        params.push(false);
        return params;
    },

    // [array]
    7: function(params, tokens) {
        params.push(JSON.parse(tokens[7]));
        return params;
    },

    // flat {object}
    8: function (params, tokens) {
        params.push(JSON.parse(tokens[8]));
        return params;
    },

    // Todo: review syntax for nested functions
    // function(args)
    //8: function(params, value, result) {
    //    // Todo: recurse to parseFn for parsing inner functions
    //    value = Sparky.transforms[value].apply(null, JSON.parse('[' + result[9].replace(rsinglequotes, '"') + ']'));
    //    params.push(value);
    //    return params;
    //},

    // /regexp/
    11: function(params, tokens) {
        const regex = RegExp(tokens[11]);
        params.push(regex);
    },

    // string
    13: function(params, tokens) {
        params.push(tokens[13]);
        return params;
    },

    // Comma terminator - more params to come
    close: capture(/^,\s*/, {
        close: function(params, tokens) {
            return parseParam(params, tokens);
        },

        catch: id
    }),

    catch: id
    /*
    function(params, string) {
        // string is either the input string or a tokens object
        // from a higher level of parsing
        throw new SyntaxError('Invalid parameter "' + (string.input || string) + '"');
    }*/
});

export function parseParams(string) {
    return parseParam([], string);
}
