
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
const dest = args[1] || '';

const ignore = {
    // Prevent finder entering these directories
    '.git':         true,
    'node_modules': true,
    'archive':      true,
    'fonts':        true,
    'libs':         true,
    'docs':         true,
    'build':        true
};

var port = 10000;
console.log(base, '-', dest);
finder(base)
.on('directory', function (dir, stat, stop) {
    var base = pather.basename(dir);

    if (ignore[base]) {
        stop();
        return;
    }
})
.on('file', function (source, stat) {
    // Ignore files that do not match ...template.html
    const parts  = /(.*\/)?([^\s\/]+)\.template\.html$/.exec(source);
    if (!parts) {
        return;
    }

    const path   = parts[1];
    const name   = parts[2];
    // Replace path with destination
    const target = (path ? dest ? dest : path : '') + name + '.html';

    // Build source template to target path
    processes
    // build-fn [source.html, target.html, timeout (seconds), port]
    .fork('../fn/build-html.js', [source, target, 3, port++])
    .on('error', console.log)
    .on('exit', function(code, error) {
        if (code !== 0) {
            console.error(0, error);
        }
    });
});
