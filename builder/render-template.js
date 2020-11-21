
import fs from 'fs';

import request       from './request.js';
import parseTemplate from './parse-template.js';
import renderTree    from './render-tree.js';
import { green }     from './log.js';


/**
renderTemplate(source, target)
**/

export default function renderTemplate(source, target) {
    return request(source)
    .then(parseTemplate)
    .then((tree) => renderTree(tree, null, source, target))
    .then((html) => new Promise(function(resolve, reject) {
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
