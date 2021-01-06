
import fs      from 'fs';
import path    from 'path';

import request from './modules/request.js';
import Literal from './modules/literal.js';
import { dimyellow, red, yellow, dim } from './modules/log.js';

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("build-literal requires ('source.html.literal', 'target.html')");
}

// Lop off any leading './' on file names
const source = args[0].replace(/^\.\//, '');
const target = args[1].replace(/^\.\//, '');
const DEBUG  = args.find((arg) => (arg === 'debug'));

/**
buildLiteral(source, target)
**/

export default function buildLiteral(source, target, data) {
    const params = Object.keys(data).join(',');
    const values = Object.values(data);
    return request(source)
    .then((template) => Literal(params, template, source, target))
    .then((render) => render(...values))
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


/**
render-template.js

```
> node render-template.js source.html target.html
```
**/

const hints = {
    'Unexpected identifier':
        '• Non-template backticks must be escaped: \\`\n' +
        '• ${} accepts any valid JS expression\n'
};

buildLiteral(source, target, { DEBUG: DEBUG })
.then(() => { process.exit(0); })
.catch((e) => {
    console.log('');
    if (e.code) { console.log(dim, e.code.slice(0, 1000) + '\n\n...\n'); }
    console.log(red, e.constructor.name + ':', e.message, 'parsing', source);
    if (hints[e.message]) { console.log(yellow, '\nHints\n' + hints[e.message]); }
    console.log('');
    console.log(e.stack);
    console.log('');
    process.exit(1);
});
