/*
`data-removeable`
A `data-removeable` is removed from the DOM after `dom-deactivate`.
*/

import events from 'dom/events.js';
import { behaviours } from '../events/_dom-activate.js';

// Max duration of deactivation transition in seconds
const maxDuration = 1;

function activate(e) {
	const element = e.target;
	const deactivates = events('dom-deactivate', element)
		.filter((e) => e.target === e.currentTarget)
		.each((e) => {
			// TODO: wait for .active to be removed, inspect transition durations,
			// wait for all non-zero transitions
			const timer = setTimeout(update, maxDuration * 1000);
			const ends  = events('transitionend', update, element);

			function update() {
				clearTimeout(timer);
				ends.stop();
				element.remove();
			}

			deactivates.stop();
		});
}

behaviours['[data-removeable]'] = activate;
