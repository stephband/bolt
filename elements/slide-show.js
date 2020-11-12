
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

// Polyfill Safari's lack of smooth scrolling via .scrollTo()
import '../../dom/polyfills/element.scrollto.js';

import id from '../../fn/modules/id.js';
import Privates from '../../fn/modules/privates.js';
import { wrap } from '../../fn/modules/maths/wrap.js';
import parseValue from '../../fn/modules/parse-value.js';
import element from '../../dom/modules/element.js';
import events from '../../dom/modules/events.js';
import rect from '../../dom/modules/rect.js';
import create from '../../dom/modules/create.js';
import identify from '../../dom/modules/identify.js';
import { next, previous } from '../../dom/modules/traversal.js';
import { select } from '../../dom/modules/select.js';
import { isPrimaryButton } from '../../dom/modules/events.js';

const DEBUG = true;

const A      = Array.prototype;
const assign = Object.assign;
const define = Object.defineProperties;

const config = {
    path: window.customElementStylesheetPath || '',
    loopableSlideCount: 5,
    duration: 8
};

const defaults = {};

const onceOptions = {
    once: true
};

const parseTime = parseValue({
   's': id,
   'ms': (n) => n / 1000
});


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
        .forEach((node) => node.part.remove('active-link'))
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
    .forEach((node) => node.part.add('active-link'));

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

function scrollSmooth(elem, slot, target) {
    const firstRect  = rect(elem.firstElementChild);
    const targetRect = rect(target);

    // Move scroll position to next slide
    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'smooth'
    });
    //slot.scrollLeft = targetRect.left - firstRect.left;
}

function scrollAuto(elem, slot, target) {
    const firstRect  = rect(elem.firstElementChild);
    const targetRect = rect(target);

    // Move scroll position to next slide. Behavior property does not seem
    // to be respected so override style for safety.
    slot.style['scroll-behavior'] = 'auto';
    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'auto'
    });
    requestAnimationFrame(function() {
        slot.removeAttribute('style');            
    });
}

function reposition(elem, slot, id) {
    const target = elem.getRootNode().getElementById(id);
    scrollAuto(elem, slot, target)
    return target;
}


/* Control */

function autoplay(active, change, autoId) {
    if (autoId) {
        clearTimeout(autoId);
    }

    // Set a new autoplay timeout
    const duration = parseTime(
        window
        .getComputedStyle(active)
        .getPropertyValue('--slide-duration') || config.duration
    );

    return setTimeout(change, duration * 1000);
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
        <a part="link"></a>
        <a part="link"></a>
    </nav>
    */

    template: function(elem, shadow) {
        const link     = create('link', { rel: 'stylesheet', href: config.path + 'slide-show.css' });
        const slot     = create('slot');
        const prevNode = create('a', { class: 'prev-thumb thumb', part: 'prev' });
        const nextNode = create('a', { class: 'next-thumb thumb', part: 'next' });
        const nav      = create('nav');

        shadow.appendChild(link);
        shadow.appendChild(slot);
        shadow.appendChild(prevNode);
        shadow.appendChild(nextNode);
        shadow.appendChild(nav);
        
        // Create a dot link for each slide
        Array.from(elem.children).forEach((slide) => {
            const id = identify(slide);
            nav.appendChild(create('a', {
                part: 'link',
                href: '#' + id,
                html: id
            }));
        });

        // Currently active slide
        const first   = elem.firstElementChild;
        const firstId = identify(first);
        var active = first;

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
            const target = next(active) || elem.firstElementChild;
            scrollSmooth(elem, slot, target);
        }

        events({ type: 'scroll', passive: true }, slot)
        .filter((e) => {
            const result = !ignore;
            ignore = false;
            return result;
        })
        .each(function(e) {
            active = activate(elem, shadow, prevNode, nextNode, active);

            // If the last update was scheduled recently don't bother rescheduling
            if (e.timeStamp - t < 180) {
                return;
            }

            // Clear the previous scheduled timeout
            if (loopId) {
                clearTimeout(loopId);
            }

            // Set a new timeout and register the schedule time
            loopId = setTimeout(update, 240);
            t = e.timeStamp;

            autoId = autoplay(active, change, autoId);
        });

        events('resize', window)
        .each(function() {
            active = reposition(elem, slot, active.id);
        });

        // Hijack links to slides to avoid the document scrolling, but make 
        // sure they go in the history anyway.
        events('click', shadow)
        .filter((e) => !!e.target.href)
        .filter(isPrimaryButton)
        .each(function(e) {
            const id     = e.target.hash && e.target.hash.replace(/^#/, ''); 
            const target = elem.getRootNode().getElementById(id);

            if (!target) {
                console.warn('<slide-show> links to non-existent id "' + id + '"');
                return;
            }

            scrollSmooth(elem, slot, target);
            e.preventDefault();
            window.history.pushState({}, '', '#' + id);
        });

        // 
        events('load', window)
        .map(() => {
            const id = window.location.hash.replace(/^#/, '') || undefined;
            return id ?
                elem.querySelector('#' + id) :
                first ;
        })
        .each(function(target) {
            scrollAuto(elem, slot, target);
            // In case that doesn't trigger a scroll, like in FF
            active = activate(elem, shadow, prevNode, nextNode, active);
        });

        assign(Privates(elem), {
            load: function(elem, shadow) {
                const current = activate(elem, shadow, prevNode, nextNode, active);

                // If we are at the very start of the loop on load, and it is 
                // not an original, reposition to be at the start of the 
                // originals
                if (current === elem.firstElementChild && !current.id) {
                    ignore = true;
                    active = reposition(elem, slot, firstId);
                    active = activate(elem, shadow, prevNode, nextNode, current); 
                }
                else {
                    active = current;
                }
            },

            loop: function duplicate(loop) {
                if (!loop) {
                    // Todo: remove ghosts, reposition scroll when loop is 
                    // switched off
                    return;
                }

                // To loop slides we need an extra couple on the front and an 
                // extra couple on the back to simulate the continuous loop
                const children = elem.children;
                const original = Array.from(children);
                let n = -1;
                while(++n < 2) {
                    // Stick one from the end on the front
                    children[0].before(createGhost(original[wrap(0, original.length, -(n + 1))]));
                    // Stick one from the front on the end
                    children[children.length - 1].after(createGhost(original[wrap(0, original.length, n)]));
                }
            },

            autoplay: function(value) {
                // When value is false stop autoplaying
                if (!value) {
                    autoId && clearTimeout(autoId);
                    return;
                }

                autoId = autoplay(active, change, autoId);
            }
        });
    },

    construct: function(elem, shadow) {
        
    },

    load: function (elem, shadow) {
        const scope = Privates(this);
        scope.load(elem, shadow);
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
            scope.autoplay(value !== null);
        }
    }
});
