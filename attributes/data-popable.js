
/**
data-popable

```html
<div data-popable class="right-top-bubble top-bubble bubble" id="bolt-popable">Hello.</div>
<a class="button" href="#bolt-popable">Show bubble</a>
```

An element with a `data-popable` attribute is given the class `"active"` when a 
link that references it is click-hijacked, and then deactivated by user interaction 
outside of itself. While it is active, all links to it have the class `"on"`.

It is also activated when the page loads with its fragment identifier in the URL.

With a little hide/show style, a popable can be used to make menus, tooltips,
bubbles, accordions and so on.
*/

import matches from '../../dom/modules/matches.js';
import { trigger } from '../../dom/modules/trigger.js';
import { matchers } from '../events/dom-activate.js';

var match   = matches('[data-popable], [popable]');

function activate(e) {
    // Use method detection - e.defaultPrevented is not set in time for
    // subsequent listeners on the same node
    if (!e.default) { return; }

    const node = e.target;
    if (!match(node)) { return; }

    // Make user actions outside node deactivate the node
    requestAnimationFrame(function() {
        var timeStamp = 0;

        function click(e) {
            // Ignore clicks that follow clicks with the same timeStamp – this
            // is true of clicks simulated by browsers on inputs when a label
            // with a corresponding for="id" is clicked.
            if (e.timeStamp === timeStamp) { return; }
            timeStamp = e.timeStamp;

            if (node.contains(e.target) || node === e.target) { return; }
            trigger('dom-deactivate', node);
        }

        function deactivate(e) {
            if (node !== e.target) { return; }
            if (e.defaultPrevented) { return; }
            document.removeEventListener('click', click);
            document.documentElement.removeEventListener('dom-deactivate', deactivate);
        }

        document.addEventListener('click', click);
        document.documentElement.addEventListener('dom-deactivate', deactivate);
    });

    e.default();
}

function deactivate(e) {
    if (!e.default) { return; }

    var target = e.target;
    if (!match(target)) { return; }
    e.default();
}

document.addEventListener('dom-activate', activate);
document.addEventListener('dom-deactivate', deactivate);
matchers.push(match);