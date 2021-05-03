
import finder     from 'findit';
import es         from 'esbuild';
import madge      from 'madge';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Arguments
const args      = process.argv.slice(2);
const builddir  = args[0] || '';
const modules   = args.slice(1) || '';

// Directories
const root      = './';
const working   = process.cwd();
const current   = dirname(fileURLToPath(import.meta.url));

// Console colours
const dim       = "\x1b[2m%s\x1b[0m";
const white     = "\x1b[37m%s\x1b[0m";
const red       = "\x1b[31m%s\x1b[0m";
const green     = "\x1b[32m%s\x1b[0m";
const yellow    = "\x1b[33m%s\x1b[0m";


function getDateTime() {
    return (new Date())
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');
}

console.log('===== ', working + '/package.json', ' =====');
console.log('DESTINATION', builddir);
console.log('MODULES', modules);

import(working + '/package.json')

// Build modules
.then((pkg) => es.build({
    // A string to prepend to modules and chunks
    banner: '// ' + pkg.title + ' ' + pkg.version + ' (Build ' + stamp + ', ' + getDateTime() + ')\n\n'
        + '',

    // Disable ASCII character escaping
    charset:   'utf8',

    // Modules become entry points
    entryPoints: modules,

    // and are built into static/build-xxx along with shared chunks
    outdir:    builddir,

    minify:    true,
    splitting: true,
    bundle:    true,
    format:    'esm',
    logLevel:  'info'
}))

// Draw dependency graph to SVG
.then(() => madge(builddir, {
        fontSize: '12px'
    })
    .then((graph) => graph.image(builddir + '/module.svg'))
)

// Error
.catch(() => process.exit(1));
