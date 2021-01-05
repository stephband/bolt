
import overload         from '../../../fn/modules/overload.js';

import { getPath }      from '../../../fn/modules/get-path.js';
import { equals }       from '../../../fn/modules/equals.js';

import { toRad, toDeg } from '../../../fn/modules/maths/core.js';
import toLevel          from '../../../fn/modules/maths/to-gain.js';
import todB             from '../../../fn/modules/maths/to-db.js';
import { clamp }        from '../../../fn/modules/maths/clamp.js';
import { mod }          from '../../../fn/modules/maths/mod.js';
import toCartesian      from '../../../fn/modules/maths/to-cartesian.js';
import toPolar          from '../../../fn/modules/maths/to-polar.js';

import { append }       from '../../../fn/modules/strings/append.js';
import { prepend }      from '../../../fn/modules/strings/prepend.js';
import { prepad }       from '../../../fn/modules/strings/prepad.js';
import { postpad }      from '../../../fn/modules/strings/postpad.js';
import slugify          from '../../../fn/modules/slugify.js';

import { formatDate, addDate } from '../../../fn/modules/date.js';
import { formatTime, addTime } from '../../../fn/modules/time.js';

import { default as px, em, rem } from './parse-length.js';

import { register }     from '../../../fn/modules/pipe-object.js';
export { default }      from '../../../fn/modules/pipe-object.js';

function toAddType(n) {
    const type = typeof n;
    return type === 'string' ?
        /^\d\d\d\d(?:-|$)/.test(n) ? 'date' :
        /^\d\d(?::|$)/.test(n) ? 'time' :
        'string' :
    type;
}

register({
    append:  append,
    prepend: prepend,
    prepad:  prepad,
    postpad: postpad,
    slugify: slugify,
    formatdate: formatDate,
    formattime: formatTime,

    // Override .add() to support dates and times
    add: overload(toAddType, {
        'date':   addDate,
        'time':   addTime,
        'string': (a, b) => b + a,
        'number': (a, b) => b + a,
        'default': function(n) {
            throw new Error('add(value) does not accept values of type ' + typeof n);
        }
    }),

    clamp:   clamp,
    mod:     mod,
    equals:  equals,
    get:     getPath,

    floor:   Math.floor,

    cartesian: toCartesian,
    polar:     toPolar,

    deg:       toDeg,
    rad:       toRad,

    gain:      toLevel,
    dB:        todB,

    px:        px,
    em:        em,
    rem:       rem
});
