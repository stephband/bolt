
/**
targetable

An element with a `targetable` attribute updates the browser location hash
with its `id` when scrolled into view.

When the location hash changes to be equal to a `targetable`'s id
the targetable gets the class `"located"`, and links that reference that
targetable via their `href` attribute get the class `"on"`.

Build a list of links that reference targetables and with a little style
you have a scrolling navigation:

```html
<style>
    a              { color: #888888; }
    a.on           { color: black; }
    article:target { ... }
</style>

<a href="#fish">...</a>
<a href="#chips">...</a>

<article targetable id="fish">...</article>
<article targetable id="chips">...</article>
```
**/

import by       from '../../fn/modules/by.js';
import get      from '../../fn/modules/get.js';
import location from '../../dom/modules/location.js';
import rect     from '../../dom/modules/rect.js';
import select   from '../../dom/modules/select.js';
import { isDocumentLink } from '../../dom/modules/node.js';

const assign   = Object.assign;
const selector = "[targetable], [data-targetable]";


/*
Utils
*/

function feedback(fn, value) {
    return function () {
        return (value = fn(value, ...arguments));
    };
}


/*
Links
*/

function selectLinks(id) {
    return select('a[href$="#' + id + '"]', document.body)
    .filter(isDocumentLink);
}

function addOn(node) {
    node.classList.add('target-on');
}

function removeOn(node) {
    node.classList.remove('target-on');
}

function locate(id) {
    if (!id) { return; }
    selectLinks(id).forEach(addOn);
}

function unlocate(id) {
    if (!id) { return; }
    selectLinks(id).forEach(removeOn);
}


/*
Scroll
*/

const origin = { left: 0, top: 0 };

function toData(element) {
    const box = rect(element);
    return {
        element: element,
        left:    box.left,
        top:     box.top,
        width:   box.width,
        height:  box.height
    };
}

function getTargetable(element) {
    const targetables = select(selector, element);

    if (!targetables.length) {
        return;
    }

    // Default to 0 for browsers without support
    const scrollPaddingLeft = parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    const scrollPaddingTop  = parseFloat(getComputedStyle(element).scrollPaddingTop)  || 0;

    const box = element === document.body || element === document.documentElement ?
        origin :
        rect(element) ;

    const boxes = targetables.map(toData).sort(by(get('top')));
    let  n = -1;
    let target;

    while (boxes[++n]
        && (boxes[n].left - box.left) < (scrollPaddingLeft + 1)
        && (boxes[n].top  - box.top)  < (scrollPaddingTop + 1) 
    ) {
        target = boxes[n].element;
    }

    return target;
}

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.
window.addEventListener('scroll', feedback(function update(previous, e) {
    const scrollable = e.target;
    const time = e.timeStamp / 1000;
    const target = getTargetable(scrollable.scrollingElement || scrollable);

    // Targetable in view has not changed
    if (target === previous) {
        return previous;
    }

    location.identifier = target ? target.id : '' ;
    return target;
}), true);


/*
Location
*/

location.on(feedback(function(previous, change) {
    console.log('Location', change);

    const identifier = change.identifier;

    if (!identifier) {
        console.log('Identifier has not changed');
        return previous;
    }

    unlocate(previous.identifier);
    locate(identifier);
    return assign(previous, change);
}, {}));
