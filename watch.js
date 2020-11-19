
/*
Not a perfect watcher script. But, and does the job.
*/

import fs from 'fs';
import processes from 'child_process';

let n = 0;
let promise;

function fork(file, args) {
    processes
    .fork(file, args)
    .on('error', console.log)
    .on('exit', function(code, error) {
        if (code !== 0) {
            console.error(0, error);
        }
    });
}

function run(filename) {
    promise = undefined;

    if (/\.html\.template$/.test(filename)) {
        console.log(Math.floor(Date.now()/1000), 'changed', filename);
        // Build source template to target html [source.html, target.html]
        fork('./render-template.js', [filename, filename.replace(/\.template$/, '')]);
    }
}

fs.watch('./', { recursive: true, encoding: 'utf8' }, (type, filename) => {
    // On macOS I'm getting two 'rename' events on each file change.
    // Let's ignore type, and debounce any effects.
    if (promise) { return; }

    promise = new Promise((resolve, reject) => {
        // 1/8th second
        setTimeout(resolve, 166, filename);
    })
    .then(run);
});
