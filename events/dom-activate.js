
import curry     from '../../fn/modules/curry.js';
import get       from '../../fn/modules/get.js';
import isDefined from '../../fn/modules/is-defined.js';
import overload  from '../../fn/modules/overload.js';
//import append    from '../../dom/modules/append.js';
import classes   from '../../dom/modules/classes.js';
//import create    from '../../dom/modules/create.js';
import delegate  from '../../dom/modules/delegate.js';
import Event     from '../../dom/modules/event.js';
import events, { isPrimaryButton } from '../../dom/modules/events.js';
import { isElementNode, isInternalLink } from '../../dom/modules/node.js';
import trigger   from '../../dom/modules/trigger.js';
import tag       from '../../dom/modules/tag.js';
import select    from '../../dom/modules/select.js';
//import ready     from '../../dom/modules/ready.js';
import log       from '../modules/log.js';
//import remove    from '../../dom/modules/remove.js';

var DEBUG     = false;

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
	var data = store.get(node);
	if (!data) {
		data = {};
		store.set(node, data);
	}
	return data;
}

function cacheData(target) {
	var data = getData(target);
	var id   = target.id;

	if (!data.node) { data.node = target; }
	if (!data.buttons) { data.buttons = config.cache && id && findButtons(id); }

	return data;
}

function getButtons(data) {
	return (config.cache && data.buttons) || (data.node.id && findButtons(data.node.id));
}

// Listen to activate events

function defaultActivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already active
	if (data.active) { return; }
	data.active = true;
	this.preventDefault();

	if (DEBUG) { console.log('[activate] default | target:', this.target.id, 'data:', data); }

	classes(data.node).add(config.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).add(config.onClass);
		});
	}

	// Focus the first element with class .active-focus
	const focusNode = this.target.querySelector('.active-focus');
    if (focusNode) {
		// The click that activated this target is not over yet, wait two frames
		// to focus the element. Don't know why we need two.
		requestAnimationFrame(() =>
			requestAnimationFrame(() =>
				focusNode.focus()
			)
		);
	}
}

function defaultDeactivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already inactive
	if (!data.active) { return; }
	data.active = false;
	this.preventDefault();

	if (DEBUG) { console.log('[deactivate] default | target:', this.target.id, 'data:', data); }

	classes(data.node).remove(config.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).remove(config.onClass);
		});
	}
}

/*
dom-activate

<p>When a <code>dom-activate</code> event is triggered on an element
with a behaviour attribute, and if that event bubbles to
<code>document</code> without being prevented&hellip;</p>

<ol>
    <li>the class <code>active</code> is added to the target</li>
    <li>the class <code>on</code> is added to all links that
    reference the element by hash ref</li>
</ol>

<p>To programmatically activate a `popable`, `toggleable` or
`switchable`:</p>

```trigger('dom-activate', element);```
*/

events('dom-activate', document).each(function(e) {
	if (e.defaultPrevented) { return; }

	var data = cacheData(e.target);

	// Don't do anything if elem is already active
	if (data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultActivate;
});

/*
dom-deactivate

<p>When a <code>dom-deactivate</code> event is triggered on an
element with a behaviour attribute, and if that event bubbles to
<code>document</code> without being prevented&hellip;</p>

<ol>
    <li>the class <code>active</code> is removed from the target</li>
    <li>the class <code>on</code> is removed from all links that
    reference the element by hash ref</li>
</ol>

<p>To programmatically deactivate a `popable`, `toggleable` or
`switchable`:</p>

```trigger('dom-deactivate', element);```
*/

events('dom-deactivate', document).each(function(e) {
	if (e.defaultPrevented) { return; }
	var data = cacheData(e.target);

	// Don't do anything if elem is already inactive
	if (!data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultDeactivate;
});


// Listen to clicks


/*
var nodeCache = {};

var dialogs = {};

var targets = {
	dialog: function(a, e) {
		var href = a.getAttribute('data-href') || a.hash || a.href;

		//Todo: more reliable way of getting id from a hash ref
		var id = href.substring(1);
		var fragment;

//			if (!id) { return loadResource(e, href); }

//			if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
//				id = parts[1];
//			}

		var node = nodeCache[id] || (nodeCache[id] = document.getElementById(id));

//			if (!node) { return loadResource(e, href); }

		e.preventDefault();

		// If the node is html hidden inside a text/html script tag,
		// extract the html.
		if (node.getAttribute && node.getAttribute('type') === 'text/html') {
			// Todo: trim whitespace from html?
			fragment = create('fragment', node.innerHTML);
		}

		// If it's a template...
		if (node.tagName && node.tagName.toLowerCase() === 'template') {
			// If it is not inert (like in IE), remove it from the DOM to
			// stop ids in it clashing with ids in the rendered result.
			if (!node.content) { remove(node); }
			fragment = fragmentFromContent(node);
		}

		var dialog = dialogs[id] || (dialogs[id] = createDialog(fragment));
		trigger('dom-activate', dialog);
	}
};

//	var rImage   = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
//	var rYouTube = /youtube\.com/;

function createDialog(content) {
	var layer = create('div', { class: 'dialog-layer layer' });
	var dialog = create('div', { class: 'dialog popable' });
	var button = create('button', { class: 'close-thumb thumb' });

	append(dialog, content);
	append(layer, dialog);
	append(layer, button);
	append(document.body, layer);

	return dialog;
}

//	function loadResource(e, href) {
//		var link = e.currentTarget;
//		var path = link.pathname;
//		var node, elem, dialog;
//
//		if (rImage.test(link.pathname)) {
//			e.preventDefault();
//			img = new Image();
//			dialog = createDialog();
//			var classes = dom.classes(dialog);
//			classes.add('loading');
//			dom.append(dialog, img);
//			on(img, 'load', function() {
//				classes.remove('loading');
//			});
//			img.src = href;
//			return;
//		}
//
//		if (rYouTube.test(link.hostname)) {
//			e.preventDefault();
//
//			// We don't need a loading indicator because youtube comes with
//			// it's own.
//			elem = dom.create('iframe', {
//				src:             href,
//				class:           "youtube_iframe",
//				width:           "560",
//				height:          "315",
//				frameborder:     "0",
//				allowfullscreen: true
//			});
//
//			node = elem[0];
//			elem.dialog('lightbox');
//			return;
//		}
//	}
*/
function preventClick(e) {
	// Prevent the click that follows the mousedown. The preventDefault
	// handler unbinds itself as soon as the click is heard.
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

function activateHref(a, e) {
	if (isIgnorable(e)) { return; }

	// Check whether the link points to something on this page
	if (a.hostname && !isInternalLink(a)) { return; }

	// Does it point to an id?
	var id = getHash(a);
	if (!id) { return; }

	// Does it point to a node?
	var node = document.getElementById(id);
	if (!node) { return; }

	// Is the node inactive?
	if (node.classList.contains('active')) {
		e.preventDefault();
		return;
	}

    // Is the node handleable
    var handleCount = handlers.map(apply(node)).reduce(sum, 0);
	if (handleCount) {
        e.preventDefault();
        return;
    }

	// Is the node activateable?
	if (!matchers.find(apply(node))) { return; }

	e.preventDefault();

	if (e.type === 'mousedown') {
		preventClick(e);
	}

	var event = Event('dom-activate', { relatedTarget: a });
	node.dispatchEvent(event);
}

events('click', document).each(delegate({
	// Clicks on links toggle activate on their href target
	'a[href]': activateHref,

	// Clicks on buttons named deactivate trigger deactivate on their value target
	'[name="deactivate"]': function(button, e) {
		const href    = button.value;
		const id      = href.replace(/^#/, '');
		const element = document.getElementById(id);

		if (!element) {
			throw new Error('Button action name="deactivate" target "' + href + '" not found');
		}

		trigger('dom-deactivate', element);

		// Flag as handled
		e.preventDefault();
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
        log('dom-activate', actives.length + ' elements – #' + actives.map(get('id')).join(', #'));
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
            log('dom-activate', actives.length + ' elements – #' + actives.map(get('id')).join(', #'));
            actives.forEach(triggerActivate);
            actives.forEach(addElement);
        }
    });

    // Start observing the target node for mutations
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
