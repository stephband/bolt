
/*
Syntax highlighting
https://prismjs.com/

Runs automatically on <code class="language-xxx"> elements. Also called 
programmatically inside the following build process.
*/
//import './libs/prism/prism.js';

// Give Sparky some parse and render functions
//import './build-functions.js';
//import '../fn/docs.js';

// Run Sparky on the document
//import Sparky from '../sparky/module.js';

import fs from 'fs';

import get from '../fn/modules/get.js';
import nothing from '../fn/modules/nothing.js';
import overload from '../fn/modules/overload.js';
import select from '../dom/modules/select.js';
import parseTemplate from './build/parse-template.js';

// Log colours
const cyan = "\x1b[36m%s\x1b[0m";

// Arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    throw new Error("build-html requires the arguments: source.html target.html [time]");
}

// Lop off any leading './' on source name
const source = args[0].replace(/^\.\//, '');
const target = args[1];
const time   = args[2] || 4;
const port   = args[3] || 8080;

const replace = overload(get('type'), {
    'tag': overload(get('fn'), {
        'docs': function docs(token, data) {
            return new Promise(function(resolve, reject) {
                

                fs.readFile(token.template.replace(/#.*$/, ''), { encoding: 'utf8' }, (err, template) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(renderTemplate(data, template));
                });
            });
        }
    }),

    'property': function(token, data) {
        return Promise.resolve(data[token.selector]);
    }
});


function renderTemplate(data, template) {
    const tree = parseTemplate(template);
    console.log(cyan, 'Parsed ', source);

    let i = 0;

    return Promise
    .all(tree.reduce(function(promises, token) {
        // Add in plain html
        promises.push(
            Promise.resolve(template.slice(i, i + token.begin))
        );
    
        // Don't add comments
        if (token.type !== 'comment') {
            promises.push(replace(token, data));
        }
    
        i += token.end;
        return promises;
    }, []))
    .then((partials) => partials.join('') + template.slice(i));
}

fs.readFile(source, { encoding: 'utf8' }, (err, template) => {
    if (err) { throw err; }
    renderTemplate(null, template)
    .then((html) => {
        // Write HTML to target file and exit process
        const filesize = Math.round(Buffer.byteLength(html, 'utf8') / 1000);

        return new Promise(function(resolve, reject) {
            fs.writeFile(target, html, function(err) {
                if (err) { throw err; }
                console.log(cyan, 'Written', target + ' (' + filesize + 'kB)');
                resolve(html);
            });
        });
    })
    .then(() => process.exit(0));
});
