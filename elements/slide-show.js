
import { get, weakCache } from '../../fn/module.js';
import { element, events, rect, create } from '../../dom/module.js';

const DEBUG = true;

const A = Array.prototype;

const assign = Object.assign;

const defaults = {
    path:   './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

const onceOptions = {
    once: true
};

function testScrollBarWidth() {
    const inner = create('div', {
        style: 'display: block; width: auto; height: 60px; background: orange;'
    });

    const test = create('div', {
        style: 'overflow: scroll; width: 30px; height: 30px; position: absolute; bottom: 0; right: 0; background: red; z-index: 10;',
        children: [inner]
    });

    document.body.appendChild(test);

    const scrollBarWodth = test.clientWidth - inner.clientWidth;

    console.log(test.clientWidth - inner.clientWidth, test);

    //test.remove();

    return scrollBarWodth;
}


function createDots(elem, template) {
    // Create a nav dot for each slide with an id
    Array.from(elem.children).reduce((prev, node) => {
        if (!node.id) { return prev; }

        const dot = prev.cloneNode(true);
        dot.href = '#' + node.id;
        dot.innerHTML = node.id;

        prev.after(dot);
        return dot;
    }, template);

    template.remove();
}

function activate(elem, shadow) {
    const elemRect = rect(elem);
    const elemCentre = elemRect.left + elemRect.width / 2;
    const slides = elem.children;

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

    if (newSlide === elem.activeChild) { return; }

    if (elem.activeChild){
        shadow.querySelector('[href="#' + elem.activeChild.id +'"]').classList.remove('on');
    }

    elem.activeChild = newSlide;
    shadow.querySelector('[href="#' + elem.activeChild.id +'"]').classList.add('on');
}

element('slide-show', {
    template: '#slide-show',

    construct: function(elem, shadow) {
        // Create nav dot-thumbs for each slide with an id
        const dot = shadow.querySelector('.dot-thumb');

        if (dot) {
            createDots(elem, dot);
        }

        const slot = shadow.querySelector('slot');

        events('scroll', slot).each(function(e) {
            activate(elem, shadow);
        });

        testScrollBarWidth();
    },

    load: activate
});
