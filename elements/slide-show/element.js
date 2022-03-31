
import Stream  from '../../../fn/stream/stream.js';
import Stream  from '../../../fn/stream/distributor.js';
import element from '../../../dom/modules/element.js';


/* Slot */

function reflow(data, target) {
    if (window.DEBUG) {
        console.log('%c<slide-show>', 'color: #46789a; font-weight: 600;', 'reflow');
    }

    /*
    this.ignore = true;
    */

    scrollAuto(data.host, data.slot, target);

    // If scrollable, style accordingly. Currently this class simply updates
    // the cursor to ew-resize
    if (data.slot.scrollWidth <= data.slot.clientWidth) {
        data.slot.classList.remove('scrollable')
    }
    else {
        data.slot.classList.add('scrollable');
    }

    data.active = target;
    return data;
}

/* Navigation */

function updateNavigation(data, active) {
    console.log('updateNavigation');

    /*
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
}

function renderNavigation(data, active) {
    console.log('renderNavigation');
    /*
    this.previous.style.setProperty('display', items.length < 2 ? 'none' : '');
    this.next.style.setProperty('display', items.length < 2 ? 'none' : '');
    return items;
    */
}

function setupNavigation(data, state) {
    const update = new Stream((stream) => stream.each(updateNavigation));
    const render = new Stream((stream) => stream.each(renderNavigation));

    data.reflows.pipe(update);
    data.activates.pipe(render);
    data.navigation = { update, render };
    /*
    this.previous = create('a', { part: 'previous', html: config.trans['Previous'] });
    this.next     = create('a', { part: 'next', html: config.trans['Next'] });
    this.parent.appendChild(this.previous);
    this.parent.appendChild(this.next);
    this.activates.on(this.activateFn = (active) => this.activate(active));
    this.changes.on(this.changesFn = (items) => this.slotchange(items));
    */
}

function teardownNavigation() {
    const { update, render } = data.navigation;
    update.stop();
    render.stop();
    data.navigation = undefined;

    /*
    this.previous.remove();
    this.next.remove();
    this.previous = undefined;
    this.next = undefined;
    this.activates.off(this.activateFn);
    this.activateFn = undefined;
    this.changes.off(this.changesFn);
    this.changesFn = undefined;
    */
}


/* Pagination */

function addPartOn(node) {
    node.part.add('on');
}

function removePartOn(node) {
    node.part.remove('on');
}

function updatePagination(data, active) {
    console.log('updatePagination');

    /*
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
    */
}

function renderPagination(data, active) {
    console.log('renderPagination');

    /*
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

    return items;
    */
}

function setupPagination(data, state) {
    const update = new Stream((stream) => stream.each(updatePagination));
    const render = new Stream((stream) => stream.each(renderPagination));

    data.reflows.pipe(update);
    data.activates.pipe(render);
    data.pagination = { update, render };

    /*
    this.pagination = create('nav', {
        part: 'pagination'
    });

    this.slotchange(this.view.children);
    this.shadow.appendChild(this.pagination);
    this.actives.on(this.activateFn = (active) => this.activate(active));
    this.slotchanges.on(this.slotchangeFn = (items) => this.slotchange(items));
    */
}

function teardownPagination() {
    const { update, render } = data.pagination;
    update.stop();
    render.stop();
    data.pagination = undefined;

    /*
    this.pagination.remove();
    this.pagination = undefined;
    this.actives.off(this.activateFn);
    this.slotchanges.off(this.slotchangeFn);
    */
}


/* Loop */

function createLoopGhost(slide) {
    const ghost = slide.cloneNode(true);
    ghost.dataset.loopId = ghost.id;
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    return ghost;
}

function updateLoop(data, active) {
    console.log('updateLoop');
    /*
    const id = this.view.active.dataset.loopId;

    // Active child is an original slide, not a copy: do nothing
    if (!id) { return; }

    // Realign the original slide as the active slide.
    const target = this.element.getRootNode().getElementById(id);
    this.view.reposition(target);
    this.view.actives.push(target);
    */
}

function renderLoop(data, active) {
    console.log('renderLoop');
    /*
    const view     = this.view;
    const children = view.children;

    // Will trigger a slotchange
    this.remove();
    this.add(children);

    // This was originally AFTER the loop and nav stuff...
    if (view.active) {
        view.reposition(view.active);
    }

    return items;
    */
}

function setupLoop() {
    const update = new Stream((stream) => stream.each(updateLoop));
    const render = new Stream((stream) => stream.each(renderLoop));

    data.reflows.pipe(update);
    data.activates.pipe(render);
    data.loop = { update, render };

    /*
    const view     = this.view;
    const children = view.children;

    this.add(children);
    this.slotchanges.on(this.slotchangeFn = (items) => this.slotchange(items));
    this.scrollends = scrollends(this.view.slot).each((e) => {
        // Ignore scrollends while a finger is gesturing
        if (this.view.gesturing) { return; }
        this.update();
    });

    if (view.active) {
        this.view.reposition(view.active);
    }
    */
}

function teardownLoop() {
    const { update, render } = data.loop;
    update.stop();
    render.stop();
    data.loop = undefined;

    /*
    this.remove();
    this.slotchanges.off(this.slotchangeFn);
    this.slotchangeFn = undefined;
    this.scrollends.stop();
    */
}

/* Autoplay */
/*
function change() {
    this.timer   = null;
    const target = next(this.view.active);

    // Have we reached the end?
    if (!target) { return; }

    scrollSmooth(this.view.element, this.view.slot, target);
}
*/
function updateAutoplay(data, active) {
    console.log('updateAutoplay');
/*
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
*/
}

function setupAutoplay() {
    const update = new Stream((stream) => stream.each(updateAutoplay));

    data.reflows.pipe(update);
    data.activates.pipe(render);
    data.autoplay = { update, render };
    /*
    this.activates.on(this.activateFn = (active) => this.activate(active));

    if (this.view.active) {
        this.activate(this.view.active);
    }

    // Expose state as loop view needs to know about autoplay
    this.state = true;
    */
}

function teardownAutoplay() {
    const { update, render } = data.loop;
    update.stop();
    render.stop();
    data.autoplay = undefined;

    /*
    this.timer && clearTimeout(this.timer);
    this.activates.off(this.activateFn);
    this.state  = false;
    */
}


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
    <!-- The main scrollable grid -->
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
        // Shadow DOM
        const slot     = create('slot', { part: 'grid' });
        // A place to put optional UI (fullscreen close buttons etc)
        const optional = create('slot', { name: 'optional', part: 'optional' });
        // A place to put overflow menu stuff
        const overflow = create('slot', { name: 'overflow', part: 'overflow' });

        // Add slots to shadow
        shadow.append(slot, optional, overflow);

        // Private data
        const data = this[$data] = {
            clickSuppressTime: -Infinity,
            children: [],
            host:     this,
            shadow:   shadow,
            slot:     slot
        };

        // Streams
        const activates   = Stream.of();
        const reflows     = Stream.of().reduce(reflow, data);
        const scrolls     = events('scroll', slot);
        const scrollends  = scrollends(slot);
        const slotchanges = events('slotchange', slot);
        const clicks      = events('click', shadow).filter(isPrimaryButton).pipe(new Distributor());
        const resizes     = events('resize', window);
        const fullscreens = events('fullscreenchange', window);
        const swipes      = gestures({ threshold: '0.25rem', device: 'mouse' }, shadow).filter(() => data.children.length > 1);

        // Hijack links to slides to avoid the document scrolling, (but make
        // sure they go in the history anyway, or not)
        clicks.each(delegate({
            // Previous and next links may not have hrefs if loop is on, and
            // they also cannot reference ghosts. We hijack them and launch
            // previous/next.
            '[href][part="previous"]': function(link, e) {
                // Show previous whether a ghost or not
                //view.show(previous(view.active));
                //e.preventDefault();
            },

            '[href][part="next"]': function(link, e) {
                // Show next whether a ghost or not
                //view.show(next(view.active));
                //e.preventDefault();
            },

            // Pagination links always reference non-ghost slides
            '[href]': function(link, e) {
                //const id     = link.hash && link.hash.replace(/^#/, '');
                //const target = elem.getRootNode().getElementById(id);
                //if (elem.contains(target) && elem !== target) {
                //    view.show(target);
                //    e.preventDefault();
                //}
            }
        }));

        // Prevent default on immediate clicks after a gesture, and don't let
        // them out: this is a gesture not a click
        clicks.each(function(e) {
            const time = window.performance.now();
            if (time - data.clickSuppressTime < 120) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Enable single finger scroll on mouse devices. Bad idea in my opinion,
        // but users tend to want it.
        swipes
        .each((pointers) => pointers.reduce(processPointerEvents, { data, pointers }));

        // Reposition everything on resize
        resizes.each(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => reflows.push(data.active || this.firstElementChild)), 120);
        });

        fullscreens.each((e) => {
            // If this slide-show was involved in the fullscreen change
            if (e.target === this || e.target.contains(this)) {
                //this.actives.push(this.active);
            }
        });
    },

    load: function (shadow) {

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

            this[$data].show(child);
        },

        get: function() {
            return this[$data].original;
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
            const data = this[$data];

            return !state === !data.autoplay ?
                undefined :
                state ?
                    setupAutoplay(data) :
                    teardownAutoplay(data) ;
        },

        get: function() {
            return !!this[$data].autoplay;
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
            const data = this[$data];
            let navigationState, paginationState;

            // If value is a string of tokens
            if (typeof value === 'string' && value !== '') {
                const state = value.split(/\s+/);
                navigationState = state.includes('navigation');
                paginationState = state.includes('pagination');
            }
            else {
                const state = value !== null;
                navigationState = state;
                paginationState = state;
            }

            if (!!navigationState !== !!data.navigation) {
                if (navigationState) {
                    setupNavigation(data);
                }
                else {
                    teardownNavigation(data);
                }
            }

            if (!!paginationState !== !!data.pagination) {
                if (paginationState) {
                    setupPagination(data);
                }
                else {
                    teardownPagination(data);
                }
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
            const data = this[$data];
            return !state === !data.loop ?
                undefined :
                state ?
                    setupLoop(data) :
                    teardownLoop(data) ;
        },

        get: function() {
            return !!this[$data].loop;
        }
    }
};

export default element('slide-show', lifecycle, properties);
