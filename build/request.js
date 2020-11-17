
/**
request(url)
Node `fs.readFile` but wrapped in a promise.
**/

import fs    from 'fs';
import cache from '../../fn/modules/cache.js';

// Log colours
const cyan = "\x1b[36m%s\x1b[0m";

export default cache(function request(path) {
    console.log(cyan, 'Reading', path);
    return new Promise(function(resolve, reject) {
        fs.readFile(path, { encoding: 'utf8' }, (err, template) => {
            return err ?
                reject(err) :
                resolve(template) ;
        });
    });
});
