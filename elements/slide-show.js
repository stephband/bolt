
import '../../dom/polyfills/element.scrollto.js';

/** <slide-show>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<slide-show>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="bolt/elements/slide-show.js"></script>

<slide-show controls="navigation">
   <img src="../images/lyngen-4.png" id="1" draggable="false" />
   <img src="../images/lyngen-2.png" id="2" draggable="false" />
   <img src="../images/lyngen-1.png" id="3" draggable="false" />
   <img src="../images/lyngen-3.png" id="4" draggable="false" />
</slide-show>
```

By default each element inside `<slide-show>` is interpreted as a slide, but
elements with a `slot` attribute are ignored. This allows for the insertion of 
fullscreen close buttons and the like.
**/

import id         from '../../fn/modules/id.js';
import equals     from '../../fn/modules/equals.js';
import last       from '../../fn/modules/lists/last.js';
import parseValue from '../../fn/modules/parse-value.js';
import element    from '../../dom/modules/element.js';
import events, { isPrimaryButton } from '../../dom/modules/events.js';
import gestures   from '../../dom/modules/gestures.js';
import rect       from '../../dom/modules/rect.js';
import create     from '../../dom/modules/create.js';
import identify   from '../../dom/modules/identify.js';
import { next, previous } from '../../dom/modules/traverse.js';
import { select } from '../../dom/modules/select.js';
import Distributor from '../../dom/modules/distributor.js';


const DEBUG = true;

const assign = Object.assign;
const define = Object.defineProperties;
const $      = Symbol('');

const config = {
    path: window.customElementStylesheetPath || '',
    loopableSlideCount: 5,
    duration: 8
};

const parseTime = parseValue({
   's': id,
   'ms': (n) => n / 1000
});


/*
boolean(object, value)

Takes an object and returns a getter/setter property definition. The object
must have the methods `.enable()` and `.disable()`, which are called by the 
setter, and may have a property `.state`, which is returned by the getter.
*/

function boolean(object, value) {
    let state = !!value;

    return {
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

    // Move scroll position to next slide
    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'smooth'
    });
}

function scrollAuto(element, slot, target) {
    const firstRect  = rect(element.firstElementChild);
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

function View(element, shadow, slot) {
    this.element  = element;
    this.shadow   = shadow;
    this.slot     = slot;
    this.active   = undefined;
    this.children = [];

    this.changes = Distributor((e) => {
        const items = e.target
           .assignedElements()
           .filter((element) => !element.dataset.id);
        
        // Test whether mutation has really changed original slides, if not
        // it was probably an internal mutation adding or removing loop ghosts
        if (equals(items, this.children)) {
            return;
        }

        // This was originally AFTER the loop and nav stuff...
        if (this.active) {
            Promise.resolve(() => {
                loop.ignore = true;
                this.reposition(this.active.id);
            });
        }

        return items;
    })
    .on((items) => this.update(items));
    
    this.actives = new Distributor((e) => {
        const result = loop.ignore;
        loop.ignore = false;

        // If ignore was true, ignore event
        if (result) {
            return;
        }

        return this.activate(this.active);
    });

    const autoplay   = new Autoplay(this);
    const loop       = new Loop(this, autoplay);
    const navigation = new Navigation(this, shadow);
    const pagination = new Pagination(this, shadow);

    slot.addEventListener('slotchange', this.changes);
    slot.addEventListener('scroll', this.actives);

    this.load = () => {
        this.actives.trigger(this.active);

        // If we are at the very start of the loop on load, and it is 
        // not an original, reposition to be at the start of the 
        // originals
        if (this.active === this.firstElementChild && !this.active.id) {
            loop.ignore = true;
            this.reposition(this.active.id);
            this.activate(this.active); 
        }
        
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
    activate: function() {
        const elem       = this.element;
        const elemRect   = rect(elem);
        const elemCentre = elemRect.left + elemRect.width / 2;
        const slides     = Array.from(elem.children).filter((element) => !element.hasAttribute('slot'));

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
        if (slide === this.active) { return; }

        // Return active slide to distributor
        return (this.active = slide);
    },

    reposition: function(id) {
        const target = this.element.getRootNode().getElementById(id);
        scrollAuto(this.element, this.slot, target);
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
            this.active = items[0];
            // Is this needed?
            identify(this.active);
        }

        this.children = items;
        //console.log(slot, children.length);
        console.log(this.element);
        this.element.style.setProperty('--slides-count', children.length);
    }
});


/* Autoplay */

function Autoplay(view) {
    this.view = view;
}

assign(Autoplay.prototype, {
    enable: function() {
        this.change = () => {
            this.timer   = null;
            const target = next(this.view.active);

            // Have we reached the end?
            if (!target) { return; }

            scrollSmooth(this.view.element, this.view.slot, target);
        };

        this.view.active && this.schedule();

        // Expose state as loop view needs to know about autoplay
        this.state = true;
    },

    disable: function() {
        this.timer && clearTimeout(this.timer);
        this.state = false;
    },

    change: function() {
        this.timer   = null;
        const target = next(this.view.active);

        // Have we reached the end?
        if (!target) { return; }

        scrollSmooth(this.view.element, this.view.slot, target);
    },

    cue: function() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        // Set a new autoplay timeout
        const duration = parseTime(
            window
            .getComputedStyle(this.view.active)
            .getPropertyValue('--slide-duration') || config.duration
        );

        this.timer = setTimeout(() => this.change(), duration * 1000);
    }
});


/* Loop */

function createLoopGhost(slide) {
    const ghost = slide.cloneNode(true);
    ghost.dataset.id = ghost.id;
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    return ghost;
}

function Loop(view, autoplay) {
    this.view     = view;
    this.shadow   = view.shadow;
    this.changes  = view.changes;
    this.actives  = view.actives;
    this.autoplay = autoplay;
}

assign(Loop.prototype, {
    enable: function() {
        const view     = this.view;
        const children = view.children;

        var t = -Infinity;

        this.slotchange = (children) => {
            // Will trigger a slotchange
            this.remove();
            this.add(children);
        };

        this.activate = (active) => {
            // If the last update was scheduled recently don't bother rescheduling
            if (window.performance.now() - t < 180) {
                return;
            }
        
            // Clear the previous scheduled timeout
            if (this.timer) {
                clearTimeout(this.timer);
            }

            // If autoplay is off don't schedule
            if (!this.autoplay.state) {
                return;
            }

            // Set a new timeout and register the schedule time
            this.timer = setTimeout(() => this.update(), 240);
            t = window.performance.now();

            if (active) {
                this.autoplay.cue();
            }
        }

        this.add(children);

        view.changes.on(this.slotchange);
        view.actives.on(this.activate);

        if (view.active) {
            this.ignore = true;
            view.reposition(view.active.id);
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
        console.log('Loop.update()')
        this.timer = null;
        const id = this.view.active.dataset.id;
    
        // Active child is an original slide, not a copy: do nothing
        if (!id) { return; }
    
        // Realign the original slide as the active slide. Before we do, 
        // set an ignore flag so that this repositioning does not trigger
        // another activate when it resets scroll position
        this.ignore = true;
        this.view.reposition(id);
    },

    remove: function() {
        this.before.forEach((ghost) => ghost.remove());
        this.after.forEach((ghost) => ghost.remove());
        this.before = undefined;
        this.after = undefined;
        clearTimeout(this.timer);
        this.timer = null;
    },
    
    disable: function() {
        this.remove();
        this.changes.off(this.slotchange);
        this.actives.off(this.activate);
    }
});


/* Navigation */

function Navigation(view, parent) {
    this.view    = view;
    this.changes = view.changes;
    this.actives = view.actives;
    this.parent  = parent;
}

assign(Navigation.prototype, {
    enable: function(children) {
        const view = this.view;
        this.previous = create('a', { part: 'previous', class: 'prev-thumb thumb' });
        this.next     = create('a', { part: 'next', class: 'next-thumb thumb' });
        this.parent.appendChild(this.previous);
        this.parent.appendChild(this.next);
        view.actives.on(this.activateFn = (active) => this.activate(active));
    },

    disable: function() {
        const view = this.view;
        this.previous.remove();
        this.next.remove();
        this.previous = undefined; 
        this.next = undefined;
        view.actives.off(this.activateFn);
    },
    
    activate: function(active) {
        // Change href of prev and next buttons
        const prevChild = previous(active);
        if (prevChild && prevChild.id) {
            this.previous.href = '#' + prevChild.id;
        }
        else {
            this.previous.removeAttribute('href');
        }

        const nextChild = next(active);
        if (nextChild && nextChild.id) {
            this.next.href = '#' + nextChild.id;
        }
        else {
            this.next.removeAttribute('href');
        }
    }
});


/* Pagination */

function Pagination(view, parent) {
    this.view    = view;
    this.parent  = parent;
    this.changes = view.changes;
    this.actives = view.actives;
}

assign(Pagination.prototype, {
    enable: function() {
        const view     = this.view;
        const children = view.children;
console.trace('page')
        this.pagination = create('nav');

        // Empty nav then create a dot link for each slide
        //nav.innerHTML = '';
        children.forEach((slide) => {
           // Id other content and create nav links for them
           const id = identify(slide);
           this.pagination.appendChild(create('a', {
               part: 'link',
               href: '#' + id,
               html: id
           }));
        });

        this.parent.appendChild(this.pagination);
        view.actives.on();
        view.changes.on();
    },

    disable: function() {
        const view = this.view;
        this.pagination.remove();
        this.pagination = undefined;
        view.actives.off();
        view.changes.off();
    },
    
    activate: function(active) {
        const shadow = this.shadow;

        // Remove `on` class from currently highlighted links
        if (this.active) {
            const id = this.active.dataset && this.active.dataset.id || this.active.id;

            select('[href="#' + id +'"]', shadow)
            .forEach((node) => node.part.remove('active-link'))
        }

        // Highlight links with `on` class
        const id = active.dataset.id || active.id;

        select('[href="#' + id +'"]', shadow)
        .forEach((node) => node.part.add('active-link'));
    }
});


/* Element */

element('slide-show', {
    /*
    Create a DOM of the form:

    <link rel="stylesheet" href="/source/bolt/elements/slide-show.shadow.css" />
    <slot></slot>
    <a class="prev-thumb thumb"></a>
    <a class="next-thumb thumb"></a>
    <nav>
        <a part="link"></a>
        <a part="link"></a>
    </nav>
    <slot name="optional"></slot>
    <slot name="overflow"></slot>
    */

    construct: function(elem, shadow) {
        const link     = create('link', { rel: 'stylesheet', href: config.path + 'slide-show.shadow.css' });
        const slot     = create('slot', { part: 'grid' });
        //const optional = create('slot', { name: 'optional', part: 'optional' });
        const overflow = create('slot', { name: 'overflow', part: 'overflow' });

        shadow.appendChild(link);
        shadow.appendChild(slot);
        //shadow.appendChild(optional);
        shadow.appendChild(overflow);

        // Hijack links to slides to avoid the document scrolling, (but make 
        // sure they go in the history anyway. NOPE, dont)
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

            if (elem.contains(target) && elem !== target) {
               scrollSmooth(elem, slot, target);
               e.preventDefault();
               //window.history.pushState({}, '', '#' + id);
            }
        });

        // Enable single finger scroll 
        gestures({ threshold: '0.25rem' }, shadow)
        .each(function(pointers) {
            // First event is touchstart or mousedown
            var e0     = pointers.shift();
            var latest = pointers.latest();
            var e1     = latest.shift();
            var x0     = e0.clientX;
            var y0     = e0.clientY;
            var x1     = e1.clientX;
            var y1     = e1.clientY;

            // If the gesture is more vertical than horizontal, don't count it
            // as a swipe. Stop the stream and get out of here.
            if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
                pointers.stop();
                return;
            }

            const scrollLeft0 = slot.scrollLeft;
            var dx;

            //slot.classList.add('no-select');
            slot.classList.add('gesturing');

            latest
            .each(function (e) {
                dx = e.clientX - x0;
                slot.scrollLeft = scrollLeft0 - dx;
            })
            .done(function() {
                // Prevent default on any immediate clicks
                events('click', shadow).each(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.stop();
                });

                //scrollSmooth(elem, slot, view.active);
                slot.classList.remove('gesturing');
            });
        });

        this[$] = new View(this, shadow, slot);
    },

    load: function (elem, shadow) {
        const view = this[$];
        view.load();
        events('resize', window).each(() => view.activate(view.active));
    },

    properties: {
        autoplay: {
            /**
            autoplay
            Boolean attribute. 
            **/

            attribute: function(value) {
                // Delegate to property
                this.autoplay = (value !== null);
            },

            /**
            .autoplay = false
            Boolean property.
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
            controls="navigation pagination"

            Treated as a boolean or a token list. If it is present but empty
            all tokens are considered to be true. Otherwise, possible tokens are:
            
            <strong>navigation</strong> enables previous and next buttons. The 
            buttons may be styled with `::part(previous)` and `::part(next)` 
            selectors.
            
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
            loop
            Boolean attribute. Makes the slideshow behave as a continuous loop.
            **/

            attribute: function(value) {
                // Delegate to property
                this.loop = (value !== null);
            },

            /**
            .loop = false
            Boolean property. Makes the slideshow behave as a continuous loop.
            **/

            set: function(state) {
                this[$].loop = state;
            },

            get: function() {
                return this[$].loop;
            }
        }
    }
});
