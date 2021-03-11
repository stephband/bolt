
/** <slide-show>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<slide-show>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="slide-show.rolled.js"></script>
<slide-show loop autoplay>
   <img src="../images/lyngen-4.png" id="1" />
   <img src="../images/lyngen-2.png" id="2" />
   <img src="../images/lyngen-1.png" id="3" />
   <img src="../images/lyngen-3.png" id="4" />
</slide-show>
```

By default each element inside `<slide-show>` is interpreted as a slide, but
content with the attribute `slot="optional"` is ignored, allowing for the
insertion of fullscreen close buttons and the like.
**/

// Polyfill Safari's lack of smooth scrolling via .scrollTo()
import '../../dom/polyfills/element.scrollto.js';

import id         from '../../fn/modules/id.js';
import Privates   from '../../fn/modules/privates.js';
import equals     from '../../fn/modules/equals.js';
import last       from '../../fn/modules/lists/last.js';
import parseValue from '../../fn/modules/parse-value.js';
import closest    from '../../dom/modules/closest.js';
import element    from '../../dom/modules/element.js';
import events, { isPrimaryButton } from '../../dom/modules/events.js';
import gestures   from '../../dom/modules/gestures.js';
import rect       from '../../dom/modules/rect.js';
import create     from '../../dom/modules/create.js';
import identify   from '../../dom/modules/identify.js';
import { next, previous } from '../../dom/modules/traverse.js';
import { select } from '../../dom/modules/select.js';


const DEBUG = true;

const assign = Object.assign;

const config = {
    path: window.customElementStylesheetPath || '',
    loopableSlideCount: 5,
    duration: 8
};

const parseTime = parseValue({
   's': id,
   'ms': (n) => n / 1000
});


/* Shadow */

function activate(elem, shadow, prevLink, nextLink, active) {
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
    if (slide === active) {
        return active;
    }

    // Remove `on` class from currently highlighted links
    if (active) {
        const id = active.dataset && active.dataset.id || active.id;

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
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
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
    scrollAuto(elem, slot, target);
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

    <link rel="stylesheet" href="/source/bolt/elements/slide-show.shadow.css" />
    <slot></slot>
    <a class="prev-thumb thumb"></a>
    <a class="next-thumb thumb"></a>
    <nav>
        <a part="link"></a>
        <a part="link"></a>
    </nav>
    <slot name="optional"></slot>
    */

    template: function(elem, shadow) {
        const link     = create('link', { rel: 'stylesheet', href: config.path + 'slide-show.shadow.css' });
        const slot     = create('slot');
        const prevNode = create('a', { class: 'prev-thumb thumb', part: 'prev' });
        const nextNode = create('a', { class: 'next-thumb thumb', part: 'next' });
        const nav      = create('nav');
        const title    = create('slot', { name: 'title' });
        const optional = create('slot', { name: 'optional' });

        shadow.appendChild(link);
        shadow.appendChild(title);
        shadow.appendChild(slot);
        //shadow.appendChild(prevNode);
        //shadow.appendChild(nextNode);
        //shadow.appendChild(nav);
        shadow.appendChild(optional);



        var active;
        var slides = [];

        function updateUI(children) {
            // Empty nav then create a dot link for each slide
            nav.innerHTML = '';
            children.forEach((slide) => {
               // Id other content and create nav links for them
               const id = identify(slide);
               nav.appendChild(create('a', {
                   part: 'link',
                   href: '#' + id,
                   html: id
               }));
            });

            // Update the currently active slide
            if (!children[0]) {
                active = undefined;
            }
            else if (active) {
                if (!children.includes(active)) {
                    // Change active to next existing slide from the old list
                    let n = slides.indexOf(active);
                    while(slides[++n] && !children.includes(slides[n]));
                    active = slides[n];
                }
            }
            else {
                active = children[0];
                identify(active);
            }

            slides = children;
            //console.log(slot, children.length);
            elem.style.setProperty('--slides-count', children.length);
        }

        var before;
        var after;

        function createLoopUI(children) {
            // To loop slides we need an extra couple on the front and an 
            // extra couple on the back to simulate the continuous loop
            before = Array.from(children).map(createGhost);
            after  = Array.from(children).map(createGhost);

            if (children.length) {
                children[0].before.apply(children[0], before);
                last(children).after.apply(last(children), after);    
            }
        }

        function removeLoopUI() {
            before.forEach((ghost) => ghost.remove());
            after.forEach((ghost) => ghost.remove());
            before = undefined;
            after = undefined;
        }

        slot.addEventListener('slotchange', (e) => {
            const children = e.target
               .assignedElements()
               .filter((element) => !element.dataset.id);

            // Test whether mutation has really changed original slides, if not
            // it was probably an internal mutation adding or removing loop ghosts
            if (equals(children, slides)) {
                return;
            }

            /*
            // Strip text nodes
            if (e.target.assignedNodes().reduce((found, node) => (
                getNodeType(node) === 'text' ? (node.remove(), true) : found
            ), false)) {
                // If successful another slotchange event will be fired
                // so wait for that one to update the slides list
                return;
            }
            */

            updateUI(children);

            // Update the pre- and post- loop content when loop is enabled
            if (elem.loop) {
                // Will trigger a slotchange
                removeLoopUI();
                createLoopUI(children);
            }

            if (active) {
                ignore = true;
                active = reposition(elem, slot, active.id);
            }
        });

        // Manage repositioning of slides when scroll is at rest
        var t = -Infinity;
        var loopId = null;
        var ignore = false;

        function updateLoop() {
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
            const target = next(active);

            // Have we reached the end?
            if (!target) { return; }

            scrollSmooth(elem, slot, target);
        }


        const privates = assign(Privates(elem), {
            activate: function() {
                active = reposition(elem, slot, active.id);
            },
            
            load: function(elem, shadow) {
                const current = activate(elem, shadow, prevNode, nextNode, active);
            
                // If we are at the very start of the loop on load, and it is 
                // not an original, reposition to be at the start of the 
                // originals
                if (current === elem.firstElementChild && !current.id) {
                    ignore = true;
                    active = reposition(elem, slot, active.id);
                    active = activate(elem, shadow, prevNode, nextNode, current); 
                }
                else {
                    active = current;
                }
            
                // This only happens where element load is before window load.
                events('load', window)
                .map(() => {
                    const id = window.location.hash.replace(/^#/, '') || undefined;
                    return id ?
                        elem.querySelector('#' + id) :
                        first ;
                })
                //.each(function(target) {
                //    scrollAuto(elem, slot, target);
                //    // In case that doesn't trigger a scroll, like in FF
                //    active = activate(elem, shadow, prevNode, nextNode, active);
                //});
            },
            
            loopState: false,
            
            loop: function duplicate(state) {
                if (state && !this.loopState) {
                    createLoopUI(slides);
                    this.loopState = state;

                    if (active) {
                        ignore = true;
                        active = reposition(elem, slot, active.id);
                    }
                }
                else if (!state && this.loopState){
                    console.log('Remove loop ghosts, switch off loop');
                    removeLoopUI();
                    this.loopState = state;
                }
            },
            
            autoplayState: false,
            
            autoplay: function(state) {
                this.autoplayState = state;
            
                // When value is false stop autoplaying
                if (!state) {
                    autoId && clearTimeout(autoId);
                    return;
                }
            
                if (active) {
                    autoId = autoplay(active, change, autoId);
                }
            },

            controlsState: false,
            
            controls: function(state) {
                this.controlsState = state;

                if (!state) {
                    shadow.appendChild(prevNode);
                    shadow.appendChild(nextNode);
                    shadow.appendChild(nav);
                }
                else {
                    prevNode.remove();
                    nextNode.remove();
                    nav.remove();
                }
            }
        });

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

            // If autoplay is off don't schedule
            if (!privates.autoplayState) {
               return;
            }

            // Set a new timeout and register the schedule time
            loopId = setTimeout(updateLoop, 240);
            t = e.timeStamp;

            if (active) {
                autoId = autoplay(active, change, autoId);
            }
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

            if (elem.contains(target)) {
               scrollSmooth(elem, slot, target);
               e.preventDefault();
               window.history.pushState({}, '', '#' + id);
            }
        });

        gestures({ threshold: '0.25rem' }, shadow)
        .each(function(events) {
            // First event is touchstart or mousedown
            var e0     = events.shift();
            var latest = events.latest();
            var e1     = latest.shift();
            var x0     = e0.clientX;
            var y0     = e0.clientY;
            var x1     = e1.clientX;
            var y1     = e1.clientY;

            // If the gesture is more vertical than horizontal, don't count it
            // as a swipe. Stop the stream and get out of here.
            if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
                events.stop();
                return;
            }

            var slot = closest('slot', e0.target);
            const scrollLeft0 = slot.scrollLeft;

            console.log('SLOT', slot);

            //var state = switchState(label);
            //var x = state ? 1 : 0 ;
            var dx;

            //slot.classList.add('no-select');
            slot.classList.add('gesturing');

            latest.each(function (e) {
                dx = e.clientX - x0;
                console.log('DX', scrollLeft0 - dx);
                slot.scrollLeft = scrollLeft0 - dx;
                //slot.scrollLeft = 0;
            })
            .done(function() {
                //slot.classList.remove('no-select');
                slot.classList.remove('gesturing');
                //label.style.removeProperty('--switch-handle-gesture-x');
            });
        });
    },

    construct: function(elem, shadow) {
        
    },

    load: function (elem, shadow) {
        const scope = Privates(this);
        scope.load(elem, shadow);
        events('resize', window).each(scope.activate);
    },

    attributes: {
        /**
        loop
        Boolean attribute. Makes the slideshow behave as a continuous loop.
        **/
        loop: function(value) {
            Privates(this).loop(value !== null);
        },

        /**
        autoplay
        Boolean attribute. 
        **/
        autoplay: function(value) {
            Privates(this).autoplay(value !== null);
        },

        /**
        controls
        Boolean attribute. Shows previous/next buttons and navigation.
        **/
        controls: function(value) {
            Privates(this).controls(value !== null);
        }
    },

    properties: {
        /**
        .autoplay = false
        Boolean property.
        **/
        autoplay: {
            set: function(state) {
                Privates(this).autoplay(!!state);
            },
         
            get: function() {
                return Privates(this).autoplayState;
            }
        },

        /**
        .loop = false
        Boolean property.
        **/
        loop: {
            set: function(state) {
                Privates(this).loop(!!state);
            },

            get: function() {
                return Privates(this).loopState;
            }
        }
    }
});
