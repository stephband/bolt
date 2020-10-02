
/*
Find html template files and build them.
*/

// Import
const finder    = require('findit');
const pather    = require('path');
const processes = require('child_process');

// Log colours
const cyan = "\x1b[36m%s\x1b[0m";

// Arguments
const args = process.argv.slice(2);
const base = args[0] || '.';

var port = 10000;

finder(base)
.on('directory', function (dir, stat, stop) {
    // Prevent finder entering  directories
    var base = pather.basename(dir);
    if (base === '.git' || base === 'node_modules' || base === 'archive' || base === 'fonts' || base === 'libs') {
        stop();
    }
})
.on('file', function (source, stat) {
    // Ignore files that do not match ...template.html
    if (!/\.template\.html$/.test(source)) {
        return;
    }

    const target = source.replace(/\.template\.html$/, '.html');

    // Build source template to target path
    processes
    // build-fn [source.html, target.html, timeout (seconds), port]
    .fork('../fn/build-html.js', [source, target, 1, port++])
    .on('error', console.log)
    .on('exit', function(code, error) {
        if (code !== 0) {
            console.error(0, error);
        }
    });
});
