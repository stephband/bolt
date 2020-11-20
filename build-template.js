
/**
render-template.js

```
> node render-template.js source.html target.html
```
**/

import fs from 'fs';

import renderTemplate from './builder/render-template.js';

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("render-template requires arguments: source.html target.html");
}

// Lop off any leading './' on file names
const source = args[0].replace(/^\.\//, '');
const target = args[1].replace(/^\.\//, '');

renderTemplate(source, target).then(() => process.exit(0)); 
