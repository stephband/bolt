/**
data-toggleable

An element with the `data-toggleable` attribute is activated and deactivated
whenever a link to it is click-hijacked. An active toggleable has the class
`"active"`, and links to it have the class `"on"`.

It is also activated when the page loads with its fragment identifier in the URL.

With a little hide/show style, a toggleable can be used to make menus, drawers,
accordions and so on.

```html
<a class="folder-button button" href="#folder-block">Show folder-block</a>
<section class="folder-block block" data-toggleable id="folder-block">
    Crunchum ipsum dolor sit coder void, constructor function, sed do while
    loop python orientation semi colon incident. Duis aute irure indent tabs
    or spaces velit esse cilium buntum how crunchy duntum.
</section>
```
**/

import { remove }      from 'fn/remove.js';
import get             from '../../dom/modules/get.js';
import closest         from '../../dom/modules/closest.js';
import identify        from '../../dom/modules/identify.js';
import events          from '../../dom/modules/events.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import { isInternalLink } from '../../dom/modules/node.js';
import { behaviours, deactivate } from '../events/dom-activate.js';



// Functions

var actives = [];

function getHash(node) {
	return (node.hash ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

events('click', document.documentElement).each((e) => {
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

	deactivate(get(id), node);
	e.preventDefault();
});

behaviours['[data-toggleable]'] = (e) => actives.push(identify(e.target));


import matches         from '../../dom/modules/matches.js';
var match = matches('[data-toggleable]');
events('dom-deactivate', document).each((e) => {
	var target = e.target;
	if (!match(target)) { return; }
	remove(actives, target.id);
});
