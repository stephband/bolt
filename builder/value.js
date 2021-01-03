
import { sum }          from '../../fn/modules/maths/core.js';

import { getPath }      from '../../fn/modules/get-path.js';
import { equals }       from '../../fn/modules/equals.js';
import { get }          from '../../fn/modules/get.js';
import { has }          from '../../fn/modules/has.js';
import { is }           from '../../fn/modules/is.js';
import { matches }      from '../../fn/modules/matches.js';
import not              from '../../fn/modules/not.js';
import { toFixed }      from '../../fn/modules/to-fixed.js';
import toType           from '../../fn/modules/to-type.js';
import toClass          from '../../fn/modules/to-class.js';
import * as normalise   from '../../fn/modules/normalisers.js';
import * as denormalise from '../../fn/modules/denormalisers.js';

import id               from '../../fn/modules/id.js';
import parseValue       from '../../fn/modules/parse-value.js';

import { exp, log, multiply, pow, root, toRad, toDeg } from '../../fn/modules/maths/core.js';
import toLevel          from '../../fn/modules/maths/to-gain.js';
import todB             from '../../fn/modules/maths/to-db.js';
import { clamp }        from '../../fn/modules/maths/clamp.js';
import { mod }          from '../../fn/modules/maths/mod.js';
import toCartesian      from '../../fn/modules/maths/to-cartesian.js';
import toPolar          from '../../fn/modules/maths/to-polar.js';

import { append }       from '../../fn/modules/strings/append.js';
import { prepend }      from '../../fn/modules/strings/prepend.js';
import { prepad }       from '../../fn/modules/strings/prepad.js';
import { postpad }      from '../../fn/modules/strings/postpad.js';
import slugify          from '../../fn/modules/strings/slugify.js';
import toCamelCase      from '../../fn/modules/to-camel-case.js';

import { contains }     from '../../fn/modules/lists/core.js';
import last             from '../../fn/modules/lists/last.js';
import { take }         from '../../fn/modules/take.js';
import { rest }         from '../../fn/modules/rest.js';

import overload         from '../../fn/modules/overload.js';
import { formatDate, addDate } from '../../fn/modules/date.js';
import { formatTime, addTime, subTime } from '../../fn/modules/time.js';

import { default as px, em, rem } from './parse-length.js';
import { sum as add } from '../../fn/modules/maths/core.js';


/**
Value(value)
**/

function method(fn) {
    return function(...params) {
        this.value = fn(...params, this.value);
        return this;
    }
}

export default function Value(value) {
    this.value = value;
}

Object.assign(Value, {
    of: (value) => new Value(value)
});

Object.assign(Value.prototype, {
    append:  method(append),
    prepend: method(append),
    prepad:  method(prepad),
    postpad: method(postpad),
    slugify: method(slugify),

    equals:  method(equals),
    get:     method(getPath),
    rest:    method(rest),
    take:    method(take),

    add:     method(add),

    floor: method(Math.floor),

    px:  method(px),
    em:  method(em),
    rem: method(rem),

    toString: function() {
        return '' + this.value;
    },

    valueOf: function() {
        return this.value;
    }
});
