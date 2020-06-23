
import { Observer } from '../../fn/module.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import { transform } from './control.js';
import { element, gestures, trigger } from '../../dom/module.js';
import Sparky, { mount, config } from '../../sparky/module.js';
import { attributes, properties } from './attributes.js';

const DEBUG = false;//true;

const assign = Object.assign;

const defaults = {
    path: './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

const mountSettings = Object.assign({}, config, {
    mount: function(node, options) {
        // Does the node have Sparkyfiable attributes?
        const attrFn = node.getAttribute(options.attributeFn);
        //const attrInclude = node.getAttribute(options.attributeSrc);

        if (!attrFn/* && !attrInclude*/) { return; }

        options.fn = attrFn;
        //options.include = attrInclude;
        var sparky = Sparky(node, options);

        // This is just some help for logging
        sparky.label = 'Sparky (<rotary-control> tick)';

        // Return sparky
        return sparky;
    },

    attributePrefix:  ':',
    attributeFn:      'fn'
});

const rangePxY = 320;

function updateValue(element, data, unitValue) {
    const observer = Observer(data);
    observer.unitValue = unitValue;
    const value = transform(data.transform, unitValue, data.min, data.max) ;
    element.value = value;
}

element('rotary-control', {
    template: '#rotary-control',
    attributes: attributes,
    properties: properties,

    construct: function(shadow) {
        this.data = assign({}, defaults);
    },

    connect: function(shadow) {
        if (DEBUG) { console.log('<range-control> added to document', this.value, this.data); }

        const elem = this;
        const data = this.data;
        const knob = shadow.querySelector('.knob');

        // Range control must have value
        if (this.data.value === undefined) {
            this.value = this.data.min;
        }

        // Mount template
        mount(shadow, mountSettings).push(data);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('[name]') || e.target;
            if (target.name !== 'unit-value') { return; }
            updateValue(elem, data, parseFloat(target.value));
            trigger('input', elem);
        });

        gestures({ threshold: 1 }, knob)
        .each(function(events) {
            // First event is touchstart or mousedown
            const e0     = events.shift();
            const y0     = e0.clientY;
            const y      = data.unitValue;
            let dy;

            events
            .latest()
            .each(function (e) {
                dy = y0 - e.clientY;
                var ry = clamp(0, 1, y + dy / rangePxY);
                elem.style.setProperty('--unit-value', ry);
                updateValue(elem, data, ry);
                trigger('input', elem);
            });
        });
    }
})
