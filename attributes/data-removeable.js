/*
`removeable`

<p>A <strong>removeable</strong> is removed from the DOM after
<code>dom-deactivate</code>.</p>
<p>Can be used to make one-off messages, like <a href="#one-off-dialog">this dialog</a>.</p>
*/

import matches      from '../../dom/modules/matches.js';
import events       from '../../dom/modules/events.js';
import { matchers } from '../events/dom-activate.js';


// Define
var match = matches('[data-removeable]');
matchers.push(match);

// Max duration of deactivation transition in seconds
var maxDuration = 1;

function deactivate(e) {
	var target = e.target;
	if (!match(target)) { return; }

	function update() {
		clearTimeout(timer);
		ends.stop();
		target.remove();
	}

	var timer = setTimeout(update, maxDuration * 1000);
	var ends  = events('transitionend', update, target);
}

events('dom-deactivate', document).each((e) => {
	var target = e.target;
	if (!match(target)) { return; }
	deactivate(e);
});
