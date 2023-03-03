
import events          from '../../dom/modules/events.js';
import delegate        from '../../dom/modules/delegate.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import isTargetEvent   from '../../dom/modules/is-target-event.js';
import { isInternalLink } from '../../dom/modules/node.js';
import rect            from '../../dom/modules/rect.js';
import { disableScroll, enableScroll } from '../../dom/modules/scroll.js';
import { trigger }     from '../../dom/modules/trigger.js';

// As it is possible to have multiple dialogs open, we must enumerate them
let n = 0;

function isIgnorable(e) {
    // Default is prevented indicates that this link has already
    // been handled. Save ourselves the overhead of further handling.
    if (e.defaultPrevented) { return true; }

    // Ignore mousedowns on any button other than the left (or primary)
    // mouse button, or when a modifier key is pressed.
    if (!isPrimaryButton(e)) { return true; }

    // Ignore key presses other than the enter key
    //if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
}

function getHash(node) {
    return node.hash.substring(1);
}

export function open(element) {
    // Is the element closed?
    if (element.open) { return; }

    // Then open it
    element.showModal();

    // Notify activation
    if (trigger('dom-activate', element)) {
        // Disable scolling on document element
        if (n === 0) { disableScroll(); }

        // As it is possible to have multiple dialogs open, we must enumerate them
        ++n;
    }
}

export function close(element) {
    // Is the element open?
    if ('open' in element && !element.open) { return; }

    // Attach the current margin-top, otherwise the dialog jumps
    const computed = getComputedStyle(element);
    element.style.marginTop = computed.marginTop;

    // And take it off when the closing transition is over
    events('transitionend', element)
    .filter(isTargetEvent)
    .slice(0, 1)
    .each((e) => element.style.marginTop = '');

    // Close
    element.close();

    // Notify deactivation. Dialogs do have a 'close' event that fires here,
    // but the powers that be have decided that it should not bubble.
    if (trigger('dom-deactivate', element)) {
        --n;

        // This shouldn't happen, but if there's an error somewhere it's possible
        if (n < 0) { n = 0; }

        // Enable scrolling on document element
        if (n === 0) { enableScroll(); }
    }
}

events('click', document)
.each(delegate({
    // Clicks on links toggle activate on their href target
    'a[href]': function(a, e) {
        if (isIgnorable(e)) { return; }

        // Check whether the link points to something on this page
        if (a.hostname && !isInternalLink(a)) { return; }

        // Does it point to an id?
        const id = getHash(a);
        if (!id) { return; }

        // Does it point to an element?
        const target = document.getElementById(id);
        if (!target) { return; }

        // Is the element a dialog, or inside a dialog?
        const element = target.closest('dialog');
        if (!element) { return; }

        // If target is the dialog, flag event as handled
        if (element === target) {
            e.preventDefault();
        }

        open(element);
    },

    '[name="open"]': function(button, e) {
        if (isIgnorable(e)) { return; }

        const href = button.value;
        const id   = href.replace(/^#/, '');

        // Does it point to an element?
        const element = document.getElementById(id);
        if (!element) { return; }

        // Is the element a dialog?
        if (!element.showModal) { return; }

        // Flag click as handled
        e.preventDefault();

        open(element);
    },

    '[name="close"]': function(button, e) {
        if (isIgnorable(e)) { return; }

        const href = button.value;
        const id   = href.replace(/^#/, '');

        // Does it point to an element?
        const element = document.getElementById(id);
        if (!element) { return; }

        // Is the element a dialog?
        if (!element.showModal) { return; }

        // Flag click as handled
        e.preventDefault();

        close(element);
    },

    // Clicks on a dialog[data-closeable] backdrop close the dialog
    'dialog[data-closeable]': function(dialog, e) {
        // Ignore clicks not on the dialog itself
        if (dialog !== e.target) {
            return;
        }

        const box = rect(dialog);
        const isInDialog = (
            box.top <= e.clientY
            && e.clientY <= box.top + box.height
            && box.left <= e.clientX
            && e.clientX <= box.left + box.width
        );

        if (!isInDialog) {
            close(dialog);
        }
    }
}));
