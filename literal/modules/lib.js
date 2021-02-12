
/* Scope functions */

import overload    from '../../../fn/modules/overload.js';
import { addDate } from '../../../fn/modules/date.js';
import { addTime } from '../../../fn/modules/time.js';
import by          from '../../../fn/modules/by.js';
import equals      from '../../../fn/modules/equals.js';
import matches     from '../../../fn/modules/matches.js';
import get         from '../../../fn/modules/get-path.js';
import px, { em, rem } from './parse-length.js';
import exec        from '../../../fn/modules/exec.js';
import slugify     from '../../../fn/modules/slugify.js';
import Pipe        from './pipe.js';


/**
add(number|date|time)

Adds `n` to value. Behaviour is overloaded to accept various types of 'n'.
Where `n` is a number, it is summed with value. So to add 1 to any value:

```html
${ pipe(add(1), data.number) }
```

Where 'n' is a duration string in date-like format, value is expected to be a
date and is advanced by the duration. So to advance a date by 18 months:

```html
${ pipe(add('0000-18-00'), data.date) }
```

Where 'n' is a duration string in time-like format, value is expected to be a
time and is advanced by the duration. So to put a time back by 1 hour and 20
seconds:

```html
${ pipe(add('-01:00:20'), data.time) }
```
**/

function toAddType(n) {
    const type = typeof n;
    return type === 'string' ?
        /^-?\d\d\d\d(?:-|$)/.test(n) ? 'date' :
        /^-?\d\d(?::|$)/.test(n) ? 'time' :
        'string' :
    type;
}

const lib = {
    add: overload(toAddType, {
        'date': addDate,
        'time': addTime,
        'string': (a) => (b) => b + a,
        'number': (a) => (b) => b + a,
        'default': function(n) {
            throw new Error('add(value) does not accept values of type ' + typeof n);
        }
    }),

    by, entries: Object.entries, em, equals, exec, get, keys: Object.keys,
    matches, Pipe, px, rem, slugify, values: Object.values
};

export default lib;

export function register(name, fn) {
    if (lib[name]) {
        throw new Error('Literal: function "' + name + '" already registered');
    }

    lib[name] = fn;
}
