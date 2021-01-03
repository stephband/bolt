

import get                 from '../../fn/modules/get.js';
import overload            from '../../fn/modules/overload.js';
import toType              from '../../fn/modules/to-type.js';

import { addDate }         from '../../fn/modules/date.js';
import { addTime }         from '../../fn/modules/time.js';

export { default as get }  from '../../fn/modules/get-path.js';
export { default as id }   from '../../fn/modules/id.js';
export { default as pipe } from '../../fn/modules/pipe.js';
export { default as px, em, rem }     from './parse-length.js';

import Value from './value.js';
export const Pipe = (value) => new Value(value);

export const fetch = overload((url) => /\.([\w\d]+)$/.exec(url)[1], {
    'js':   (url, name) => import(url).then(get(name)),
    'json': (url) => import(url).then(get('default'))
});

export const add = overload(toType, {
    'number': (a) => (b) => (
        typeof b === 'number' ? b + a :
            b && b.add ? b.add(a) :
            undefined
    ),

    'date': addDate,
    'time': addTime,

    'default': function(n) {
        throw new Error('Bolt add(value) does not accept values of type ' + typeof n);
    }
});
