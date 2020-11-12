
/*
Syntax highlighting
https://prismjs.com/

Runs automatically on <code class="language-xxx"> elements. Also called 
programmatically inside the following build process.
*/
import './libs/prism/prism.js';

// Give Sparky some parse and render functions
import './build-functions.js';
import '../fn/docs.js';

// Run Sparky on the document
import Sparky from '../sparky/module.js';

import { invoke, nothing } from '../fn/module.js';
import { select } from '../dom/module.js';

// Remove nodes with a remove attribute. Remove fn attributes
setTimeout(function() {
    console.log('Build: removing ' + select('[remove]', document).length + ' elements');
    select('[remove]', document).forEach(invoke('remove', nothing));
    console.log('Build: removing ' + select('[fn]', document).length + ' fn attributes');
    select('[fn]', document).forEach(invoke('removeAttribute', ['fn']));
    window.console.log('Document built! (this is just a cheap timeout, it may not be true)');
}, 2000);
