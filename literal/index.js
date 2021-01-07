
/*
Find .xxx.literal template files and build them to .xxx files.
*/

// Import
import fs        from 'fs';
import path      from 'path';
import finder    from 'findit';
import pather    from 'path';
import Literal from './modules/literal.js';

// Current directory
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const dir = dirname(fileURLToPath(import.meta.url));

import request    from './modules/request.js';
import { yellow, dimyellow, red, dim } from './modules/log.js';

import build from './build.js';

// Arguments
const args  = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("build-literal requires ('source.html.literal', 'target.html')");
}

const base  = args[0] || '.';
const dest  = args[1] || '';
const DEBUG = args.find((arg) => (arg === 'debug'));

request('./package.json')
.then(JSON.parse)
.then((pkg) => {
    const ignores = pkg.literal && pkg.literal.exclude;

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

        build(source, target, { DEBUG: DEBUG })
        //.then(() => { process.exit(0); })
        .catch((e) => {
            console.log(e);
            //process.exit(1);
        });
    });
});
