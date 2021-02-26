
/**
targetable

An element with a `data-targetable` (or `targetable`) attribute updates the 
browser location hash with its `id` when scrolled into view.

When the location identifier changes to be equal to a `targetable`'s id links 
that reference that targetable via their `href` attribute get the class `"target-on"`.

Build a list of links that reference targetables and with a little style
you have a scrolling navigation:

```html
<style>
    a              { color: #888888; }
    a.target-on    { color: black; }
    article:target { ... }
</style>

<a href="#fish">...</a>
<a href="#chips">...</a>

<article data-targetable id="fish">...</article>
<article data-targetable id="chips">...</article>
```
**/

import '../../dom/scripts/scroll-behavior.js';

import by       from '../../fn/modules/by.js';
import get      from '../../fn/modules/get.js';
import location from '../../dom/modules/location.js';
import rect     from '../../dom/modules/rect.js';
import select   from '../../dom/modules/select.js';
import { isDocumentLink } from '../../dom/modules/node.js';

const assign = Object.assign;


/*
Config
*/

export const config = {
    onClass: 'target-on',
    selector: '[data-targetable]',
    maxScrollEventInterval: 0.25
};

const captureOptions = {
    capture: true,
    passive: true
};


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
    const targetables = select(config.selector, element);

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

/*
let animateScrollTime = 0;
let userScrollTime = 0;
*/
const times = [];
let timer;

function update(element) {
    timer = undefined;

    const target = getTargetable(element.scrollingElement || element);
    const id = target && target.id || '';

    if (location.identifier !== id) {
        location.identifier = id;
    }

    // Dynamically adjust maxScrollEventInterval to tighten it up,
    // imposing a baseline of 60ms (0.0375s * 1.6)
    let n = times.length, interval = 0;
    while (--n) {
        const t = times[n] - times[n - 1];
        interval = t > interval ? t : interval;
    }
    interval = interval < 0.0375 ? 0.0375 : interval ;
    config.maxScrollEventInterval = 1.6 * interval;
    times.length = 0;

    console.log('scrollTop', document.scrollingElement.scrollTop, 'maxScrollEventInterval', config.maxScrollEventInterval.toFixed(3));
}

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.
var hashtime;

window.addEventListener('scroll', function scroll(e) {
    // Ignore the first scroll event following a hashchange. The browser sends a 
    // scroll event even where a target cannot be scrolled to, such as a 
    // navigation with position: fixed, for example. This can cause targetable
    // to recalculate again, and shift the target back to one fo the targetables,
    // where it should stay on the navigation element.
    const time = e.timeStamp / 1000;

    if (hashtime !== undefined) {
        hashtime = undefined;
        if (hashtime > time - 0.1) {
            return;
        }
    }

    times.push(time);

    // Update only when there is a maxScrollEventInterval second pause in scrolling
    clearTimeout(timer);
    timer = setTimeout(update, config.maxScrollEventInterval * 1000, e.target);
}, captureOptions);

// other than document do not bubble.
window.addEventListener('hashchange', function hashchange(e) {
    hashtime = e.timeStamp / 1000;
});


/*
Location
*/

location.on(feedback(function(previous, change) {
    const identifier = change.identifier;

    if (identifier === undefined) {
        return previous;
    }

    //const time = change.time;

    // Dodgy heuristics
    /*
    if (time - userScrollTime > config.maxScrollEventInterval) {
        // If we were not already scrolling we want to ignore scroll
        // updates for a short time until the automatic scroll settles
        animateScrollTime = change.time + config.minScrollAnimationDuration;
    }
    */

    unlocate(previous.identifier);
    locate(identifier);
    return assign(previous, change);
}, {}));
