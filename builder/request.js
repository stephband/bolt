
/**
request(url)
Node `fs.readFile` but wrapped in a promise.
**/

import fs       from 'fs';
import cache    from '../../fn/modules/cache.js';
import { dim } from './log.js';


export default cache(function request(path) {
    if (path === 'type') throw new Error('PATH')
    console.log(dim, 'Reading', path);
    return new Promise(function(resolve, reject) {
        fs.readFile(path, { encoding: 'utf8' }, (err, template) => {
            return err ?
                reject(err) :
                resolve(template) ;
        });
    });
});
