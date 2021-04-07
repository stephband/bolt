
/* Convert values to strings suitable for rendering to the DOM. 
(Duplicate of Sparky to-text.js) */

import id       from '../../../fn/modules/id.js';
import overload from '../../../fn/modules/overload.js';
import toType   from '../../../fn/modules/to-type.js';

// Matches the arguments list in the result of fn.toString()
const rarguments = /function(?:\s+\w+)?\s*(\([\w,\s]*\))/;

export default overload(toType, {
    'boolean': (value) => value + '',

    // Print function and parameters
    'function': (value) => (
        (value.name || 'function')
        + (rarguments.exec(value.toString()) || [])[1]
    ),

    // Convert NaN to empty string and Infinity to ∞ symbol
    'number': (value) => (
        Number.isNaN(value) ? '' :
            Number.isFinite(value) ? value + '' :
            value < 0 ? '-∞' : '∞'
    ),

    'string': id,

    'symbol': (value) => value.toString(),

    'undefined': (value) => '',

    'object': overload((object) => (object ? object.constructor.name : 'null'), {
        'RegExp':  (object) => object.source,
        'null':    () => '',
        'default': JSON.stringify
    }),

    'default': JSON.stringify
});
