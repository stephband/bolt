
/**
request(url)
Node `fs.readFile` but wrapped in a promise.
**/

import fs       from 'fs';
import cache    from '../../../fn/modules/cache.js';
import { dimbluedim, dimcyandim } from './log.js';

const DEBUG = false;

export default cache(function request(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, { encoding: 'utf8' }, (err, text) => {
            if (err) {
                //console.log(red + ' ' + yellow, 'Not found', path);
                return reject(err);
            }

            if (DEBUG) {
                const filesize = Math.round(Buffer.byteLength(text, 'utf8') / 1000);
                console.log(dimbluedim, 'Literal', 'read', path + ' (' + filesize + 'kB)');
            }

            return resolve(text) ;
        });
    });
});
