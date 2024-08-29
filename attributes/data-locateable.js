
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

import '../../dom/scripts/scroll-behavior.js';

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

const captureOptions = {
    capture: true,
    passive: true
};

/*
Features
*/

const supportsScrollBehavior = 'scrollBehavior' in document.documentElement.style;


/*
Utils
*/

function reducer(fn, value) {
    return function () {
        return (value = fn(value, ...arguments));
    };
}


/*
Links
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




/*
function updateTarget(url) {
    const href = window.location.href;

    // Replace the current location with the new one
    window.history.replaceState(window.history.state, document.title, url);

// SAFARI is jumping around because of this
    // Move forward to the old url and back to the current location, causing
    // :target selector to update and a popstate event.
//    window.history.pushState(window.history.state, document.title, href);
//    window.history.back();
}
*/



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

function getLocateable() {
    const body        = document.body;
    const element     = document.scrollingElement;
    const locateables = select(config.selector, body);

    if (!locateables.length) return;

    // Default to 0 for browsers without support
    //const scrollPaddingLeft = parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    const scrollPaddingTop  = parseFloat(getComputedStyle(element).scrollPaddingTop)  || 0;

    //const box = element === document.body || element === document.documentElement ?
    //    origin :
    //    rect(element) ;

    const boxes = locateables
        .map(toData)
        .sort(by(get('top')));

    let  n = -1;
    let target;

    while (
        boxes[++n]
        //&& (boxes[n].left - box.left) < (scrollPaddingLeft + 1)
        //&& (boxes[n].top  - box.top)  < (scrollPaddingTop + 1)
        && (boxes[n].top - origin.top) < (scrollPaddingTop + 1)
    ) {
        target = boxes[n].element;
    }

    return target;
}

const times = [];


// Any call to replaceState or pushState in iOS opens the URL bar -
// disturbing at the best of times, nevermind mid-scroll. So probably
// best not update on scrolling on small iOS screens

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.
var hashtime = 0;

window.addEventListener('hashchange', (e) => hashtime = e.timeStamp / 1000);

window.addEventListener('scroll', (e) => {
    // Ignore the first scroll event following a hashchange. The browser sends a
    // scroll event even where a target cannot be scrolled to, such as a
    // navigation with position: fixed, for example. This can cause locateable
    // to recalculate again, and shift the target back to one fo the locateables,
    // where it should stay on the navigation element.
    const time = e.timeStamp / 1000;

    // Make sure this check only happens once after a hashchange
    if (hashtime !== undefined) {
        // If we are not mid-scroll, and the latest hashchange was less than
        // 0.1s ago, ignore
        if (hashtime > time - 0.1) {
            hashtime = undefined;
            return;
        }

        hashtime = undefined;
    }

    // Record scroll times
    times.push(time);

    // Dynamically adjust maxScrollEventInterval to tighten it up,
    // imposing a baseline of 60ms (0.0375s * 1.6)
    let n = times.length, interval = 0;
    while (--n) {
        const t = times[n] - times[n - 1];
        interval = t > interval ? t : interval;
    }

    interval = interval < 0.0375 ? 0.0375 : interval ;
    config.maxScrollEventInterval = 1.6 * interval;

    // Changing the location object updates the current history entry
    const target = getLocateable();
    location.hash = target && target.id ?
        '#' + target.id :
        '' ;
}, captureOptions);



/*
Location
*/

let previousHash;

Signal.observe(Signal.fromProperty('hash', location), (hash) => {
    unlocate(previousHash);
    previousHash = hash;
    if (!hash || hash === '#') return;
    locate(hash);
});
















/* TODO: still necessary? Safari's not the messiah, he's a very naughty boy. */
if (!supportsScrollBehavior) {
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
