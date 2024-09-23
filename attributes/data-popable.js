
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
*/

import events          from 'dom/events.js';
import isPrimaryButton from 'dom/is-primary-button.js';
import { actions }     from '../elements/button.js';

let mousedowns, focusins, focusouts, escapes;

function addOnClass(element) {
    element.classList.add('on');
}

function removeOnClass(element) {
    element.classList.remove('on');
}

export function open(element, buttons, target) {
    // This should never happen
    if (mousedowns) console.warn('For some reason mousedowns/focusins/escapes streams are still a thing. They should not be.');
    if (mousedowns) mousedowns.stop();
    if (focusins)   focusins.stop();
    if (focusouts)  focusouts.stop();
    if (escapes)    escapes.stop();

    mousedowns = events('mousedown', document)
    .filter(isPrimaryButton)
    .each((e) => {
        // If target is, or is in, element, ignore
        if (element === e.target || element.contains(e.target)) return;

        // If target is, or is in, one of the buttons, ignore
        if (buttons.find((button) => (button === e.target || button.contains(e.target)))) return;

        close(element, e.target, buttons);
    });

    focusins = events('focusin', document).each((e) => {
        // If focus moves outside data-popable, close it
        if (!element.contains(e.target)) close(element, e.target, buttons);
    });

    focusouts = events('focusout', element).each((e) => {
        // If focus moves outside data-popable, close it
        if (e.relatedTarget && !element.contains(e.relatedTarget)) close(element, e.target, buttons);
    });

    escapes = events('keydown', document).each(() => {
        // Escape key is pressed, close data-popable
        if (e.key === "Escape") close(element, null, buttons)
    });

    // Set data-popaable's .open property if it has one
    if ('open' in element) element.open = true;
    // or give data-popable an open attribute
    else element.setAttribute('open', '');

    // Add .on class to buttons
    buttons.forEach(addOnClass);

    // Focus the first element with class .active-focus
    const focusable = element.matches(focusableSelector) || element.querySelector(focusableSelector);
    if (focusable) {
        // The click that activated this target is not over yet, wait two frames
        // to focus the element. I don't know why we need two. Such is browser life.
        requestAnimationFrame(() => requestAnimationFrame(() => focusable.focus()));
    }
}

export function close(element, buttons, target) {
    if (mousedowns) mousedowns.stop();
    if (focusins)   focusins.stop();
    if (focusouts)  focusouts.stop();
    if (escapes)    escapes.stop();

    mousedowns = undefined;
    focusins   = undefined;
    focusouts  = undefined;
    escapes    = undefined;

    // Set data-popaable's .open property if it has one
    if ('open' in element) element.open = false;
    // or remove data-popable open attribute
    else element.removeAttribute('open');

    // Add .on class to buttons
    buttons.forEach(removeOnClass);
}

actions('[data-popable]', {
    open:   open,
    close:  close,
    toggle: (element, buttons, target) => (element.open || element.getAttribute('open') !== null) ?
        close(element, buttons, target) :
        open(element, buttons, target)
});
