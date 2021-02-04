
import curry     from '../../fn/modules/curry.js';
import isDefined from '../../fn/modules/is-defined.js';
import overload  from '../../fn/modules/overload.js';
import append    from '../../dom/modules/append.js';
import classes   from '../../dom/modules/classes.js';
import create    from '../../dom/modules/create.js';
import delegate  from '../../dom/modules/delegate.js';
import Event     from '../../dom/modules/event.js';
import { isPrimaryButton, on, off } from '../../dom/modules/events.js';
import { isInternalLink } from '../../dom/modules/node.js';
import trigger   from '../../dom/modules/trigger.js';
import tag       from '../../dom/modules/tag.js';
import select    from '../../dom/modules/select.js';
import ready     from '../../dom/modules/ready.js';
import remove    from '../../dom/modules/remove.js';

var DEBUG     = false;

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

on('dom-activate', function(e) {
	if (e.defaultPrevented) { return; }

	var data = cacheData(e.target);

	// Don't do anything if elem is already active
	if (data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultActivate;
}, document);

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

on('dom-deactivate', function(e) {
	if (e.defaultPrevented) { return; }
	var data = cacheData(e.target);

	// Don't do anything if elem is already inactive
	if (!data.active) {
		e.preventDefault();
		return;
	}

	e.data    = data;
	e.default = defaultDeactivate;
}, document);


// Listen to clicks

var triggerActivate = trigger('dom-activate');

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

function preventClick(e) {
	// Prevent the click that follows the mousedown. The preventDefault
	// handler unbinds itself as soon as the click is heard.
	if (e.type === 'mousedown') {
		on('click', function prevent(e) {
			off('click', prevent, e.currentTarget);
			e.preventDefault();
		}, e.currentTarget);
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

	// TODO: This doesnt seem to set relatedTarget
	// trigger(node, 'dom-activate', { relatedTarget: e.delegateTarget });
	var event = Event('dom-activate', { relatedTarget: a });
	node.dispatchEvent(event);
}

function activateTarget(a, e) {
	var target = a.target;

	if (isIgnorable(e)) { return; }

	// If the target is not listed, ignore
	if (!targets[target]) { return; }
	return targets[target](a, e);
}

// Clicks on buttons toggle activate on their hash
// Clicks on buttons toggle activate on their targets
on('click', delegate({
	'a[href]': activateHref,
	'a[target]': activateTarget
}), document);

// Document setup
ready(function() {
	// Setup all things that should start out active
	select('.' + config.activeClass, document).forEach(triggerActivate);
});

on('load', function() {
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
}, window);
