
/**
data-popable

```html
<div data-popable class="right-top-bubble top-bubble bubble" id="bolt-popable">Hello.</div>
<a class="button" href="#bolt-popable">Show bubble</a>
<button class="button" name="activate" value="#bolt-popable">Show bubble</button>
```

An element with a `data-popable` attribute is given the class `"active"` when a
link that references it is click-hijacked, and then deactivated by user interaction
outside of itself. While it is active, all links to it have the class `"on"`.

It is also activated when the page loads with its fragment identifier in the URL.

With a little hide/show style, a popable can be used to make menus, tooltips,
bubbles, accordions and so on.
**/

import events          from 'dom/events.js';
import focus           from 'dom/focus.js';
import isPrimaryButton from 'dom/is-primary-button.js';
import isTargetEvent   from 'dom/is-target-event.js';
import trigger         from 'dom/trigger.js';
import style           from 'dom/style.js';
import { actions }     from './name=toggle.js';

const focusableSelector = 'input, textarea, select, [autofocus], [tabindex]';
const popables = new WeakMap();

let mousedowns, focusins, focusouts, escapes;

function stop(stream) {
    stream.stop();
}

export function open(element, button, buttons) {
    if (popables.has(element)) return true;

    function handleClose(e) {
        // Focus is, or is inside, element, ignore
        if (element === e.target || element.contains(e.target)) return;

        // Focus is, or is inside, one of the buttons, ignore
        if (buttons.find((button) => (button === e.target || button.contains(e.target)))) return;

        // Focus has moved outside element, close it
        close(element, e.target);
    }

    popables.set(element, [
        events('mousedown', document).filter(isPrimaryButton).each(handleClose),
        events('focusin', document).each(handleClose),
        events('keydown', document).each((e) => {
            // Not escape key, ignore
            if (e.key !== "Escape") return;

            // Close data-popable
            close(element, null);
        })
    ]);

    // Set data-popaable's .open property if it has one
    if ('open' in element) element.open = true;
    // or give data-popable an open attribute
    else element.setAttribute('open', '');

    // Give the popable an 'open' event
    trigger({ type: 'open', relatedTarget: button }, element);

    // If button exists open() has been called as the result of a user interaction,
    // and if element does not already contain focus and there is something
    // focusable about it we want to move focus inside it
    if (button && element !== document.activeElement && !element.contains(document.activeElement)) {
        // The click that activated this target is not over yet, wait three frames
        // to focus the element. I don't know why we need three. Two is enough
        // in Safari, Chrome seems to like three, to be reliable. Not sure what
        // we are waiting for here. No sir, I don't like it.
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() =>
            focus(element)
        )));
    }

    // Return state of element
    return true;
}

export function close(element) {
    const streams = popables.get(element);
    if (!streams) return false;

    streams.forEach(stop);
    popables.delete(element);

    // Set data-popaable's .open property if it has one
    if ('open' in element) element.open = false;
    // or remove data-popable open attribute
    else element.removeAttribute('open');

    // Give the popable an 'close' event
    trigger('close', element);

    // Return state of element
    return false;
}

actions('[data-popable]', {
    locate: open,
    open:   open,
    close:  close,
    toggle: (element, button, buttons) => popables.has(element) ?
        close(element) :
        open(element, button, buttons)
});
