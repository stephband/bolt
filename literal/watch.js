
/*
Not a perfect watcher script. But, and does the job.
*/

import fs from 'fs';
import processes from 'child_process';

// Current directory
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const dir = dirname(fileURLToPath(import.meta.url));

import build from './build.js';

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

    // If a template has changed rebuild it
    if (/\.literal$/.test(filename)) {
        console.log(Math.floor(Date.now()/1000), 'changed', filename);
        // Build source template to target html [source.html, target.html]
        build(filename, filename.replace(/\.html\.\w+$/, '.html'), { DEBUG: DEBUG })
        .catch((e) => {
            console.log(e);
            //process.exit(1);
        });
    }

    // If CSS has changed we must rebuild everything
    /*if (/\.css$/.test(filename)) {
        console.log(Math.floor(Date.now()/1000), 'changed', filename);
        // Build source templates
        fork(dir + '/build-html.js');
    }*/
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
