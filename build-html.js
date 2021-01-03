
/*
Find html template files and build them.
*/

// Import
import finder    from 'findit';
import pather    from 'path';
import processes from 'child_process';

// Current directory
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const dir = dirname(fileURLToPath(import.meta.url));

import request from './builder/request.js';
import { yellow } from './builder/log.js';

// Arguments
const args  = process.argv.slice(2);
const base  = args[0] || '.';
const dest  = args[1] || '';
const DEBUG = args.find((arg) => (arg === 'debug'));

request('./package.json')
.then(JSON.parse)
.then((pkg) => {
    const ignores = pkg.builderExcludes;

    finder(base)
    .on('directory', function (dir, stat, stop) {
        var base = pather.basename(dir);
    
        // Remove trailing '/' or '/*' from ignore
        if (ignores.find((ignore) => dir.startsWith(ignore.replace(/\/\*?$/, '')))) {
            console.log(yellow, 'Ignoring', dir + '/');
            stop();
            return;
        }
    })
    .on('file', function (source, stat) {
        // Ignore files that do not match *.html.bolt or *.css.bolt
        const parts  = /(.*\/)?([^\s\/]+)\.(html|css)\.bolt$/.exec(source);
        if (!parts) { return; }

        const path = parts[1];
        const name = parts[2];
        const ext  = parts[3];
        // Replace path with destination
        //const target = (path ? dest ? dest : path : '') + name + '.html';
        // No, build in place... Todo: allow alternative target destination
        const target = (path || '') + name + '.' + ext;

        // Build source template to target path
        processes
        // build [source.html, target.html]
        .fork(dir + '/build-template.js', [source, target, DEBUG && 'debug'])
        .on('error', console.log)
        .on('exit', function(code, error) {
            if (code !== 0) {
                console.error(0, error);
            }
        });
    });
});

