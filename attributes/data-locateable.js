
/**
locateable

An element with a `data-locateable` attribute updates the browser location hash
with its `id` when scrolled into view.

When the location identifier changes to be equal to a `locateable`'s id links
that reference that locateable via their `href` attribute get the class
`"target-on"`. Build a list of links that reference locateables and with a
little style you have a scrolling navigation:

```html
<style>
    a              { color: #888888; }
    a.target-on    { color: black; }
    article:target { ... }
</style>

<a href="#fish">...</a>
<a href="#chips">...</a>

<article data-locateable id="fish">...</article>
<article data-locateable id="chips">...</article>
```
**/

// Old polyfill for Safari
//import '../../dom/scripts/scroll-behavior.js';

import by       from 'fn/by.js';
import get      from 'fn/get.js';
import Signal   from 'fn/signal.js';
import create   from 'dom/create.js';
import rect     from 'dom/rect.js';
import select   from 'dom/select.js';
import location from 'dom/location.js';
import { isDocumentLink } from 'dom/node.js';


/*
Config
*/

export const config = {
    onClass: 'target-on',
    selector: '[data-locateable]',
    maxScrollEventInterval: 0.25
};

const origin         = { left: 0, top: 0 };


/*
Locateables
*/

function selectLinks(hash) {
    return select('a[href$="' + hash + '"]', document.body)
    .filter(isDocumentLink);
}

function addOn(node) {
    node.classList.add('target-on');
}

function removeOn(node) {
    node.classList.remove('target-on');
}

function locate(hash) {
    if (!hash || hash === '#') return;
    selectLinks(hash).forEach(addOn);
}

function unlocate(hash) {
    if (!hash || hash === '#') return;
    selectLinks(hash).forEach(removeOn);
}

function toData(element) {
    const box = rect(element);
    box.element = element;
    return box;
}

function getBoxes(element) {
    const locateables = select(config.selector, document.body);
    if (!locateables.length) return;

    //const box = element === document.body || element === document.documentElement ?
    //    origin :
    //    rect(element) ;

    return locateables
        .map(toData)
        .sort(by(get('top')));
}

function getLocateable() {
    const element = document.scrollingElement;
    //const scrollPaddingLeft = parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    const scrollPaddingTop = parseFloat(getComputedStyle(element).scrollPaddingTop) || 0;
    const boxes = getBoxes(element);

    let  n = -1;
    let target;

    while (
        boxes[++n]
        //&& (boxes[n].left - box.left) < (scrollPaddingLeft + 1)
        //&& (boxes[n].top  - box.top)  < (scrollPaddingTop + 1)
        // Check whether scrollTop is negative - if it is the element is in
        // elastic overscroll and we compensate for that
        && (boxes[n].top - origin.top) < (scrollPaddingTop + 1 - (element.scrollTop < 0 ? element.scrollTop : 0))
    ) {
        target = boxes[n].element;
    }

    return target;
}


/*
Scroll
*/

let hashtime;
window.addEventListener('hashchange', (e) => hashtime = e.timeStamp / 1000);

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.
const captureOptions = { capture: true, passive: true };
let scrolltime;
window.addEventListener('scroll', (e) => {
    const time     = e.timeStamp / 1000;
    const interval = time - scrolltime;

    // Dynamically adjust maxScrollEventInterval to tighten it up,
    // imposing a baseline of 80ms (0.05s * 1.6)
    if (interval < config.maxScrollEventInterval) {
        config.maxScrollEventInterval = 1.6 * Math.max(interval, 0.05);
    }

    scrolltime = time;

    // Where hashtime is a number this scroll may be part of the automatic
    // scroll that follows a hashchange.
    if (hashtime !== undefined) {
        if (scrolltime - hashtime < config.maxScrollEventInterval) {
            // It is. Keep hashtime up to date with the latest scrolltime
            // associated with it.
            hashtime = scrolltime;

            // Don't perform locate by box position, as the active locateable
            // was already updated on observing the hashchange.
            return;
        }

        // This scroll is not related to a hashchange.
        hashtime = undefined;
    }

    // Changing the location object updates the current history entry
    const target = getLocateable();
    location.hash = target && target.id ?
        '#' + target.id :
        '' ;
}, captureOptions);


/*
React to location changes
*/

let previousHash;

Signal.observe(Signal.fromProperty('hash', location), (hash) => {
    unlocate(previousHash);
    previousHash = hash;
    if (!hash || hash === '#') return;
    locate(hash);
});


/* TODO: still necessary? Safari's not the messiah, he's a very naughty boy. */
if (!('scrollBehavior' in document.documentElement.style)) {
    console.log('Partial fill for scroll-padding');
    /* Safari does not respect scroll-padding unless scroll-snap is switched on,
       which is difficult on the :root or <body>. Instead, let's duplicate the
       elements with id and move them up relatively by one header height. */
    document.querySelectorAll('[data-locateable]').forEach(function(node) {
        const id = node.id;
        const anchor = create('a', { id, style: 'position: relative; height: 0px; min-height: 0; width: 100%; background-color: limegreen; top: calc(-1 * var(--header-height)); display: block;', 'data-locateable': true });
        node.id = id + '-(original)';
        node.removeAttribute('data-locateable');
        node.before(anchor);
    });
}
