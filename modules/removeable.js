/*
`removeable`

<p>A <strong>removeable</strong> is removed from the DOM after
<code>dom-deactivate</code>.</p>
<p>Can be used to make one-off messages, like <a href="#one-off-dialog">this dialog</a>.</p>
*/

import { remove, on, off, matches } from '../../dom/module.js';
import './dom-activate.js';

// Define
var match = matches('.removeable, [removeable]');

// Max duration of deactivation transition in seconds
var maxDuration = 1;

function activate(e) {
	// Use method detection - e.defaultPrevented is not set in time for
	// subsequent listeners on the same node
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	//dom.identify(target);
	e.default();
}

function deactivate(e, data, fn) {
	if (!e.default) { return; }

	var target = e.target;
	if (!match(target)) { return; }

	function update() {
		clearTimeout(timer);
		off('transitionend', update, target);
		remove(target);
	}

	var timer = setTimeout(update, maxDuration * 1000);
	on('transitionend', update, target);

	e.default();
}

on('dom-activate', activate, document);
on('dom-deactivate', deactivate, document);
