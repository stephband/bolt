
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
    let newSlide;

    while ((newSlide = slides[--n])) {
        const slideRect = rect(newSlide);
        if (!slideRect) { continue; }

        const left = slideRect.left;
        if (left <= elemCentre) {
            break;
        }
    }

    if (newSlide === elem.activeChild) {
        return;
    }

    if (elem.activeChild){
        select('[href="#' + elem.activeChild.id +'"]', elem.getRootNode())
        .forEach((node) => node.classList.remove('on'))

        select('[href="#' + elem.activeChild.id +'"]', shadow)
        .forEach((node) => node.classList.remove('on'))
    }

    elem.activeChild = newSlide;

    const prevChild = previous(newSlide);
    if (prevChild) {
        prevLink.href = '#' + prevChild.id;
    }
    else {
        prevLink.removeAttribute('href');
    }

    const nextChild = next(newSlide);
    if (nextChild) {
        nextLink.href = '#' + nextChild.id;
    }
    else {
        nextLink.removeAttribute('href');
    }

    select('[href="#' + newSlide.id +'"]', elem.getRootNode())
    .forEach((node) => node.classList.add('on'));

    select('[href="#' + newSlide.id +'"]', shadow)
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

        return {
            slot: slot
        };
    },

    construct: function(elem, shadow) {
        // Select the .hide-scroll wrapper element and apply margin bottom
        const scrollBarWidth = testScrollBarWidth();
        if (scrollBarWidth) {
            slot.parentNode.style.setProperty('margin-bottom', '-' + scrollBarWidth + 'px');
        }
    },

    load: function (elem, shadow) {
        // Things haven't loaded and styled yet
        const prev = shadow.querySelector('.prev-thumb');
        const next = shadow.querySelector('.next-thumb');
        activate(elem, shadow, prev, next);
    }
});
