
import events          from '../../dom/modules/events.js';
import delegate        from '../../dom/modules/delegate.js';
import { focusInside } from '../../dom/modules/focus.js';
import isTargetEvent   from '../../dom/modules/is-target-event.js';
import rect            from '../../dom/modules/rect.js';
import { disableScroll, enableScroll } from '../../dom/modules/scroll.js';
import { behaviours, activate, deactivate } from '../events/dom-activate.js';

// As it is possible to have multiple dialogs open, we must enumerate them
let n = 0;
let timer

function disableDocumentScroll() {
    if (n === 0) {
        // In Linux Chrome (at least), disabling scroll interrupts scrolling
        // that is launched on any internal elements responding to hash change,
        // so we must delay it. I wish we could ask for scroll events and wait
        // until they are finished, but we cannot listen to scroll events inside
        // of a shadow DOM, so we are forced to use setTimeout.
        timer = setTimeout(disableScroll, 900);
    }

    // As it is possible to have multiple dialogs open, we must enumerate them
    ++n;
}

function enableDocumentScroll() {
    --n;

    // This shouldn't happen, but if there's an error somewhere it's possible
    if (n < 0) { n = 0; }

    // Enable scrolling on document element
    if (n === 0) {
        clearTimeout(timer);
        enableScroll();
    }
}

export function open(element) {
    // Is the element closed?
    if (element.open) { return; }

    // Then open it
    element.showModal();

    // Disable scrolling on the document.
    disableDocumentScroll();

    // Move focus inside the dialog
    if (element !== document.activeElement && !element.contains(document.activeElement)) {
        // The click that activated this target is not over yet, wait three frames
        // to focus the element. Don't know why we need three. Two is enough in
        // Safari, Chrome seems to like three, to be reliable. Not sure what we
        // are waiting for here.
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                    focusInside(element)
                )
            )
        );
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
    enableDocumentScroll();
}

events('click', document).each(delegate({
    // Clicks on a dialog[data-closeable] backdrop close the dialog
    'dialog[data-popable]': function(dialog, e) {
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
            deactivate(dialog);
        }
    }
}));

behaviours['dialog'] = {
    activate:   open,
    deactivate: close
};
