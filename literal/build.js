
import fs      from 'fs';
import path    from 'path';

import request from './modules/request.js';
import Literal from './modules/literal.js';
import { dimyellow } from './modules/log.js';

/**
build(source, target, data)
**/

export default function build(source, target, data) {
    const params = Object.keys(data).join(',');

    return request(source)
    .then((template) => Literal(params, template, source))
    .then((render) => render(data, target))
    .then((text) => new Promise(function(resolve, reject) {
        const root = path.parse(target);
        const dir  = root.dir;

        // If dir not '' create a directory tree where one does not exist
        if (dir) {
            fs.promises.mkdir(dir, { recursive: true });
        }

        // Write to target file
        fs.writeFile(target, text, function(error) {
            return error ? reject(error) : resolve(text) ;
        });
    }))
    .then((text) => {
        const filesize = Math.round(Buffer.byteLength(text, 'utf8') / 1000);
        console.log(dimyellow, 'Literal', 'write', target + ' (' + filesize + 'kB)');
        return text;
    });
}
