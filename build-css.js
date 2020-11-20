
/*
Build CSS from the array of files in JSON style array.

> node build-css.js source.json target.css
*/

import CleanCSS from 'clean-css';
import fs from 'fs';

import { green } from './builder/log.js';

// Arguments
const args     = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("build-css requires the arguments: source.json target.css");
}

const source    = args[0].replace(/^\.\//, '');
const target    = args[1] || 'module.css';

function logError(error) {
    if (error) { throw error; }
}

// Minify the files
const minified = new CleanCSS({
    inline: ['all']
}).minify([source]);

fs.writeFile(target.replace(/\.css$/, '.min.css'), minified.styles, logError);

const beautified = new CleanCSS({
    inline: ['all'],
    format: 'beautify'
}).minify([source]);

fs.writeFile(target, beautified.styles, logError);

console.log(green, 'CSS ' + source + ' ('
    + (minified.stats.originalSize / 1000).toFixed(1) + 'kB) packaged to',
    '\n' + target + ' (' + (beautified.stats.minifiedSize / 1000).toFixed(1) + 'kB)\n'
    + target.replace(/\.css$/, '.min.css') + ' (' + (minified.stats.minifiedSize / 1000).toFixed(1) + 'kB)\n'
);
