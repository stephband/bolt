
import get            from '../../fn/modules/get.js';
import isDefined       from '../../fn/modules/is-defined.js';
import noop            from '../../fn/modules/noop.js';
import pattern         from '../../fn/modules/pattern.js';
import delegate        from '../../dom/modules/delegate.js';
import events          from '../../dom/modules/events.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import { isElementNode, isInternalLink } from '../../dom/modules/node.js';
import trigger         from '../../dom/modules/trigger.js';
import select          from '../../dom/modules/select.js';

const A         = Array.prototype;
const location  = window.location;
const id        = location.hash;

export const config = {
	activeClass: 'active',
	onClass:     'on'
};

// A map of behaviour functions keyed by selector
export const behaviours = {};

const triggerActivate = trigger('dom-activate');

function log(type, element, buttons) {
	console.log('%c' + type + ' %c' + (element.id ? '#' + element.id : '<' + element.tagName.toLowerCase() + '>') + ', ' +  buttons.length + ' button' + (buttons.length === 1 ? '' : 's') + '%c',
		'color: #3a8ab0; font-weight: 600;',
		'color: #888888; font-weight: 400;',
		'color: inherit; font-weight: 400;'
	);
}

function selectButtons(id) {
	return select('[href$="#' + id + '"]', document.body)
		.filter(isInternalLink)
		.concat(select('[value="#' + id + '"]', document));
}

function preventClick(e) {
	// Prevent the click that follows the mousedown. The preventDefault
	// handler unbinds itself as soon as the click is heard.
	// Todo: tighten this logic up... store timeStamp?
	if (e.type === 'mousedown') {
		const clicks = events('click', e.currentTarget).each(function prevent(e) {
            clicks.stop();
			e.preventDefault();
		});
	}
}

function isIgnorable(e) {
	// Default is prevented indicates that this link has already
	// been handled. Save ourselves the overhead of further handling.
	if (e.defaultPrevented) { return true; }

	// Ignore mousedowns on any button other than the left (or primary)
	// mouse button, or when a modifier key is pressed.
	if (!isPrimaryButton(e)) { return true; }

	// Ignore key presses other than the enter key
	if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
}

function getHash(node) {
	return (isDefined(node.hash) ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function addOnClass(element) {
	element.classList.add(config.onClass);
}

function removeOnClass(element) {
	element.classList.remove(config.onClass);
}

export function activate(element, button) {
	const ok = trigger({ type: 'dom-activate', relatedTarget: button }, element);
	if (!ok) { return; }

	let selector;
	for (selector in behaviours) {
		const node = element.matches(selector);
		if (node) {
			typeof behaviours[selector] === 'function' ?
				behaviours[selector]({ target: element }) :
				(behaviours[selector].activate && behaviours[selector].activate(element)) ;
		}
	}

	const buttons = selectButtons(element.id);
	element.classList.add(config.activeClass);
	buttons.forEach(addOnClass);

	if (window.DEBUG) {
		log('activate', element, buttons);
	}

	// Focus the first element with class .active-focus
	const focusNode = element.querySelector('.active-focus');
	if (focusNode) {
		// The click that activated this target is not over yet, wait two frames
		// to focus the element. Don't know why we need two.
		requestAnimationFrame(() =>
			requestAnimationFrame(() =>
				focusNode.focus()
			)
		);
	}

	return true;
}

export function deactivate(element, button) {
	const ok = trigger({ type: 'dom-deactivate', relatedTarget: button }, element);
	if (!ok) {
		if (window.DEBUG) { log('deactivate cancelled', element, []); }
		return;
	}

	let selector;
	for (selector in behaviours) {
		const node = element.matches(selector);
		if (node) {
			typeof behaviours[selector] === 'function' ?
				null :
				(behaviours[selector].deactivate && behaviours[selector].deactivate(element)) ;
		}
	}

	const buttons = selectButtons(element.id);
	element.classList.remove(config.activeClass);
	buttons.forEach(removeOnClass);

	if (window.DEBUG) {
		log('deactivate', element, buttons);
	}

	return true;
}

const elementFromButton = pattern((button) => button.value.trim(), {
	'^#':                  (button) => document.getElementById(button.value.slice(1)),
	'^next$':              (button) => button.nextElementSibling,
	'^previous$':          (button) => button.previousElementSibling,
	'^next-element$':      (button) => button.nextElementSibling,
	'^previous-element$':  (button) => button.previousElementSibling,
	'^closest\\((.+)\\)$': (button, selector) => button.closest(selector),

	// Empty values do nothing
	'^$':                  noop,

	// Default to accept a selector
	default:               (button) => document.querySelector(button.value)
});

events('click', document).each(delegate({
	// Clicks on links toggle activate on their href target
	'a[href]': function(a, e) {
		if (isIgnorable(e)) { return; }

		// Check whether the link points to something on this page
		if (a.hostname && !isInternalLink(a)) { return; }

		// Does it point to an id?
		var id = getHash(a);
		if (!id) { return; }

		// Does it point to a node?
		var element = document.getElementById(id);
		if (!element) { return; }

		// Is the node inactive?
		if (element.classList.contains('active')) {
			e.preventDefault();
			return;
		}

		// Is the node activateable?
		if (!Object.keys(behaviours).find((selector) => element.matches(selector))) {
			return;
		}

		// Flag click as handled
		e.preventDefault();

		/*if (e.type === 'mousedown') {
			preventClick(e);
		}*/

		// Activate
		activate(element, a);
	},

	// Clicks on buttons named activate trigger activate on their value target
	'[name="activate"]': function(button, e) {
		if (isIgnorable(e)) { return; }

		const element = elementFromButton(button);
		if (!element) {
			throw new Error('Button action name="activate" target value="' + button.value + '" not found');
		}

		// Flag click as handled
		e.preventDefault();

		// Is element already active?
		if (element.classList.contains('active')) {
			return;
		}

		// Activate
		activate(element, button);
	},

	// Clicks on buttons named deactivate trigger deactivate on their value target
	'[name="deactivate"]': function(button, e) {
		if (isIgnorable(e)) { return; }

		const element = elementFromButton(button);

		if (!element) {
			throw new Error('Button action name="deactivate" target "' + button.value + '" not found');
		}

		// Flag click as handled
		e.preventDefault();

		// Is element already inactive?
		if (!element.classList.contains('active')) {
			return;
		}

		// Deactivate
		deactivate(element, button);
	},

	// Clicks on buttons named activate trigger activate on their value target
	'[name="activate-deactivate"]': function(button, e) {
		const element = elementFromButton(button);

		if (!element) {
			throw new Error('Button action name="activate-deactivate" target value="' + button.value + '" not found');
		}

		// Flag click as handled
		e.preventDefault();

		// Is element already active?
		if (element.classList.contains('active')) {
			// Deactivate
			deactivate(element, button);
		}
		else {
			// Activate
			activate(element, button);
		}
	},
}));


/* Track activateables added to DOM following DOM ready */

const addedElements = new WeakSet();

function addElement(element) {
    addedElements.add(element);
}

function hasntElement(element) {
    return !addedElements.has(element);
}

function pushActives(actives, target) {
	// Select #identifier and .active elements that have not already been registered
	const selector = (window.location.hash ? window.location.hash + ', ' : '') + ('.' + config.activeClass);
    const elements = select(selector, target).filter(hasntElement);

	if (target.matches(selector) && hasntElement(target)) {
		elements.push(target);
	}

	// Push them into the output collection, registering that we seen 'em
    if (elements.length) {
        actives.push.apply(actives, elements);
        elements.forEach(addElement);
    }

    return actives;
}

function pushAddedActives(added, mutation) {
    return A.filter
    .call(mutation.addedNodes, isElementNode)
    .reduce(pushActives, added);
}

// Document setup
events('DOMContentLoaded', document).each(function() {
	// Setup all things that should start out active
	const actives = select('.' + config.activeClass, document);
    if (actives.length) {
		actives.forEach((element) => activate(element, window));
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((mutations, observer) => {
        if (mutations[0].type !== 'childList') {
            throw new Error('Not childList', mutations);
        }

		// Activate .active elements
        const actives = mutations.reduce(pushAddedActives, []);
        if (actives.length) {
            actives.forEach((element) => {
				activate(element, window)
				addElement(element);
			});
        }
    });

    // Start observing body for mutations
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true
    });
});

events('load', window).each(function() {
	// Activate the node that corresponds to the hashref in
	// location.hash, checking if it's an alphanumeric id selector
	// (not a hash bang, which google abuses for paths in old apps)
	if (!id || !(/^#\S+$/.test(id))) { return; }

	// Catch errors, as id may nonetheless be an invalid selector
	try {
		select(id, document).forEach(triggerActivate);
	}
	catch(e) {
		console.warn('dom: Cannot activate ' + id, e.message);
	}
});
/*
events('dom-activate', document).each((e) => {
	let selector;
	for (selector in behaviours) {
		const node = e.target.matches(selector);
		if (node) {
			return behaviours[selector](e);
		}
	}
});
*/
