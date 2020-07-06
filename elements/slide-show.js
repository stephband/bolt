
import { get, weakCache } from '../../fn/module.js';
import { element, events, rect } from '../../dom/module.js';

const DEBUG = true;

const A = Array.prototype;

const assign = Object.assign;

const defaults = {
    path:   './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

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


element('slide-show', {
    template: '#slide-show',

    attributes: {},

    properties: {},

    construct: function(shadow) {
        const elem = this;
        const data = weakCache(this);

        /*shadow.querySelector('slot').addEventListener('scroll', (e) => {
            console.log('scroll', e);
        });*/

        // Create nav dot-thumbs for each slide with an id
        const dot = shadow.querySelector('.dot-thumb');
        if (dot) {
            createDots(elem, dot);
        }

        console.log(elem.innerHTML);
    },

    connect: function(shadow) {
        const elem = this;
        const slot = shadow.querySelector('slot');
        //const data = weakCache(this);

        events('scroll', slot)
        .each(function(e) {
            const elemLeft   = rect(elem).left;
            const slides = elem.children;
            let n = slides.length;
            let slide;

            while ((slide = slides[--n])) {
                const left = rect(slide).left;
                if (left <= elemLeft) {
                    break;
                }
            }

            const id = slide.id;
            shadow.querySelector('[href="#' + id +'"]').classList.add('on');
        });
    }
});
