
import curry           from '../../fn/modules/curry.js';
import isDefined       from '../../fn/modules/is-defined.js';
import noop            from '../../fn/modules/noop.js';
import overload        from '../../fn/modules/overload.js';
import pattern         from '../../fn/modules/pattern.js';
import classes         from '../../dom/modules/classes.js';
import delegate        from '../../dom/modules/delegate.js';
import events          from '../../dom/modules/events.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import { isElementNode, isInternalLink } from '../../dom/modules/node.js';
import trigger         from '../../dom/modules/trigger.js';
import tag             from '../../dom/modules/tag.js';
import select          from '../../dom/modules/select.js';

const A = Array.prototype;

var location  = window.location;
var id        = location.hash;
var store     = new WeakMap();

var apply = curry(function apply(node, fn) {
	return fn(node);
});

export const config = {
	activeClass: 'active',
	onClass:     'on',
	cache:       true
};

export const matchers = [];
export const handlers = [];


function findButtons(id) {
	return select('[href$="#' + id + '"]', document.body)
	.filter(overload(tag, {
		a:       isInternalLink,
		default: function() { return true; }
	}))
	.concat(select('[data-href="#' + id + '"]', document));
}

function getData(node) {
	let data = store.get(node);

	if (!data) {
		data = {};
		store.set(node, data);
	}

	return data;
}

function cacheData(target, button) {
	var data = getData(target);
	var id   = target.id;

	if (!data.node)          { data.node    = target; }
	if (!data.buttons)       { data.buttons = config.cache && id && findButtons(id); }

	if (button) {
		if (data.buttons) {
			if (!data.buttons.includes(button)) {
				data.buttons.push(button);
			}
		}
		else {
			data.buttons = [button];
		}
	}

	if (!('active' in data)) { data.active  = target.classList.contains('active'); }

	return data;
}

function getButtons(data) {
	return (config.cache && data.buttons) || (data.node.id && findButtons(data.node.id));
}

function preventClick(e) {
	// Prevent the click that follows the mousedown. The preventDefault
	// handler unbinds itself as soon as the click is heard.
	// Todo: tighten this logic up... store timeStamp?
	if (e.type === 'mousedown') {
		const clicks = events('click', e.currentTarget).each(function prevent(e) {
            clicks.stop();
			//off('click', prevent, e.currentTarget);
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

function sum(total, n) {
    return total + !!n;
}

function log(type, element, data) {
	console.log('%c' + type + ' %c' + (element.id ? '#' + element.id : '<' + element.tagName.toLowerCase() + '>') + ', ' +  data.buttons.length + ' button' + (data.buttons.length === 1 ? '' : 's') + '%c',
		'color: #3a8ab0; font-weight: 600;',
		'color: #888888; font-weight: 400;',
		'color: inherit; font-weight: 400;'
	);
}

export function activate(element, related) {
	const ok = trigger({ type: 'dom-activate', relatedTarget: related }, element);
	if (!ok) { return; }

	const data = cacheData(element);
	if (window.DEBUG) {
		log('activate', element, data);
	}

	data.active = true;
	classes(data.node).add(config.activeClass);
	const buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).add(config.onClass);
		});
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

export function deactivate(element, related) {
	const ok = trigger({ type: 'dom-deactivate', relatedTarget: related }, element);
	if (!ok) { return; }

	const data = cacheData(element);
	if (window.DEBUG) {
		log('deactivate', element, data);
	}

	classes(data.node).remove(config.activeClass);
	const buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).remove(config.onClass);
		});
	}

	data.active = false;
	return true;
}

const elementFromButton = pattern((button) => button.value.trim(), {
	'^#':                  (button) => document.getElementById(button.value.slice(1)),
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

		// Is the node handleable
		var handleCount = handlers.map(apply(element)).reduce(sum, 0);
		if (handleCount) {
			e.preventDefault();
			return;
		}

		// Is the node activateable?
		if (!matchers.find(apply(element))) { return; }

		var data = cacheData(element, a);

		// Don't do anything if element is already active
		if (data.active) { return; }

		// Flag click as handled
		e.preventDefault();

		if (e.type === 'mousedown') {
			preventClick(e);
		}

		// Activate
		activate(element, a);
	},

	// Clicks on buttons named activate trigger activate on their value target
	'[name="activate"]': function(button, e) {
		const element = elementFromButton(button);

		if (!element) {
			throw new Error('Button action name="activate" target value="' + button.value + '" not found');
		}

		var data = cacheData(element, button);

		// Don't do anything if element is already active
		if (data.active) { return; }

		// Flag click as handled
		e.preventDefault();

		// Activate
		activate(element, button);
	},

	// Clicks on buttons named deactivate trigger deactivate on their value target
	'[name="deactivate"]': function(button, e) {
		const element = elementFromButton(button);

		if (!element) {
			throw new Error('Button action name="deactivate" target "' + button.value + '" not found');
		}

		var data = cacheData(element, button);

		// Don't do anything if element is already inactive
		if (!data.active) { return; }

		// Flag click as handled
		e.preventDefault();

		// Deactivate
		deactivate(element, button);
	}
}));


/* Trigger activation on DOM load and mutations thereafter */

const triggerActivate = trigger('dom-activate');

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
        //log('dom-activate', actives.length + ' elements – #' + actives.map(get('id')).join(', #'));
        actives.forEach(triggerActivate);
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((mutations, observer) => {
        if (mutations[0].type !== 'childList') {
            throw new Error('Not childList', mutations);
        }

		// Activate .active elements
        const actives = mutations.reduce(pushAddedActives, []);
        if (actives.length) {
            //log('dom-activate', actives.length + ' elements – #' + actives.map(get('id')).join(', #'));
            actives.forEach(triggerActivate);
            actives.forEach(addElement);
        }
    });

    // Start observing body for mutations
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true
    });

    // Later, you can stop observing
    //observer.disconnect();
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
