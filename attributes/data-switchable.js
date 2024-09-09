/**
data-switchable

A `data-switchable` is given the class `"active"` when a link to it is click-hijacked,
and all links to it are given the class `"on"`. In any group of siblings with
the `data-switchable` attribute, exactly one is always active.

A switchable is also activated if the page loads with its fragment identifier in
the URL.

Switchables can be used to make tabs, slideshows, accordions and so on. Here
are three `data-switchable` sections with tab style, applied via `.tab-button`
and `.tab-block` classes.

```html
<div class="grid" style="row-gap: 1rem;">
    <nav class="x1 y1">
        <a class="tab-button button on" href="#tab-1">Tab 1</a>
        <a class="tab-button button" href="#tab-2">Tab 2</a>
        <a class="tab-button button" href="#tab-3">Tab 3</a>
    </nav>
    <section class="x1 y2 tab-block block active" data-switchable id="tab-1">
        Crunchum ipsum dolor sit coder void, constructor function, sed do while loop python orientation semi colon incident.
    </section>
    <section class="x1 y2 tab-block block" data-switchable id="tab-2">
        Duis aute irure indent tabs or spaces velit esse cilium buntum how crunchy duntum. Excepteur tranquilis syntax error memorandum qui officia nostrud operating system alertus.
    </section>
    <section class="x1 y2 tab-block block" data-switchable id="tab-3">
        Hyper text linkus operari avec computatrum ad coniungere hominum. Standards code est pulchra on chromium et foxus sed souvent suckum in internet explorum.
    </section>
</div>
```
**/

import matches  from 'dom/matches.js';
import children from 'dom/children.js';
import { behaviours, deactivate } from '../events/dom-activate.js';


// Define

function match(element) {
    return element.matches('[data-switchable]');
}

function activate(e) {
	var target = e.target;
	var nodes = children(target.parentNode).filter(match);
	var i = nodes.indexOf(target);

	nodes.splice(i, 1);

    nodes
    .filter(matches('.active'))
    .forEach((active) => deactivate(active, target));
}

behaviours['[data-switchable]'] = activate;
