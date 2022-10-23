
import events          from '../../dom/modules/events.js';
import delegate        from '../../dom/modules/delegate.js';
import isPrimaryButton from '../../dom/modules/is-primary-button.js';
import { isInternalLink } from '../../dom/modules/node.js';


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

        // Is the element closed?
        if (element.open) { return; }

        // Then open it
        element.showModal();
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

        // Is the element closed?
        if (element.open) { return; }

        element.showModal();
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

        // Is the element open?
        if ('open' in element && !element.open) { return; }

        // Close
        element.close();
    }
}));
