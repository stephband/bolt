/**
data-toggleable

An element with the `data-toggleable` attribute is activated and deactivated 
whenever a link to it is click-hijacked. An active toggleable has the class 
`"active"`, and links to it have the class `"on"`.

It is also activated when the page loads with its fragment identifier in the URL.

With a little hide/show style, a toggleable can be used to make menus, drawers,
accordions and so on.

```html
<a class="toggle-button button" href="#toggle-block">Show toggle-block</a>
<section class="toggle-block block" data-toggleable id="toggle-block">
    Crunchum ipsum dolor sit coder void, constructor function, sed do while 
    loop python orientation semi colon incident. Duis aute irure indent tabs 
    or spaces velit esse cilium buntum how crunchy duntum.
</section>
```
**/

import { remove }   from '../../fn/modules/remove.js';
import get          from '../../dom/modules/get.js';
import closest      from '../../dom/modules/closest.js';
import matches      from '../../dom/modules/matches.js';
import identify     from '../../dom/modules/identify.js';
import { trigger }  from '../../dom/modules/trigger.js';
import { isInternalLink } from '../../dom/modules/node.js';
import { isPrimaryButton, on } from '../../dom/modules/events.js';
import { matchers } from '../events/dom-activate.js';


// Define

var match = matches('.toggleable, [toggleable], [data-toggleable]');

// Functions

var actives = [];

function getHash(node) {
	return (node.hash ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function click(e) {
	// A prevented default means this link has already been handled.
	if (e.defaultPrevented) { return; }
	if (!isPrimaryButton(e)) { return; }

	var node = closest('a[href]', e.target);
	if (!node) { return; }
	if (node.hostname && !isInternalLink(node)) { return; }

	// Does it point to an id?
	var id = getHash(node);
	if (!id) { return; }
	if (actives.indexOf(id) === -1) { return; }

	trigger({
        type: 'dom-deactivate',
		relatedTarget: node
	}, get(id));

	e.preventDefault();
}

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	actives.push(identify(target));
	e.default();
}

function deactivate(e, data, fn) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	remove(actives, target.id);
	e.default();
}

on('click', click, document.documentElement);
on('dom-activate', activate, document);
on('dom-deactivate', deactivate, document);

matchers.push(match);
