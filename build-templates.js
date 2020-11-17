
/*
Find html template files and build them.
*/

// Import
import finder    from 'findit';
import pather    from 'path';
import processes from 'child_process';

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
    'build':        true,
    'templates':    true
};

finder(base)
.on('directory', function (dir, stat, stop) {
    var base = pather.basename(dir);

    if (ignore[base]) {
        stop();
        return;
    }
})
.on('file', function (source, stat) {
    // Ignore files that do not match *.html.template
    const parts  = /(.*\/)?([^\s\/]+)\.html\.template$/.exec(source);
    if (!parts) {
        return;
    }

    const path   = parts[1];
    const name   = parts[2];
    // Replace path with destination
    const target = (path ? dest ? dest : path : '') + name + '.html';

    // Build source template to target path
    processes
    // build [source.html, target.html, timeout (seconds), port]
    .fork('./build.js', [source, target])
    .on('error', console.log)
    .on('exit', function(code, error) {
        if (code !== 0) {
            console.error(0, error);
        }
    });
});
