
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
<slide-show>
    <img src="..." id="1" />
    <img src="..." id="2" />
</slide-show>
```
**/

import Privates from '../../fn/modules/privates.js';
import element from '../../dom/modules/element.js';
import events from '../../dom/modules/events.js';
import rect from '../../dom/modules/rect.js';
import create from '../../dom/modules/create.js';
import { next, previous } from '../../dom/modules/traversal.js';
import { select } from '../../dom/modules/select.js';

const DEBUG = true;

const A      = Array.prototype;
const assign = Object.assign;
const define = Object.defineProperties;

const config = {
    path: window.customElementStylesheetPath || ''
};

const defaults = {
    path:   './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

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

function activate(elem, shadow, prevLink, nextLink) {
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

    // If active slide is the same one, ignore
    if (slide === elem.activeChild) {
        return;
    }

    // Remove `on` class from currently highlighted links
    if (elem.activeChild){
        const id = elem.activeChild.dataset.id || elem.activeChild.id;

        select('[href="#' + id +'"]', elem.getRootNode())
        .forEach((node) => node.classList.remove('on'))

        select('[href="#' + id +'"]', shadow)
        .forEach((node) => node.classList.remove('on'))
    }

    elem.activeChild = slide;

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
}

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
        //const css  = create('style', ':host {}');
        const slot = create('slot');
        const prev = create('a', { class: 'prev-thumb thumb', part: 'prev' });
        const next = create('a', { class: 'next-thumb thumb', part: 'next' });
        const nav  = create('nav');

        shadow.appendChild(link);
        //shadow.appendChild(css);
        shadow.appendChild(slot);
        shadow.appendChild(prev);
        shadow.appendChild(next);
        shadow.appendChild(nav);

        // Get the :host {} style rule from style
        //const style = css.sheet.cssRules[0].style;
        
        // Create a dot link for each slide
        Array.from(elem.children).forEach((slide) => {
            if (!slide.id) { return; }
            nav.appendChild(create('a', {
                class: 'dot-thumb thumb',
                part: 'dot',
                href: '#' + slide.id,
                html: slide.id
            }));
        });

        events({ type: 'scroll', passive: true }, slot)
        .each(function(e) {
            activate(elem, shadow, prev, next);
        });

        assign(Privates(elem), {
            loop: function(loop) {
                // Where there are too few slides to loop (less than 3) we must 
                // duplicate them, sadly
                const children = elem.children;
                while(children.length < 3) {
                    var n = children.length;
                    const last = children[n - 1];
                    while (n--) {
                        const ghost = children[n].cloneNode(true);
                        ghost.dataset.id = ghost.id;
                        ghost.id = ghost.id + '-ghost';
                        last.after(ghost);
                    }
                }
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
        loop: function(a) {
            const scope = Privates(this);
            scope.loop(a !== null);
        }
    }
});
