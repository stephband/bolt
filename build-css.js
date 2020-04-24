
/*
Build CSS from the array of files in package.json.style.

node build-css.js path/to/output.css
*/

const args      = process.argv.slice(2);
const files     = require('./package.json').style;
const CleanCSS  = require('clean-css');
const fs        = require('fs');
const fileName  = args[0] || 'min.css';

function logError(error) {
    if (error) { throw error; }
}

// Minify the files
const output = new CleanCSS({}).minify(files);

fs.writeFile(fileName, output.styles, logError);

console.log('CSS package.json style ('
    + (output.stats.originalSize / 1000).toFixed(1) + 'kB) minified to '
    + fileName + ' (' + (output.stats.minifiedSize / 1000).toFixed(1) + 'kB) in '
    + output.stats.timeSpent + 'ms'
);
