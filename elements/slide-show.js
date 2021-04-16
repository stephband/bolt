
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

import id          from '../../fn/modules/id.js';
import equals      from '../../fn/modules/equals.js';
import last        from '../../fn/modules/lists/last.js';
import parseValue  from '../../fn/modules/parse-value.js';
import delegate    from '../../dom/modules/delegate.js';
import element     from '../../dom/modules/element.js';
import events, { isPrimaryButton } from '../../dom/modules/events.js';
import gestures    from '../../dom/modules/gestures.js';
import rect        from '../../dom/modules/rect.js';
import create      from '../../dom/modules/create.js';
import identify    from '../../dom/modules/identify.js';
import { next, previous } from '../../dom/modules/traverse.js';
import { select }  from '../../dom/modules/select.js';
import Distributor from '../../dom/modules/distributor.js';
import scrollstops from '../../dom/modules/scrollstops.js';
import parseCSSValue from '../../dom/modules/parse-value.js';
import Literal     from '../../modules/literal.js';


const DEBUG = window.DEBUG === true;

const assign = Object.assign;
const define = Object.defineProperties;
const $      = Symbol('slide-show');

export const config = {
    path: window.customElementStylesheetPath || '',
    duration: 8,
    trans: {
        'Previous': 'Previous',
        'Next': 'Next'
    }
};


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

    // Move scroll position to next slide
    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'smooth'
    });
}

function scrollAuto(element, slot, target) {
    // Check for visibility before measuring anything
    if (!element.offsetParent) { return; }

    const firstRect  = rect(element.firstElementChild);
    const targetRect = rect(target);

    // Move scroll position to next slide. Behavior option does not seem
    // to be respected so override style for safety.
    slot.style.setProperty('scroll-behavior', 'auto');

    slot.scrollTo({
        top: slot.scrollTop,
        left: targetRect.left - firstRect.left,
        behavior: 'auto'
    });

    requestAnimationFrame(function() {
        slot.style.setProperty('scroll-behavior', '');
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

function View(element, shadow, slot) {
    this.element   = element;
    this.shadow    = shadow;
    this.slot      = slot;
    this.active    = undefined;
    this.children  = [];

    this.changes = Distributor((e) => {
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

        // Gaurantee all items have an id
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
    });

    const autoplay   = new Autoplay(this);
    const loop       = new Loop(element, shadow, this, autoplay, this.changes);
    const navigation = new Navigation(element, slot, this.changes, this.actives, shadow);
    const pagination = new Pagination(this, shadow);

    slot.addEventListener('slotchange', this.changes);
    slot.addEventListener('scroll', this.actives, { passive: false });

    this.load = () => {
        // If we are at the very start of the loop on load, and it is 
        // not an original, reposition to be at the start of the 
        // originals
        if (DEBUG) {
            console.log('%c<slide-show>', 'color: #46789a; font-weight: 600;', 'load', this.active);
        }

        this.reposition(this.active);
        this.actives.push(this.active);

        var resizeTimer;

        // Reposition everything on resize
        events('resize', window)
        .each(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.reposition(this.active);
            }, 120);
        });

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
    // Call to scroll to and activate a slide
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
                snap === 'start' ? view.left :
                snap === 'end'   ? view.right :
                view.centre
            );

            // ...and a slide registration position at it's corresponding left,
            // centre or right position
            const position = (
                snap === 'start' ? slideRect.left :
                snap === 'end'   ? slideRect.right :
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
        return (this.active = slide);
    },

    reposition: function(target) {
        if (DEBUG) {
            console.log('%c<slide-show>', 'color: #46789a; font-weight: 600;', 'reposition', target);
        }

        this.ignore = true;
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
        }

        this.slot.style.setProperty('--children-count', items.length);
        this.children = items;
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
        if (active) {
            this.autoplay.cue();
        }
    },

    cue: function() {
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

        this.scrollstops = scrollstops(this.view.slot).each((e) => {
            // Ignore scrollstops while a finger is gesturing
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

        // Realign the original slide as the active slide. Before we do, 
        // set an ignore flag so that this repositioning does not trigger
        // another activate when it resets scroll position
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
        this.scrollstops.stop();
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
    },

    disable: function() {
        this.previous.remove();
        this.next.remove();
        this.previous = undefined; 
        this.next = undefined;
        this.activates.off(this.activateFn);
        this.activateFn = undefined;
    },
    
    activate: function(active) {
        // Change href of prev and next buttons, and hide them where there are 
        // no previous or next siblings. Href updates are purely a help for the 
        // end user, as we pick up clicks on part(previous) and part(next) 
        // before we interrogate link hrefs.
        const prevChild = previous(active);

        if (this.slot.scrollWidth <= this.slot.clientWidth) {
            // Nowhere to scroll to
            this.previous.hidden = true;
            this.next.hidden = true;
            return;
        }

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
console.trace('pagination.enable()', this);
        this.pagination = create('nav');

        // Empty nav then create a dot link for each slide
        //nav.innerHTML = '';
        children.forEach((slide) => {
           // Id other content and create nav links for them
           const id = slide.id;
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
            const id = this.active.dataset && this.active.dataset.loopId || this.active.id;

            select('[href="#' + id +'"]', shadow)
            .forEach((node) => node.part.remove('active-link'))
        }

        // Highlight links with `on` class
        const id = active.dataset.loopId || active.id;

        select('[href="#' + id +'"]', shadow)
        .forEach((node) => node.part.add('active-link'));
    }
});


/* Element */

const settings = {
    /**
    Create a shadow DOM containing:

    ```html
    <link rel="stylesheet" href="/source/bolt/elements/slide-show.shadow.css" />
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
        const link     = create('link', { rel: 'stylesheet', href: config.path + 'slide-show.shadow.css' });
        const slot     = create('slot', { part: 'grid' });
        // A place to put optional UI (fullscreen close buttons etc)
        const optional = create('slot', { name: 'optional', part: 'optional' });
        // A place to put overflow menu stuff
        const overflow = create('slot', { name: 'overflow', part: 'overflow' });

        shadow.appendChild(link);
        shadow.appendChild(slot);
        shadow.appendChild(optional);
        shadow.appendChild(overflow);

        const elem = this;
        var clickSuppressTime = -Infinity;

        // Hijack links to slides to avoid the document scrolling, (but make 
        // sure they go in the history anyway, or not)
        events('click', shadow)
        //.filter((e) => !!e.target.href)
        .filter(isPrimaryButton)
        .each(delegate({
            // Previous and next links may not have hrefs if loop is on, so we
            // hijack them first
            '[part="previous"]': function(link, e) {
                view.show(previous(view.active));
                e.preventDefault();
            },
            
            '[part="next"]': function(link, e) {
                view.show(next(view.active));
                e.preventDefault();
            },

            // Then we ask about links with hrefs
            '[href]': function(e) {
                const id     = e.target.hash && e.target.hash.replace(/^#/, ''); 
                const target = elem.getRootNode().getElementById(id);

                if (!target) {
                    if (DEBUG) {
                        console.warn('Link to id not found in slide-show "' + id + '"');
                    }

                    return;
                }
    
                if (elem.contains(target) && elem !== target) {
                    view.show(target);
                    e.preventDefault();

                    // Todo: make this selectable by attribute "locator"?
                    //window.history.pushState({}, '', '#' + id);
                }
            }
        }));

        // Prevent default on immediate clicks after a gesture, and don't let 
        // them out
        events('click', shadow)
        .each(function(e) {
            const time = window.performance.now();
            if (time - clickSuppressTime < 120) {
                e.preventDefault();
                e.stopPropagation();
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
            view.gesturing = true;

            latest
            .each(function (e) {
                dx = e.clientX - x0;
                slot.scrollLeft = scrollLeft0 - dx;
            })
            .done(function() {
                clickSuppressTime = window.performance.now();

                // Dodgy. If we simple remove the class the end of the gesture 
                // jumps.
                const scrollLeft = slot.scrollLeft;
                slot.classList.remove('gesturing');
                slot.scrollLeft = scrollLeft;
                view.gesturing = false;
            });
        });

        const view = this[$] = new View(this, shadow, slot);
    },

    load: function (shadow) {
        const view = this[$];

        const id = this.getAttribute('template');
        const template = id && this
            .getRootNode()
            .getElementById(id);

        if (template) {
            /*if (template.render) {
                
            }
            else {*/
                const render = Literal(template.innerHTML);
                const data = {};

                view.actives.on(function(active) {
                    // Put together template render data
                    data.activeId    = active.id || active.dataset.loopId;
                    data.activeIndex = view.children.findIndex((child) => child.id === data.activeId);
                    data.slidesCount = view.children.length;

                    return render(data).then((html) => {
                        this.nodes && this.nodes.forEach((node) => node.remove());
                        //content && content.remove();
                        const content = create('fragment', html);
                        this.nodes = Array.from(content.childNodes);
                        shadow.appendChild(content);
                    });
                });
            /*}*/
        }

        view.load();
    },

    properties: {
        autoplay: {
            /**
            autoplay=""
            Boolean attribute. 
            **/

            attribute: function(value) {
                // Delegate to property
                this.autoplay = (value !== null);
            },

            /**
            .autoplay
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
            controls=""

            Treated as a boolean or a token list. If it is present but empty
            all tokens are considered to be true. Otherwise, possible tokens are:
            
            <strong>navigation</strong> enables previous and next buttons. The 
            buttons may be styled with `::part(previous)` and `::part(next)` 
            selectors. To change their text content, import and modify 
            `config.trans`:

            ```js
            import { config } from './bolt/elements/slide-show.js';
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
        },

        template: {            
            /**
            template="id"
            Id of optional template to append to the shadow DOM on instantiation.
            Subsequent changes to this attribute have no effect.
            **/

            attribute: function(id) {
                this[$].template = id;
            }
        }
    }
};

export default element('slide-show', settings);

//element('div[is=slide-show]', 'ol', settings);
//element('ul[is=slide-show]', 'ul', settings);
