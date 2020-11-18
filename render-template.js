
/**
render-template.js

```
> node render-template.js source.html target.html
```
**/

import fs from 'fs';

import request       from './build/request.js';
import parseTemplate from './build/parse-template.js';
import renderTree    from './build/render.js';

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("render-template missing arguments source.html, target.html");
}

// Log colours
const cyan = "\x1b[36m%s\x1b[0m";

// Lop off any leading './' on source name
const source = args[0].replace(/^\.\//, '');
const path   = source.split('/');
const target = args[1];

console.log(source);

request(source)
.then(parseTemplate)
.then((tree) => renderTree(tree, null))
.then((html) => new Promise(function(resolve, reject) {
    // Write HTML to target file
    fs.writeFile(target, html, function(error) {
        return error ? reject(error) : resolve(html) ;
    });
}))
.then((html) => {
    // Exit process
    const filesize = Math.round(Buffer.byteLength(html, 'utf8') / 1000);
    console.log(cyan, 'Written', target + ' (' + filesize + 'kB)');
    process.exit(0);
});
