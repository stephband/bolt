
/**
locateable

An element with a `data-locateable` (or `locateable`) attribute updates the
browser location hash with its `id` when scrolled into view.

When the location identifier changes to be equal to a `locateable`'s id links
that reference that locateable via their `href` attribute get the class `"target-on"`.

Build a list of links that reference locateables and with a little style
you have a scrolling navigation:

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

import by       from '../../fn/modules/by.js';
import observe  from '../../fn/observer/observe.js';
import create   from '../../dom/modules/create.js';
import features from '../../dom/modules/features.js';
import get      from '../../fn/modules/get.js';
import location from '../../literal/library/location.js';
import rect     from '../../dom/modules/rect.js';
import select   from '../../dom/modules/select.js';
import { isDocumentLink } from '../../dom/modules/node.js';

const assign = Object.assign;


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
    console.log('locate', id);
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

function getLocateable(/*element*/) {
    const body        = document.body;
    const element     = document.scrollingElement;
    const locateables = select(config.selector, body);

    if (!locateables.length) {
        return;
    }

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
        && (boxes[n].top  - origin.top) < (scrollPaddingTop + 1)
    ) {
        target = boxes[n].element;
    }

    return target;
}

const times = [];
let timer;

function update(/*element*/) {
    timer = undefined;

    if (times.length < 2) {
        times.length = 0;
        return;
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

    const target = getLocateable(/*element.scrollingElement || element*/);
    const id = target && target.id || '';

    // We use times.length elsewhere as an ignore flag. Make sure times.length
    // is set to 0 length before changing the hash.
    times.length = 0;

    if (location.identifier !== id) {
        location.identifier = id;
    }

    //console.log('scrollTop', document.scrollingElement.scrollTop, 'maxScrollEventInterval', config.maxScrollEventInterval.toFixed(3));
}


// Any call to replaceState or pushState in iOS opens the URL bar -
// disturbing at the best of times, nevermind mid-scroll. So probably
// best not update on scrolling on small iOS screens

// Capture scroll events in capture phase, as scroll events from elements
// other than document do not bubble.
var hashtime;

window.addEventListener('scroll', function scroll(e) {
    // Ignore the first scroll event following a hashchange. The browser sends a
    // scroll event even where a target cannot be scrolled to, such as a
    // navigation with position: fixed, for example. This can cause locateable
    // to recalculate again, and shift the target back to one fo the locateables,
    // where it should stay on the navigation element.
    const time = e.timeStamp / 1000;

    // Make sure this only happens once after a hashchange
    if (hashtime !== undefined) {
        // If we are not mid-scroll, and the latest hashchange was less than
        // 0.1s ago, ignore
        if (!times.length && hashtime > time - 0.1) {
            //console.log('scroll', 'ignored');
            hashtime = undefined;
            return;
        }

        hashtime = undefined;
    }

    times.push(time);

    // Update only when there is a maxScrollEventInterval second pause in scrolling
    clearTimeout(timer);
    timer = setTimeout(update, config.maxScrollEventInterval * 1000/*, e.target */);
}, captureOptions);

window.addEventListener('hashchange', function hashchange(e) {
    hashtime = e.timeStamp / 1000;
});


/*
Location
*/

observe('identifier', location)
.each(reducer(function(previous, identifier) {
    if (!identifier) {
        unlocate(previous);
        return;
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

    unlocate(previous);
    locate(identifier);
    return identifier;
}, {}));
/*
location.on(reducer(function(previous, change) {
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
/*
    unlocate(previous.identifier);
    locate(identifier);
    return assign(previous, change);
}, {}));
*/

/* Safari's not the messiah, he's a very naughty boy. */
if (!features.scrollBehavior) {
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
