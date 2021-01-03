
import fs from 'fs';
import path     from 'path';

import request    from './request.js';
import Template   from './template.js';
//import renderTree from './render-tree.js';
import { green }  from './log.js';


const assign = Object.assign;


/**
renderTemplate(source, target)
**/

function renderSource(render, context, target, level = 0) {
    console.log('TARGET for rewrting URLs?', target);
    return render(context);
}

export default function renderTemplate(source, target, context) {
    return request(source)
    .then((template) => Template({}, template))
    .then((render) => render(context))
    .then((html) => new Promise(function(resolve, reject) {
        const root = path.parse(target);
        const dir  = root.dir;

        // If dir not '' create a directory tree where one does not exist
        if (dir) {
            fs.promises.mkdir(dir, { recursive: true });
        }

        // Write to target file
        fs.writeFile(target, html, function(error) {
            return error ? reject(error) : resolve(html) ;
        });
    }))
    .then((html) => {
        const filesize = Math.round(Buffer.byteLength(html, 'utf8') / 1000);
        console.log(green, 'Written', target + ' (' + filesize + 'kB)');
        return html;
    });
}
