
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

const onceOptions = {
    once: true
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

    construct: function(shadow) {
        const elem = this;
        //const data = weakCache(this);

        /*shadow.querySelector('slot').addEventListener('scroll', (e) => {
            console.log('scroll', e);
        });*/

        // Create nav dot-thumbs for each slide with an id
        const dot = shadow.querySelector('.dot-thumb');
        if (dot) {
            createDots(elem, dot);
        }

        const slot = shadow.querySelector('slot');

        let slide;

        function activate(e) {
            const elemRect = rect(elem);
            const elemCentre = elemRect.left + elemRect.width / 2;
            const slides = elem.children;

            let n = slides.length;
            let newSlide;

            while ((newSlide = slides[--n])) {
                const left = rect(newSlide).left;
                if (left <= elemCentre) {
                    break;
                }
            }

            if (newSlide === slide) { return; }

            if (slide){
                shadow.querySelector('[href="#' + slide.id +'"]').classList.remove('on');
            }

            slide = newSlide;
            shadow.querySelector('[href="#' + slide.id +'"]').classList.add('on');
        }

        events('scroll', slot).each(activate);

        // Wait for stylesheets to load to initiate first active nav thumb
        const links = shadow.querySelectorAll('link');
        links.forEach(function(node) {
            let count = 0;
            node.addEventListener('load', function(e) {
                if (++count >= links.length) {
                    activate();
                }
            }, onceOptions);
        });
    },

    connect: function(shadow) {
        //const elem = this;
    }
});
