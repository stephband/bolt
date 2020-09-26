
import { Observer } from '../../fn/module.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import { transform } from './control.js';
import { element, gestures, parseValue, trigger } from '../../dom/module.js';
import { attributes, properties } from './attributes.js';

const DEBUG = true;

const assign = Object.assign;

const defaults = {
    path:   './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

const gestureOptions = {
    threshold: 1,
    selector: '.handle'
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
    mode: 'closed',
    delegatesFocus: true,

    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow) {
        const data = elem.data = assign({}, defaults);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('[name]') || e.target;
            if (target.name !== 'unit-value') { return; }
            updateValue(elem, data, parseFloat(target.value));
        });

        gestures(gestureOptions, shadow)
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

    connect: function(elem, shadow) {
        // Rotary control must have value
        if (elem.data.value === undefined) {
            elem.value = elem.data.min;
        }
    }
})
