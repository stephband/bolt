
import noop               from 'fn/noop.js';
import events             from 'dom/events.js';
import delegate           from 'dom/delegate.js';
import isPrimaryButton    from 'dom/is-primary-button.js';
import isTargetEvent      from 'dom/is-target-event.js';
import { isInternalLink } from 'dom/node.js';
import select             from 'dom/select.js';

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
/*
function getButtons(id, root) {
    return select('[href$="#' + id + '"]', root)
        .filter(isInternalLink)
        .concat(select('[value="#' + id + '"]', document));
}
*/
const map = new WeakMap();

function getElements(root) {
    if (!map.has(root)) map.set(root, {});
    return map.get(root);
}

function getActions(element) {
    const root     = element.getRootNode();
    const elements = getElements(root);

    let selector;
    for (selector in elements) {
        if (element.matches(selector)) return elements[selector];
    }
}

const handle = delegate({
    'a[href^="#"]': (a, e) => {
        // Ignore right-clicks, option-clicks
        if (isIgnorable(e)) return;

        // Check whether the link points to something on this page
        if (a.hostname && !isInternalLink(a)) return;

        // Does it point to a node?
        const element = toggleableFromLink(a);
        if (!element) return;

        const actions = getActions(element);
        if (!actions) return;

        // Perform action and flag click as handled
        actions.toggle(element, a);
        e.preventDefault();
    },

    '[name="toggle"]': (button, e) => {
        // Ignore right-clicks, option-clicks
        if (isIgnorable(e)) return;

        const element = toggleableFromButton(button);
        if (!element) throw new Error('Button name="' + button.name + '" value="' + button.value + '" target dialog not found');

        const actions = getActions(element);
        if (!actions) return;

        // Perform action and flag click as handled
        actions.toggle(element, button);
        e.preventDefault();
    },

    '[name="open"]': (button, e) => {
        // Ignore right-clicks, option-clicks
        if (isIgnorable(e)) return;

        const element = toggleableFromButton(button);
        if (!element) throw new Error('Button name="' + button.name + '" value="' + button.value + '" target dialog not found');

        const actions = getActions(element);
        if (!actions) return;

        // Perform action and flag click as handled
        actions.open(element, button);
        e.preventDefault();
    },

    '[name="close"]': (button, e) => {
        // Ignore right-clicks, option-clicks
        if (isIgnorable(e)) return;

        const element = toggleableFromButton(button);
        if (!element) throw new Error('Button name="' + button.name + '" value="' + button.value + '" target dialog not found');

        const actions = getActions(element);
        if (!actions) return;

        // Perform action and flag click as handled
        actions.close(element, button);
        e.preventDefault();
    },

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

export function actions(selector, actions, root=document) {
    const elements = getElements(root);
    elements[selector] = actions;
    events('click', root).each(handle);
}
