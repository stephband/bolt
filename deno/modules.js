
import * as es from 'https://deno.land/x/esbuild@v0.11.10/mod.js'
//import es         from 'esbuild';
//import madge      from 'madge';

// Arguments
const args      = Deno.args;
const builddir  = args[0] || '';
const modules   = args.slice(1) || '';

// Directories
const workingdir = Deno.cwd() + '/';
const moduledir  = new URL('.', import.meta.url).pathname;

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

Deno
.readTextFile(workingdir + 'package.json')
.then(JSON.parse)

// Build modules
.then((pkg) => es.build({
    // A string to prepend to modules and chunks
    banner: {
        js: '// ' + pkg.title + ' ' + pkg.version + ' (Built ' + getDateTime() + ')\n\n' + '',
        css: '// ' + pkg.title + ' ' + pkg.version + ' (Built ' + getDateTime() + ')\n\n' + ''
    },

    // Disable ASCII character escaping
    charset:   'utf8',

    // Modules become entry points
    entryPoints: modules,

    // and are built into static/build-xxx along with shared chunks
    outdir:    builddir,

    // Specify which environments to support
    //target:    ['es2016'],

    minify:    true,
    splitting: true,
    bundle:    true,
    format:    'esm',
    logLevel:  'info'
}))

// Explicitly stop esbuild
.then((d) => {
    es.stop();
})

// Error
.catch((e) => {
    console.error(e);
    Deno.exit(1)
});
