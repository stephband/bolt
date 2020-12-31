
import fs from 'fs';
import path     from 'path';

import request       from './request.js';
import parseTemplate from './parse-template.js';
import renderTree    from './render-tree.js';
import { green }     from './log.js';


const assign = Object.assign;


/**
renderTemplate(source, target)
**/

export default function renderTemplate(source, target, options) {
    return request(source)
    .then(parseTemplate)
    //.then((tree) => (console.log('ROOT\n' + source + '\n', tree[0]), tree))
    // Create a context from options (Currently only option is DEBUG)
    .then((tree) => renderTree(tree, assign({}, options), source, target))
    .then((html) => new Promise(function(resolve, reject) {
        const root = path.parse(target);
        const dir  = root.dir;

        // If dir not '' create a directory tree where one does not exist
        if (dir) {
            fs.promises.mkdir(dir, { recursive: true });
        }

        // Write HTML to target file
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
