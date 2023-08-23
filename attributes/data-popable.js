
/**
data-popable

```html
<div data-popable class="right-top-bubble top-bubble bubble" id="bolt-popable">Hello.</div>
<a class="button" href="#bolt-popable">Show bubble</a>
<button class="button" name="activate" value="#bolt-popable">Show bubble</button>
```

An element with a `data-popable` attribute is given the class `"active"` when a
link that references it is click-hijacked, and then deactivated by user interaction
outside of itself. While it is active, all links to it have the class `"on"`.

It is also activated when the page loads with its fragment identifier in the URL.

With a little hide/show style, a popable can be used to make menus, tooltips,
bubbles, accordions and so on.
*/

import events          from '../../dom/modules/events.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import { behaviours, deactivate } from '../events/dom-activate.js';

behaviours['[data-popable]'] = function activate(e) {
    const element = e.target;

    // Make user actions outside element deactivate it
    const mousedowns = events('mousedown', document)
        .filter(isPrimaryButton)
        .filter((e) => !element.contains(e.target) && element !== e.target)
        .each((e) => {
            deactivate(element);

            // If we just mousedowned on a button that points to this popable
            const button = e.target.closest(`[href$="#${ element.id }"], [name="activate"][value="#${ element.id }"], [name="activate-deactivate"][value="#${ element.id }"]`);

            if (button) {
                // We do not want the following click to reactivate popable
                const clicks = events('click', document.body)
                .each((e) => {
                    clicks.stop();
                    e.preventDefault();
                });
            }
        });

    const deactivates = events('dom-deactivate', element)
        .filter((e) => e.target === e.currentTarget)
        .each((e) => {
            mousedowns.stop();
            deactivates.stop();
        });
}
