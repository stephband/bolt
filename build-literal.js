
/**
render-template.js

```
> node render-template.js source.html target.html
```
**/

import fs from 'fs';

import renderTemplate from './literal/index.js';
import { red, yellow, dim } from './literal/modules/log.js';

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("render-template requires arguments: source.html target.html");
}

// Lop off any leading './' on file names
const source = args[0].replace(/^\.\//, '');
const target = args[1].replace(/^\.\//, '');
const DEBUG  = args.find((arg) => (arg === 'debug'));

const hints = {
    'Unexpected identifier':
        '• Non-template backticks must be escaped: \\`\n' +
        '• ${} accepts any valid JS expression\n'
};

renderTemplate(source, target, { DEBUG: DEBUG, boo: 5 })
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
