
import fs        from 'fs';
import path      from 'path';

import request   from './modules/request.js';
import Literal   from './modules/literal.js';
import { green } from './modules/log.js';

/**
renderTemplate(source, target)
**/

export default function renderTemplate(source, target, context) {
    return request(source)
    .then((template) => Literal({}, template, source, target))
    .then((render) => render(context))
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
        console.log(green, 'Written', target + ' (' + filesize + 'kB)');
        return text;
    });
}
