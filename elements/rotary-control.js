
import { Observer } from '../../fn/module.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import { transform } from './control.js';
import { element, gestures, parseValue, trigger } from '../../dom/module.js';
import Sparky, { mount, config } from '../../sparky/module.js';
import { attributes, properties } from './attributes.js';

const DEBUG = true;

const assign = Object.assign;

const defaults = {
    path:   './components/controls',
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

const gestureOptions = {
    threshold: 1
};

function updateValue(element, data, unitValue) {
    const observer = Observer(data);
    observer.unitValue = unitValue;

    const value = transform(data.transform, unitValue, data.min, data.max) ;
    element.value = value;

    trigger('input', element);
}

element('rotary-control', {
    template: '#rotary-control',
    attributes: attributes,
    properties: properties,

    construct: function(shadow) {
        const elem = this;
        const data = this.data = assign({}, defaults);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('[name]') || e.target;
            if (target.name !== 'unit-value') { return; }
            updateValue(elem, data, parseFloat(target.value));
        });

        const knob = shadow.querySelector('.knob');

        gestures(gestureOptions, knob)
        .each(function(events) {
            // First event is touchstart or mousedown
            const e0 = events.shift();
            const y0 = e0.clientY;
            const y  = data.unitValue;
            const touchValue = getComputedStyle(elem).getPropertyValue('--touch-range');
            const touchRange = parseValue(touchValue);

            let dy;

            events
            .latest()
            .each(function (e) {
                dy = y0 - e.clientY;
                var unitValue = clamp(0, 1, y + dy / touchRange);
                updateValue(elem, data, unitValue);
            });
        });
    },

    connect: function(shadow) {
        // Rotary control must have value
        if (this.data.value === undefined) {
            this.value = this.data.min;
        }

        // Mount template
        mount(shadow, mountSettings).push(this.data);
    }
})
