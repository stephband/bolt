
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

import request    from './literal/modules/request.js';
import { yellow } from './literal/modules/log.js';

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
            //console.log(yellow, 'Ignoring', dir + '/');
            stop();
            return;
        }
    })
    .on('file', function (source, stat) {
        // Ignore files that do not match *.xxx.literal
        const parts  = /(.*\/)?([^\s\/]+)\.([\w\d-]+)\.literal$/.exec(source);
        if (!parts) { return; }

        const path = parts[1];
        const name = parts[2];
        const ext  = parts[3];

        // No, build in place... Todo: allow alternative target destination
        const target = (path || '') + name + '.' + ext;

        // Build source template to target path
        processes
        // build [source.html, target.html]
        .fork(dir + '/literal/index.js', [source, target, DEBUG && 'debug'])
        .on('error', console.log)
        .on('exit', function(code, error) {
            if (code !== 0) {
                console.error(0, error);
            }
        });
    });
});

