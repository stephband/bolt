
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

import events       from '../../dom/modules/events.js';
import matches      from '../../dom/modules/matches.js';
import { matchers, deactivate } from '../events/dom-activate.js';

var match = matches('[data-popable]');

function activate(e) {
    const element = e.target;
    if (!match(element)) { return; }
console.log('WOO');
    // Make user actions outside node deactivate the node
    requestAnimationFrame(() => {
        const clicks = events('mousedown', document)
            .filter((e) => !element.contains(e.target) && element !== e.target)
            .each((e) => deactivate(element));

        const deactivates = events('dom-deactivate', element)
            .filter((e) => e.target === e.currentTarget)
            .each((e) => {
                clicks.stop();
                deactivates.stop();
            });
    });
}

events('dom-activate', document).each(activate);
matchers.push(match);
