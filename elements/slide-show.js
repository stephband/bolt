
/**
<slide-show>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<slide-show>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="path/to/bolt/elements/slide-show.rolled.js"></script>
<slide-show loop autoplay>
    <img src="..." id="1" />
    <img src="..." id="2" />
</slide-show>
```
**/

import Privates from '../../fn/modules/privates.js';
import { wrap } from '../../fn/modules/maths/wrap.js';
import element from '../../dom/modules/element.js';
import events from '../../dom/modules/events.js';
import rect from '../../dom/modules/rect.js';
import create from '../../dom/modules/create.js';
import identify from '../../dom/modules/identify.js';
import { next, previous } from '../../dom/modules/traversal.js';
import { select } from '../../dom/modules/select.js';

const DEBUG = true;

const A      = Array.prototype;
const assign = Object.assign;
const define = Object.defineProperties;

const config = {
    path: window.customElementStylesheetPath || '',
    loopableSlideCount: 5,
    duration: 5
};

const defaults = {};

const onceOptions = {
    once: true
};

let scrollBarWidth;

function testScrollBarWidth() {
    if (scrollBarWidth) { return scrollBarWidth; }

    const inner = create('div', {
        style: 'display: block; width: auto; height: 60px; background: transparent;'
    });

    const test = create('div', {
        style: 'overflow: scroll; width: 30px; height: 30px; position: absolute; bottom: 0; right: 0; background: transparent; z-index: -1;',
        children: [inner]
    });

    document.body.appendChild(test);
    scrollBarWidth = test.offsetWidth - inner.offsetWidth;
    test.remove();
    return scrollBarWidth;
}


/* Shadow */

function activate(elem, shadow, prevLink, nextLink, active) {
    const elemRect   = rect(elem);
    const elemCentre = elemRect.left + elemRect.width / 2;
    const slides     = elem.children;

    let n = slides.length;
    let slide;

    while ((slide = slides[--n])) {
        const slideRect = rect(slide);
        if (!slideRect) { continue; }

        const left = slideRect.left;
        if (left <= elemCentre) {
            break;
        }
    }

    // If active slide is still the same one, ignore
    if (slide === active) {
        return active;
    }

    // Remove `on` class from currently highlighted links
    if (active){
        const id = active.dataset.id || active.id;

        select('[href="#' + id +'"]', elem.getRootNode())
        .forEach((node) => node.classList.remove('on'))

        select('[href="#' + id +'"]', shadow)
        .forEach((node) => node.classList.remove('on'))
    }

    // Change href of prev and next buttons
    const prevChild = previous(slide);
    if (prevChild) {
        prevLink.href = '#' + prevChild.id;
    }
    else {
        prevLink.removeAttribute('href');
    }

    const nextChild = next(slide);
    if (nextChild) {
        nextLink.href = '#' + nextChild.id;
    }
    else {
        nextLink.removeAttribute('href');
    }

    // Highlight links with `on` class
    const id = slide.dataset.id || slide.id;

    select('[href="#' + id +'"]', elem.getRootNode())
    .forEach((node) => node.classList.add('on'));

    select('[href="#' + id +'"]', shadow)
    .forEach((node) => node.classList.add('on'));

    // Return active slide
    return slide;
}

function reposition(elem, slot, id) {
    const first      = elem.firstElementChild;
    const firstRect  = rect(first);
    const slide      = elem.getRootNode().getElementById(id);
    const slideRect  = rect(slide);
    const scrollLeft = slideRect.left - firstRect.left;

    slot.style.scrollBehavior = 'auto';
    requestAnimationFrame(function () {
        slot.scrollLeft = scrollLeft;
        slot.style.scrollBehavior = '';
    });

    //console.log(slideRect.left, firstRect.left, slideRect.left - firstRect.left, slot.scrollLeft, slideRect);

    // Return active slide
    return slide;
}

function createGhost(slide) {
    const ghost = slide.cloneNode(true);
    ghost.dataset.id = ghost.id;
    //ghost.id = ghost.id + '-ghost';
    ghost.removeAttribute('id');
    return ghost;
}


/* Element */

element('slide-show', {
    /*
    Create a DOM of the form:

    <link rel="stylesheet" href="/source/bolt/elements/slide-show.css" />
    <slot></slot>
    <a class="prev-thumb thumb"></a>
    <a class="next-thumb thumb"></a>
    <nav>
        <a class="dot-thumb thumb"></a>
        <a class="dot-thumb thumb"></a>
    </nav>
    */

    template: function(elem, shadow) {
        const link = create('link',  { rel: 'stylesheet', href: config.path + 'slide-show.css' });
        const slot = create('slot');
        const prevNode = create('a', { class: 'prev-thumb thumb', part: 'prev' });
        const nextNode = create('a', { class: 'next-thumb thumb', part: 'next' });
        const nav  = create('nav');

        shadow.appendChild(link);
        shadow.appendChild(slot);
        shadow.appendChild(prevNode);
        shadow.appendChild(nextNode);
        shadow.appendChild(nav);
        
        // Create a dot link for each slide
        Array.from(elem.children).forEach((slide) => {
            const id = identify(slide);
            nav.appendChild(create('a', {
                class: 'dot-thumb thumb',
                part: 'dot',
                href: '#' + id,
                html: id
            }));
        });

        // Currently active slide
        var active = elem.firstElementChild;

        // Manage repositioning of slides when scroll is at rest
        var t = -Infinity;
        var loopId = null;
        var ignore = false;

        function update() {
            loopId = null;
            const id = active.dataset.id;

            // Active child is an original slide, not a copy: do nothing
            if (!id) { return; }

            // Realign the original slide as the active slide. Before we do, 
            // set an ignore flag so that this repositioning does not trigger
            // another activate when it resets scroll position
            ignore = true;
            active = reposition(elem, slot, id);
        }
    
        // Manage triggering of next slide on autoplay
        var autoId = null;
    
        function change() {
            autoId = null;

            // Move scroll position to next slide
            slot.scrollLeft += active.clientWidth;
        }

        events({ type: 'scroll', passive: true }, slot)
        .filter(() => {
            const result = !ignore;
            ignore = false;
            return result;
        })
        .each(function(e) {
            active = activate(elem, shadow, prevNode, nextNode, active);

            // If the last update was scheduled recently don't bother rescheduling
            if (e.timeStamp - t < 400) {
                return;
            }

            // Clear the previous scheduled timeout
            if (loopId) {
                clearTimeout(loopId);
            }

            // Set a new timeout and register the schedule time
            loopId = setTimeout(update, 600);
            t = e.timeStamp;

            if (autoId) {
                clearTimeout(autoId);
            }

            // Set a new autoplay timeout
            const duration = parseFloat(
                window.getComputedStyle(active).getPropertyValue('--slide-duration') || config.duration
            );

            autoId = setTimeout(change, duration * 1000);
        });

        assign(Privates(elem), {
            loop: function duplicate(loop) {
                if (!loop) {
                    // Todo: remove ghosts, reposition scroll when loop is 
                    // switched off
                    return;
                }

                // Where there are too few slides to loop we must 
                // duplicate them, sadly. Causes a bit of complexity.
                const children = elem.children;
                const original = Array.from(children);
                let n = 0;

                while(children.length < config.loopableSlideCount) {
                    // Stick one from the end on the front
                    children[0].before(createGhost(original[wrap(0, original.length, -(n + 1))]));
                    // Stick one from the front on the end
                    children[children.length - 1].after(createGhost(original[wrap(0, original.length, n)]));
                    ++n;
                }
            },

            auto: function auto(value) {
                if (autoId) {
                    clearTimeout(autoId);
                }

                if (!value) { return; }

                // Set a new autoplay timeout
                const duration = parseFloat(
                    window.getComputedStyle(active).getPropertyValue('--play-duration') || config.duration
                );

                autoId = setTimeout(change, duration * 1000);
            },

            slot: slot
        });
    },

    construct: function(elem, shadow) {
        
    },

    load: function (elem, shadow) {
        // Things haven't loaded and styled yet
        const prev = shadow.querySelector('.prev-thumb');
        const next = shadow.querySelector('.next-thumb');
        activate(elem, shadow, prev, next);
    },

    attributes: {
        /**
        loop=""
        Boolean attribute. Makes the slideshow behave as a continuous loop.
        **/
        loop: function(value) {
            const scope = Privates(this);
            scope.loop(value !== null);
        },

        /**
        autoplay=""
        Boolean attribute. 
        **/
        autoplay: function(value) {
            const scope = Privates(this);
            scope.auto(value !== null);
        }
    }
});
