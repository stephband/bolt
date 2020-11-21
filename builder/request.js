
/**
request(url)
Node `fs.readFile` but wrapped in a promise.
**/

import fs       from 'fs';
import cache    from '../../fn/modules/cache.js';
import { dim, red, yellow } from './log.js';

export default cache(function request(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, { encoding: 'utf8' }, (err, template) => {
            if (err) {
                //console.log(red + ' ' + yellow, 'Not found', path);
                return reject(err);
            }

            console.log(dim, 'Reading', path);
            return resolve(template) ;
        });
    });
});
