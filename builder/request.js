
/**
request(url)
Node `fs.readFile` but wrapped in a promise.
**/

import fs       from 'fs';
import cache    from '../../fn/modules/cache.js';
import { dim, red } from './log.js';


export default cache(function request(path) {
    if (path === 'type') throw new Error('PATH')
    return new Promise(function(resolve, reject) {
        fs.readFile(path, { encoding: 'utf8' }, (err, template) => {
            if (err) {
                console.log(red, 'Missing', path);
                return reject(err);
            }

            console.log(dim, 'Reading', path);
            return resolve(template) ;
        });
    });
});
