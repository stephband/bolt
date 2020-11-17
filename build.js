
/**
build.js

```
> node build.js source.html target.html
```
**/

import fs from 'fs';

import request       from './build/request.js';
import parseTemplate from './build/parse-template.js';
import renderTree    from './build/render.js';

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("build.js requires arguments: source.html target.html");
}

// Log colours
const cyan = "\x1b[36m%s\x1b[0m";

// Lop off any leading './' on source name
const source = args[0].replace(/^\.\//, '');
const target = args[1];

request(source)
.then(parseTemplate)
.then((tree) =>
    renderTree(tree, null)
    .then((html) => {    
        return new Promise(function(resolve, reject) {
            fs.writeFile(target, html, function(err) {
                if (err) { throw err; }
                resolve(html);
            });
        });
    })
    .then((html) => {
        // Write HTML to target file and exit process
        const filesize = Math.round(Buffer.byteLength(html, 'utf8') / 1000);
        console.log(cyan, 'Written', target + ' (' + filesize + 'kB)');
        process.exit(0);
    })
);
