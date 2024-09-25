
import noop               from 'fn/noop.js';
import delegate           from 'dom/delegate.js';
import events             from 'dom/events.js';
import identify           from 'dom/identify.js';
import isElement          from 'dom/is-element.js';
import isFragment         from 'dom/is-fragment.js';
import isPrimaryButton    from 'dom/is-primary-button.js';
import isTargetEvent      from 'dom/is-target-event.js';
import { isInternalLink } from 'dom/node.js';
import select             from 'dom/select.js';


const A = Array.prototype;


function isIgnorable(e) {
    // Default is prevented indicates that this click has already
    // been handled. Save ourselves the overhead of further handling.
    if (e.defaultPrevented) return true;

    // Ignore mousedowns on any button other than the left (or primary)
    // mouse button, or when a modifier key is pressed.
    if (!isPrimaryButton(e)) return true;
}

function getHash(node) {
    return (isDefined(node.hash) ?
        node.hash :
        node.getAttribute('href')
    ).substring(1);
}

function toggleableFromLink(a) {
    const root = a.getRootNode();
    return root.querySelector(a.hash);
}

function toggleableFromButton(button) {
    const root = button.getRootNode();
    return button.value ?
        root.querySelector(button.value) :
        button.closest('dialog') ;
}

function buttonsFromElement(element) {
    const root = element.getRootNode();
    const id   = identify(element);
    return select('[href$="#' + id + '"]', root)
        .filter(isInternalLink)
        .concat(select('[value="#' + id + '"]', root));
}

function addOnClass(button) {
    button.classList.add('on');
}

function removeOnClass(button) {
    button.classList.remove('on');
}


const map = new WeakMap();

function getElements(root) {
    if (!map.has(root)) {
        map.set(root, {});
        events('click', root).each(handleClick);
        events('focusin', root).each(handleFocus);

        // Only listen to hashchange to trigger things things in the top level
        // DOM (the light DOM, no shadow DOMs)
        if (root === document) events('load hashchange', window).each(handleHash);
    }

    return map.get(root);
}

function getActions(element) {
    const root = element.getRootNode();
    if (isFragment(root)) throw new Error('Attempt to toggle an element that is not in the DOM');
    const elements = getElements(root);
    let selector;
    for (selector in elements) {
        if (element.matches(selector)) return elements[selector];
    }
}


export function open(element, target) {
    const actions = getActions(element);
    if (!actions) return;
    const buttons = buttonsFromElement(element);
    const state = actions.open ?
        actions.open(element, target, buttons) :
        true ;
    if (state) buttons.forEach(addOnClass);
    return true;
}

export function close(element, target) {
    const actions = getActions(element);
    if (!actions) return;
    const buttons = buttonsFromElement(element);
    const state = actions.close ?
        actions.close(element, target, buttons) :
        false ;
    if (!state) buttons.forEach(removeOnClass);
    return true;
}

export function toggle(element, target) {
    const actions = getActions(element);
    if (!actions) return;
    if (!actions.toggle) return;
    const buttons = buttonsFromElement(element);
    const state = actions.toggle(element, target, buttons);
    if (state) buttons.forEach(addOnClass);
    else buttons.forEach(removeOnClass);
    return true;
}

export function locate(element) {
    const actions = getActions(element);
    if (!actions) return;
    if (!actions.locate) return;
    const buttons = buttonsFromElement(element);
    const state = actions.locate(element, null, buttons);
    if (state) buttons.forEach(addOnClass);
    else buttons.forEach(removeOnClass);
    return true;
}

function recurseFocus(element) {
    if (!element) return;
    recurseFocus(element.parentElement);
    open(element);
}

function handleFocus(e) {
    recurseFocus(e.target);
}

function handleHash(e) {
    const hash = window.location.hash;

    // Open the node that corresponds to location.hash, checking if it's an
    // alphanumeric id selector (not a hash bang, which google abuses for paths
    // in old apps)
    if (!hash || !(/^#\S+$/.test(hash))) return;

    // Hash may nonetheless be an invalid selector, this may error, that's ok
    const element = document.querySelector(hash);
    if (element) locate(element);
}

function handleLinkClick(a, e, fn) {
    // Ignore right-clicks, option-clicks
    if (isIgnorable(e)) return;

    // Check whether the link points to something on this page
    if (a.hostname && !isInternalLink(a)) return;

    // Does it point to a node?
    const element = toggleableFromLink(a);
    if (!element) return;

    // e.detail tells us whether click came from keyboard [RETURN] key
    //const isKeyboardClick = e.detail === 0;

    // Perform action and flag click as handled
    if (fn(element, a)) e.preventDefault();
}

function handleButtonClick(button, e, fn) {
    // Ignore right-clicks, option-clicks
    if (isIgnorable(e)) return;

    const element = toggleableFromButton(button);
    if (!element) {
        if (window.DEBUG) console.error('Button name="' + button.name + '" value="' + button.value + '" element not found');
        return;
    }

    // e.detail tells us whether click came from keyboard [RETURN] key
    //const isKeyboardClick = e.detail === 0;

    // Perform action and flag click as handled
    if (fn(element, button)) e.preventDefault();
}

const handleClick = delegate({
    'a[href^="#"]':    (link, e)   => handleLinkClick(link, e, toggle),
    '[name="open"]':   (button, e) => handleButtonClick(button, e, open),
    '[name="close"]':  (button, e) => handleButtonClick(button, e, close),
    '[name="toggle"]': (button, e) => handleButtonClick(button, e, toggle),

    // TODO!!!
    // Clicks inside dialogs
    'dialog': noop,

    // Clicks outside dialogs
    '*': (target, e) => {
        const root     = target.getRootNode();
        const elements = getElements(root);
        root.querySelectorAll('dialog[open]').forEach((element) => elements.dialog.close(element));
    }
});


/* Register a selector for open/close/toggle/load actions */

export function actions(selector, actions, root = document) {
    const elements = getElements(root);
    elements[selector] = actions;

    window.console &&
    window.console.log('%c<button>%c actions for selector "' + selector + '"', 'color:#3a8ab0;font-weight:600;', 'color:#888888;font-weight:400;');
}



/* Setup on document mutation */

//events('load', window).each(() => console.log('load ACTIVE', document.activeElement));
//events('hashchange', window).each(() => console.log('hashchange ACTIVE', window.location.hash, document.activeElement));
//events('DOMContentLoaded', window).each(() => console.log('DOMContentLoaded ACTIVE', document.activeElement));


/*
function pushElements(elements, mutation) {
    elements.push.apply(elements, A.filter.call(mutation.addedNodes, isElement));
    return elements;
}

events('DOMContentLoaded', document).each(function() {
    const elements = getElements(document);

    let selector;
    for (selector in elements) {
        if (elements[selector].load) {
            document
            .querySelectorAll(selector)
            .forEach((element) => {
                if (elements[selector].load(element)) {
                    open(element);
                }
            });
        }
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((mutations, observer) => {
        const hash = window.location.hash;

        mutations
        .reduce(pushElements, [])
        .forEach((element) => {
            let selector;
            for (selector in elements) {
                if (elements[selector].load) {
                    if (element.matches(selector) && elements[selector].load(element)) {
                        open(element);
                    }

                    elements[selector].load(element);
                    element.querySelectorAll(selector).forEach((element) => {
                        if (elements[selector].load(element)) {
                            open(element);
                        }
                    });
                }
            }

            // If added content matches document hash
            locate(element);
        });
    });

    // Start observing body for mutations
    observer.observe(document.body, { childList: true, subtree: true });
});
*/
