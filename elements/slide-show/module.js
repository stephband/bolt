
import '../../../dom/polyfills/element.scrollto.js';

/** <slide-show>

Import `<slide-show>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="/bolt/elements/slide-show/module.js"></script>

<slide-show loop controls="navigation">
   <img src="../images/lyngen-4.png" id="1" draggable="false" />
</slide-show>

<slide-show loop controls="navigation">
   <img src="../images/lyngen-4.png" id="1" draggable="false" />
   <img src="../images/lyngen-2.png" id="2" draggable="false" />
   <img src="../images/lyngen-1.png" id="3" draggable="false" />
   <img src="../images/lyngen-3.png" id="4" draggable="false" />
</slide-show>
```

By default children of `<slide-show>` are interpreted as slides, but
elements with a `slot` attribute are not. Slides have default style of
`scroll-snap-align: center`. Apply `start` or `end` to change the alignment. 
**/

import id            from '../../../fn/modules/id.js';
import equals        from '../../../fn/modules/equals.js';
import last          from '../../../fn/modules/lists/last.js';
import overload      from '../../../fn/modules/overload.js';
import parseValue    from '../../../fn/modules/parse-value.js';
import delegate      from '../../../dom/modules/delegate.js';
import element       from '../../../dom/modules/element.js';
import events, { isPrimaryButton } from '../../../dom/modules/events.js';
import gestures      from '../../../dom/modules/gestures.js';
import rect          from '../../../dom/modules/rect.js';
import create        from '../../../dom/modules/create.js';
import identify      from '../../../dom/modules/identify.js';
import { next, previous } from '../../../dom/modules/traverse.js';
import { select }    from '../../../dom/modules/select.js';
import Distributor   from '../../../dom/modules/distributor.js';
import scrollends    from '../../../dom/modules/scrollends.js';
import { trigger }   from '../../../dom/modules/trigger.js';
import parseCSSValue from '../../../dom/modules/parse-length.js';
import Literal       from '../../../literal/modules/compile-string.js';

const DEBUG = false;//window.DEBUG === true;

const assign = Object.assign;
const define = Object.defineProperties;
const $      = Symbol('slide-show');

export const config = {
    duration: 8,
    trans: {
        'Previous': 'Previous',
        'Next': 'Next'
    }
};

const tick = Promise.resolve();

const parseTime = parseValue({
   's': id,
   'ms': (n) => n / 1000
});


/*
boolean(object, state)

Returns a boolean getter/setter property definition from an `object` with the 
shape:

```js
{
    // Required methods
    enable:  function() { ... }
    disable: function() { ... }
    // Optional state property returned by the getter
    state:   false
}
```

Pass the initial `state` parameter to set the initial state to `true` or 
`false`.
*/

function boolean(object, value) {
    let state = !!value;

    // Return a getter/setter property definition
    return {
        enumerable: true,

        get: function(value) {
            return object.state === undefined ?
                state :
                object.state ;
        },

        set: function(value) {
            if (state === !!value) { return; }
            state = !!value;
            return state ?
                object.enable() :
                object.disable() ;
        }
    };
}


/* View */

function scrollSmooth(element, slot, target) {
    const firstRect  = rect(element.firstElementChild);
    const targetRect = rect(target);

    if (!firstRect || !targetRect) { return; }

    // Move scroll position to next slide
    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'smooth'
    });
}

var promise = Promise.resolve();

function scrollAuto(element, slot, target) {
    // Check for visibility before measuring anything
    if (!element.offsetParent || !target.offsetParent) { return; }

    const firstRect  = rect(element.firstElementChild);
    const targetRect = rect(target);

    // Move scroll position to next slide. Behaviour option does not seem
    // to be respected so override style for safety.
    slot.style.setProperty('scroll-behavior', 'auto');

    promise = promise.then(() => {
        slot.scrollTo({
            top: slot.scrollTop,
            left: targetRect.left - firstRect.left,
            behavior: 'auto'
        });
    
        if (Math.abs(slot.scrollLeft - (targetRect.left - firstRect.left)) > 2) {
            slot.scrollLeft = targetRect.left - firstRect.left;
        }

        return new Promise(function(resolve, reject) {
            requestAnimationFrame(function() {
                slot.style.setProperty('scroll-behavior', '');
                setTimeout(resolve, 90);
            });
        })
    });
}

function getViewport(slot) {
    const slotRect     = rect(slot);
    const computed     = window.getComputedStyle(slot, null);
    const slotPadLeft  = parseCSSValue(computed.getPropertyValue('padding-left'));
    const slotPadRight = parseCSSValue(computed.getPropertyValue('padding-left'));
    const left         = slotRect.left + slotPadLeft;
    const right        = slotRect.left + slotRect.width - slotPadRight;
    return {
        left:   left,
        right:  right,
        centre: left + (right - left) / 2
    };
}

function getActiveFromHash(element) {
    const hash = window.location.hash;
    return hash && hash !== '#' && element.querySelector(hash);
}

function View(element, shadow, slot) {
    this.element   = element;
    this.shadow    = shadow;
    this.slot      = slot;
    this.active    = undefined;
    this.children  = [];

    this.changes = new Distributor((e) => {
        const items = e.target
           .assignedElements()
           // Ignore ghosts
           .filter((element) => !element.dataset.loopId);

        // Test whether mutation has really changed original slides, if not
        // it was probably an internal mutation adding or removing loop ghosts
        // Todo: modify the grid/scroll system to put loop ghosts in the shadow 
        // DOM
        if (equals(items, this.children)) {
            return;
        }

        // Guarantee all items have an id
        items.forEach(identify);

        return items;
    })
    .on((items) => this.update(items));

    this.actives = new Distributor((e) => {
        const ignore = this.ignore;
        this.ignore = false;

        // If ignore was true, ignore event.
        if (ignore) { return; }

        // Check for element visibility. There's little point in trying to do
        // anything while hidden
        if (element.offsetParent === null) {
            return;
        }

        return this.activate(e);
    })
    .on((active) => {
        const id = active.dataset.loopId || active.id;
        const activeId = this.active && (this.active.dataset.loopId || this.active.id);

        /** 
        'slide-activate'
        Emitted on a `slide-show` child when it become the active slide.
        **/
        if (id !== activeId) {
            this.original = active.id ? 
                active : 
                this.element.getRootNode().getElementById(id) ;

            trigger('slide-activate', this.original);
        }

        return this.active = active;
    });

    const autoplay   = new Autoplay(this, this.actives);
    const loop       = new Loop(element, shadow, this, autoplay, this.changes);
    const navigation = new Navigation(element, slot, this.changes, this.actives, shadow);
    const pagination = new Pagination(this, shadow);

    slot.addEventListener('slotchange', this.changes);
    slot.addEventListener('scroll', this.actives/*, { passive: false }*/);

    this.load = () => {
        // If we are at the very start of the loop on load, and it is 
        // not an original, reposition to be at the start of the 
        // originals
        if (DEBUG) {
            console.log('%c<slide-show>', 'color: #46789a; font-weight: 600;', 'load');
        }

        var resizeTimer;

        // Reposition everything on resize
        events('resize', window)
        .each(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.reposition(this.active || this.element.firstElementChild);
            }, 120);
        });

        window.addEventListener('fullscreenchange', (e) => {
            // If this slide-show was involved in the fullscreen change
            if (e.target === this.element || e.target.contains(this.element)) {
                this.actives.push(this.active);
            }
        });
        // Reposition everything on fullscreenchange.
        /*events('fullscreenchange', window)
        .each((e) => {
            // If this slide-show was involved in the fullscreen change
            if (e.target === this.element || e.target.contains(this.element)) {
                this.actives.push(this.active);
            }
        });*/

        const target = this.active || getActiveFromHash(this.element) || this.element.firstElementChild;
        if (!target) { return; }
        
        this.reposition(this.active || this.element.firstElementChild);
        this.actives.push(this.active);

        // This only happens where element load is before window load.
        //events('load', window)
        //.map(() => {
        //    const id = window.location.hash.replace(/^#/, '') || undefined;
        //    return id ?
        //        elem.querySelector('#' + id) :
        //        first ;
        //})
        //.each(function(target) {
        //    scrollAuto(elem, slot, target);
        //    // In case that doesn't trigger a scroll, like in FF
        //    active = activate(elem, shadow, prevNode, nextNode, active);
        //});
    };

    define(this, {
        autoplay:   boolean(autoplay),
        loop:       boolean(loop),
        navigation: boolean(navigation),
        pagination: boolean(pagination)
    });
}

assign(View.prototype, { 
    // Call to scroll to, which then activates a slide
    show: function(target) {
        scrollSmooth(this.element, this.slot, target);
    },

    activate: function(e) {
        // Cache viewport measurements until a 90ms gap in activates
        this.viewport = e.timeStamp - 90 > this.activateTime ?
            getViewport(this.slot) :
            (this.viewport || getViewport(this.slot)) ;

        this.activateTime = e.timeStamp;

        const view = this.viewport;
        const slides   = Array.from(this.element.children)
            .filter((child) => !child.hasAttribute('slot'));

        let n = slides.length;
        let slide;

        while ((slide = slides[--n])) {
            const slideRect = rect(slide);
            if (!slideRect) { continue; }

            // Todo: do we need webkit property here?
            const snap = window
                .getComputedStyle(slide, null)
                .getPropertyValue('scroll-snap-align');

            // Imagine a detection line half a slides' width to the right of
            // the left, the centre, or the right...
            const detection = (slideRect.width / 2) + (
                snap.endsWith('start') ? view.left :
                snap.endsWith('end')   ? view.right :
                view.centre
            );

            // ...and a slide registration position at it's corresponding left,
            // centre or right position. Safari reports 2 values for 
            // scroll-snap-align it's the second that is the inline axis value
            const position = (
                snap.endsWith('start') ? slideRect.left :
                snap.endsWith('end')   ? slideRect.right :
                slideRect.left + slideRect.width / 2
            );

            // If position has crossed the detection going left, we're in the money
            if (position <= detection) {
                break;
            }
        }

        // If active slide is still the same one, ignore
        if (slide === this.active) { return; }

        // Return active slide to distributor
        return slide;
    },

    reposition: function(target) {
        if (DEBUG) {
            console.log('%c<slide-show>', 'color: #46789a; font-weight: 600;', 'reposition');
        }

        this.ignore = true;
        scrollAuto(this.element, this.slot, target);

        // If scrollable, style accordingly. Currently this class simply updates 
        // the cursor to ew-resize
        if (this.slot.scrollWidth <= this.slot.clientWidth) {
            this.slot.classList.remove('scrollable')
        }
        else {
            this.slot.classList.add('scrollable');
        }

        this.active = target;
    },

    update: function(items) {
        const active   = this.active;
        const children = this.children;

        // Update the currently active slide
        if (!items[0]) {
            this.active = undefined;
        }
        else if (active) {
            if (!items.includes(this.active)) {
                // Change active to next existing slide from the old list
                let n = children.indexOf(this.active);
                while(children[++n] && !items.includes(children[n]));
                this.active = children[n];
            }
        }
        else {
            // Follow the current location hash if it refers to one of this 
            // slide-show's children 
            this.active = getActiveFromHash(this.element) || items[0];
        }

        this.slot.style.setProperty('--children-count', items.length);

        // Where there are fewer than 2 children, dont scroll
        this.slot.style.setProperty('overflow', items.length > 1 ? '' : 'hidden');
        this.children = items;

        /** 
        slidechildren
        
        Sent when children of a slide-show element (that are considered to be 
        'slides') are added or removed.
        **/
        tick.then(() => trigger('slidechildren', this.element));
    }
});


/* Autoplay */

function Autoplay(view, activates) {
    this.view = view;
    this.activates = activates;
}

assign(Autoplay.prototype, {
    enable: function() {
        this.activates.on(this.activateFn = (active) => this.activate(active));

        if (this.view.active) {
            this.activate(this.view.active);
        }

        // Expose state as loop view needs to know about autoplay
        this.state = true;
    },

    disable: function() {
        this.timer && clearTimeout(this.timer);
        this.activates.off(this.activateFn);
        this.state  = false;
    },

    change: function() {
        this.timer   = null;
        const target = next(this.view.active);

        // Have we reached the end?
        if (!target) { return; }

        scrollSmooth(this.view.element, this.view.slot, target);
    },

    activate: function(active) {
        if (!active) { return; }

        if (this.timer) {
            clearTimeout(this.timer);
        }

        // Set a new autoplay timeout
        const duration = parseTime(
            window
            .getComputedStyle(this.view.active)
            .getPropertyValue('--duration') || config.duration
        );

        this.timer = setTimeout(() => this.change(), duration * 1000);
    }
});


/* Loop */

function createLoopGhost(slide) {
    const ghost = slide.cloneNode(true);
    ghost.dataset.loopId = ghost.id;
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    return ghost;
}

function Loop(element, shadow, view, autoplay, slotchanges) {
    this.element     = element;
    this.shadow      = shadow;
    this.view        = view;
    this.autoplay    = autoplay;
    this.slotchanges = slotchanges;
}

assign(Loop.prototype, {
    enable: function() {
        const view     = this.view;
        const children = view.children;

        this.add(children);
        this.slotchanges.on(this.slotchangeFn = () => this.slotchange());
        this.scrollends = scrollends(this.view.slot).each((e) => {
            // Ignore scrollends while a finger is gesturing
            if (this.view.gesturing) { return; }
            this.update();
        });

        if (view.active) {
            this.view.reposition(view.active);
        }
    },

    slotchange: function() {
        const view     = this.view;
        const children = view.children;

        // Will trigger a slotchange
        this.remove();
        this.add(children);

        // This was originally AFTER the loop and nav stuff...
        if (view.active) {
            view.reposition(view.active);
        }
    },

    add: function() {
        const view     = this.view;
        const children = view.children;

        // To loop slides we need an extra couple on the front and an 
        // extra couple on the back to simulate the continuous loop
        this.before = Array.from(children).map(createLoopGhost);
        this.after  = Array.from(children).map(createLoopGhost);

        if (children.length) {
            children[0].before.apply(children[0], this.before);
            last(children).after.apply(last(children), this.after);    
        }
    },

    update: function() {
        const id = this.view.active.dataset.loopId;
    
        // Active child is an original slide, not a copy: do nothing
        if (!id) { return; }

        // Realign the original slide as the active slide.
        const target = this.element.getRootNode().getElementById(id);
        this.view.reposition(target);
        this.view.actives.push(target);
    },

    remove: function() {
        this.before.forEach((ghost) => ghost.remove());
        this.after.forEach((ghost) => ghost.remove());
        this.before = undefined;
        this.after = undefined;
    },
    
    disable: function() {
        this.remove();
        this.slotchanges.off(this.slotchangeFn);
        this.slotchangeFn = undefined;
        this.scrollends.stop();
    }
});


/* Navigation */

function Navigation(element, slot, changes, activates, parent) {
    this.element   = element;
    this.slot      = slot;
    this.changes   = changes;
    this.activates = activates;
    this.parent    = parent;
}

assign(Navigation.prototype, {
    enable: function() {
        this.previous = create('a', { part: 'previous', html: config.trans['Previous'] });
        this.next     = create('a', { part: 'next', html: config.trans['Next'] });
        this.parent.appendChild(this.previous);
        this.parent.appendChild(this.next);
        this.activates.on(this.activateFn = (active) => this.activate(active));
        this.changes.on(this.changesFn = (items) => this.slotchange(items));
    },

    disable: function() {
        this.previous.remove();
        this.next.remove();
        this.previous = undefined; 
        this.next = undefined;
        this.activates.off(this.activateFn);
        this.activateFn = undefined;
        this.changes.off(this.changesFn);
        this.changesFn = undefined;
    },

    activate: function(active) {
        // Change href of prev and next buttons, and hide them where there are 
        // no previous or next siblings. Href updates are purely a help for the 
        // end user, as we pick up clicks on part(previous) and part(next) 
        // before we interrogate link hrefs.

        if (this.slot.scrollWidth <= this.slot.clientWidth) {
            // Nowhere to scroll to
            this.previous.hidden = true;
            this.next.hidden = true;
            return;
        }

        const prevChild = previous(active);

        if (prevChild) {
            this.previous.hidden = false;
            this.previous.href = '#' + (prevChild.id || prevChild.dataset.loopId);
        }
        else {
            this.previous.hidden = true;
        }

        const nextChild = next(active);
        if (nextChild) {
            this.next.hidden = false;
            this.next.href = '#' + (nextChild.id || nextChild.dataset.loopId);
        }
        else {
            this.next.hidden = true;
        }

        /* console.log(
            'previous', prevChild && Array.prototype.indexOf.call(prevChild.parentNode.children, prevChild),
            'active', active && Array.prototype.indexOf.call(active.parentNode.children, active), 
            'next', nextChild && Array.prototype.indexOf.call(nextChild.parentNode.children, nextChild)
        ); */
    },

    slotchange: function(items) {
        this.previous.style.setProperty('display', items.length < 2 ? 'none' : '');
        this.next.style.setProperty('display', items.length < 2 ? 'none' : '');
    }
});


/* Pagination */

function Pagination(view, shadow) {
    this.view    = view;
    this.shadow  = shadow;
    this.slotchanges = view.changes;
    this.actives = view.actives;
}

function addPartOn(node) {
    node.part.add('on');
}

function removePartOn(node) {
    node.part.remove('on');
}

assign(Pagination.prototype, {
    enable: function() {
        this.pagination = create('nav', {
            part: 'pagination'
        });

        this.slotchange();
        this.shadow.appendChild(this.pagination);
        this.actives.on(this.activateFn = (active) => this.activate(active));
        this.slotchanges.on(this.slotchangeFn = (items) => this.slotchange(items));
    },

    disable: function() {
        this.pagination.remove();
        this.pagination = undefined;
        this.actives.off(this.activateFn);
        this.slotchanges.off(this.slotchangeFn);
    },

    slotchange: function(items) {
        const view     = this.view;
        const children = view.children;

        // Empty nav then create a dot link for each slide
        this.pagination.innerHTML = '';

        // Don't generate pagination when there are 0 or 1 slides
        if (items.length < 2) {
            return;
        }

        children.forEach((slide) => {
            // Id other content and create nav links for them
            const id = slide.id;
            this.pagination.appendChild(create('a', {
                part: view.active === slide ? 'link on' : 'link',
                href: '#' + id,
                html: id
            }));
        });
    },

    activate: function(active) {
        const shadow = this.shadow;

        // Remove `on` class from currently highlighted links
        if (this.active) {
            const id = this.active.dataset && this.active.dataset.loopId || this.active.id;
            select('[href="#' + id +'"]', shadow).forEach(removePartOn)
        }

        // Highlight links with `on` class
        const id = active.dataset.loopId || active.id;
        select('[href="#' + id +'"]', shadow).forEach(addPartOn);

        // Keep a note of currently active
        this.active = active;
    }
});


/* Element */

const processPointerEvents = overload((data, e) => e.type, {
    pointerdown: function(data, e) {
        // First event is touchstart or mousedown
        data.e0 = e;
        data.x0 = e.clientX;
        data.y0 = e.clientY;

        return data;
    },

    pointermove: function(data, e) {
        const e1 = e;
        const x1 = e.clientX;
        const y1 = e.clientY;

        // If the gesture is more vertical than horizontal, don't count it
        // as a swipe. Stop the stream and get out of here.
        if (!data.isSwipe) {
            if (Math.abs(x1 - data.x0) < Math.abs(y1 - data.y0)) {
                data.pointers.stop();
                return;
            }

            data.isSwipe = true;
            data.scrollLeft0 = data.view.slot.scrollLeft;
            data.view.slot.classList.add('gesturing');
            data.view.gesturing = true;
        }

        const dx = e.clientX - data.x0;
        data.view.slot.scrollLeft = data.scrollLeft0 - dx;

        return data;
    },

    default: function(data, e) {
        //data.view.clickSuppressTime = window.performance.now();
        data.view.clickSuppressTime = e.timeStamp;

        // Dodgy. If we simple remove the class the end of the gesture 
        // jumps.
        const scrollLeft = data.view.slot.scrollLeft;
        data.view.slot.classList.remove('gesturing');
        data.view.slot.scrollLeft = scrollLeft;
        data.view.gesturing  = false;

        return data;
    }
});

const lifecycle = {
    // Get path to dir of this module
    stylesheet:
        // Support the old path system baked into the Nendaz project
        window.customElementStylesheetPath && window.customElementStylesheetPath + 'slide-show.shadow.css' ||
        window.elementSlideShowStylesheet ||
        import.meta.url.replace(/\/[^\/]*([?#].*)?$/, '/') + 'shadow.css',

    /**
    Create a shadow DOM containing:

    ```html
    <!- The main scrollable grid --->
    <slot part="grid"></slot>
    <!-- With controls="navigation" -->
    <a part="previous" href=""></a>
    <a part="next" href=""></a>
    <!-- With controls="pagination" -->
    <nav>
        <a part="link" href="#id"></a>
        <a part="link" href="#id"></a>
    </nav>
    <!-- With overflow script -->
    <slot name="overflow"></slot>
    ```
    **/

    construct: function(shadow) {
        const slot     = create('slot', { part: 'grid' });
        // A place to put optional UI (fullscreen close buttons etc)
        const optional = create('slot', { name: 'optional', part: 'optional' });
        // A place to put overflow menu stuff
        const overflow = create('slot', { name: 'overflow', part: 'overflow' });

        shadow.append(slot, optional, overflow);

        const elem = this;
        const view = this[$] = new View(this, shadow, slot);
        view.clickSuppressTime = -Infinity;

        // Hijack links to slides to avoid the document scrolling, (but make 
        // sure they go in the history anyway, or not)
        events('click', shadow)
        //.filter((e) => !!e.target.href)
        .filter(isPrimaryButton)
        .each(delegate({
            // Previous and next links may not have hrefs if loop is on, and
            // they also cannot reference ghosts. We hijack them and launch
            // previous/next.
            '[href][part="previous"]': function(link, e) {
                // Show previous whether a ghost or not
                view.show(previous(view.active));
                e.preventDefault();
            },
            
            '[href][part="next"]': function(link, e) {
                // Show next whether a ghost or not
                view.show(next(view.active));
                e.preventDefault();
            },

            // Pagination links alsways reference non-ghost slides
            '[href]': function(link, e) {
                const id     = link.hash && link.hash.replace(/^#/, '');
                const target = elem.getRootNode().getElementById(id);
                if (elem.contains(target) && elem !== target) {
                    view.show(target);
                    e.preventDefault();
                }
            }
        }));

        // Prevent default on immediate clicks after a gesture, and don't let 
        // them out: this is a gesture not a click
        events('click', shadow)
        .each(function(e) {
            const time = window.performance.now();
            if (time - view.clickSuppressTime < 120) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Enable single finger scroll on mouse devices. Bad idea, but users
        // tend to want it.
        gestures({ threshold: '0.25rem', device: 'mouse' }, shadow)
        .filter(() => view.children.length > 1)
        .each((pointers) =>
            pointers.reduce(processPointerEvents, { view, pointers })
        );
    },

    load: function (shadow) {
        const view = this[$];
        view.load();
    }
};

const properties = {
    active: {
        /**
        .active
        Returns the currently active child element - the current slide.

        ```js
        const activeSlideElement = slideshow.active;
        ```

        May be set to one of the child elements, or to the id of one of the 
        child elements. Setting this property causes the slide to change.

        ```js
        slideshow.active = 'slide-1';
        ```
        **/

        set: function(id) {
            // Accept a child node, get its id
            const child = typeof id !== 'object' ?
                this.querySelector('#' + (/^\d/.test((id + '')[0]) ?
                    '\\3' + (id + '')[0] + ' ' + (id + '').slice(1) :
                    id)
                ) : id ;

            if (!child) {
                throw new Error('Cannot set active – not a child of slide-show');
            }

            this[$].show(child);
        },

        get: function() {
            return this[$].original;
        }
    },

    autoplay: {
        /**
        autoplay=""
        Boolean attribute. When present the slide-show activates the next 
        slide after a pause. The pause duration may be set in CSS via the 
        `--duration` variable.
        **/

        attribute: function(value) {
            // Delegate to property
            this.autoplay = (value !== null);
        },

        /**
        .autoplay
        Boolean property. When `true` the slide-show activates the next 
        slide after a pause. The pause duration may be set in CSS via the 
        `--duration` variable.
        **/

        set: function(state) {
            this[$].autoplay = state;
        },

        get: function() {
            return this[$].autoplay;
        }
    },

    controls: {
        /**
        controls=""

        Treated as a boolean or a token list. If it is present but empty
        all tokens are considered to be true. Otherwise, possible tokens are:
        
        <strong>navigation</strong> enables previous and next buttons. The 
        buttons may be styled with `::part(previous)` and `::part(next)` 
        selectors. To change their text content, import and modify 
        `config.trans`:

        ```js
        import { config } from './bolt/elements/slide-show/module.js';
        config.trans['Previous'] = 'Précédent';
        config.trans['Next']     = 'Suivant';
        ```

        <strong>pagination</strong> enables a row of pagination dots. The
        dots may be styled with `::part(page)`.
        **/

        attribute: function(value) {
            const view = this[$];

            // If value is a string of tokens
            if (typeof value === 'string' && value !== '') {
                const state = value.split(/\s+/);
                view.navigation = state.includes('navigation');
                view.pagination = state.includes('pagination');
            }
            else {
                const state = value !== null;
                view.navigation = state;
                view.pagination = state;
            }
        }
    },

    loop: {            
        /**
        loop=""
        Boolean attribute. Makes the slideshow behave as a continuous loop.
        **/

        attribute: function(value) {
            // Delegate to property
            this.loop = (value !== null);
        },

        /**
        .loop
        Boolean property. Makes the slideshow behave as a continuous loop.
        **/

        set: function(state) {
            this[$].loop = state;
        },

        get: function() {
            return this[$].loop;
        }
    }
};

export default element('slide-show', lifecycle, properties);
