
import { clamp, Observer, observe, requestTick } from '../../fn/module.js';
import { transform } from './control.js';
import { element, trigger } from '../../dom/module.js';
import Sparky, { mount, config } from '../../sparky/module.js';
import { attributes, createTicks, properties } from './attributes.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';

const DEBUG = true;

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
        sparky.label = 'Sparky (<range-control> tick)';

        // Return sparky
        return sparky;
    },

    attributePrefix:  ':',
    attributeFn:      'fn'
});

function updateValue0(elem, data, value) {
    const observer = Observer(data);

    // Clamp to min-max
    let value0     = clamp(data.min, data.max, value);
    let unitValue0 = invert(data.transform, value0, data.min, data.max);

    // Round to nearest step
    if (data.steps) {
        const step = nearestStep(data.steps, unitValue0);
        value0     = step.value;
        unitValue0 = step.unitValue;
    }

    data.value[0] = value0;

    // Gaurantee that value 0 is less than or equal to value 1
    if (data.value[1] < value0) {
        updateValue1(elem, data, value0);
    }

    observer.unitValue0    = unitValue0;
    observer.displayValue0 = transformOutput(data.unit, value0);
    elem.style.setProperty('--unit-value-0', unitValue0);
}

function updateValue1(elem, data, value) {
    const observer = Observer(data);

    // Clamp to min-max
    let value1     = clamp(data.min, data.max, value);
    let unitValue1 = invert(data.transform, value1, data.min, data.max);

    // Round to nearest step
    if (data.steps) {
        const step = nearestStep(data.steps, unitValue1);
        value1     = step.value;
        unitValue1 = step.unitValue;
    }

    data.value[1] = value1;

    // Gaurantee that value 0 is less than or equal to value 1
    if (data.value[0] > value1) {
        updateValue0(elem, data, value1);
    }

    observer.unitValue1    = unitValue1;
    observer.displayValue1 = transformOutput(data.unit, value1);
    elem.style.setProperty('--unit-value-1', unitValue1);
}

function updateUnitValue0(elem, data, unitValue0) {
    const observer = Observer(data);
    let value0;

    // Round to nearest step
    if (data.steps) {
        const step = nearestStep(data.steps, unitValue0);
        value0     = step.value;
        unitValue0 = step.unitValue;
    }
    else {
        value0 = transform(data.transform, unitValue0, data.min, data.max);
    }

    // Gaurantee that value 0 is less than or equal to value 1
    if (data.unitValue1 < unitValue0) {
        updateUnitValue1(elem, data, unitValue0);
    }

    data.value[0]          = value0;
    observer.unitValue0    = unitValue0;
    observer.displayValue0 = transformOutput(data.unit, value0);
    elem.style.setProperty('--unit-value-0', unitValue0);
}

function updateUnitValue1(elem, data, unitValue1) {
    const observer = Observer(data);
    let value1;

    // Round to nearest step
    if (data.steps) {
        const step = nearestStep(data.steps, unitValue1);
        value1     = step.value;
        unitValue1 = step.unitValue;
    }
    else {
        value1 = transform(data.transform, unitValue1, data.min, data.max);
    }

    // Gaurantee that value 1 stays more than or equal to value 0
    if (data.unitValue0 > unitValue1) {
        updateUnitValue0(elem, data, unitValue1);
    }

    data.value[1]          = value1;
    observer.unitValue1    = unitValue1;
    observer.displayValue1 = transformOutput(data.unit, value1);

    elem.style.setProperty('--unit-value-1', unitValue1);
}

element('minmax-control', {
    template: '#minmax-control',

    attributes: attributes,

    properties: {
        type: {
            value: 'array',
            enumerable: true
        },

        min: {
            get: function() {
                return this.data.min;
            },

            set: function(min) {
                const data     = this.data;
                const observer = Observer(data);

                min = evaluate(min);
                min = data.min = min > data.max ? data.max : min ;

                // Check for readiness
                if (data.max === undefined) { return; }
                observer.ticks = createTicks(data, data.ticksAttribute);
                this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

                // Check for readiness
                if (data.value === undefined) { return; }

                if (data.value[1] < min) {
                    data.value[1] = min;
                    updateValue1(this, data, min);
                }

                if (data.value[0] < min) {
                    data.value[0] = min;
                    updateValue0(this, data, min);
                }
            },

            enumerable: true
        },

        max: {
            get: function() {
                return this.data.max;
            },

            set: function(max) {
                const data     = this.data;
                const observer = Observer(data);

                max = evaluate(max);
                max = data.max = max < data.min ? data.min : max ;

                // Check for readiness
                if (data.min === undefined) { return; }
                observer.ticks = createTicks(data, data.ticksAttribute);
                this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

                // Check for readiness
                if (data.value === undefined) { return; }

                if (data.value[0] > max) {
                    data.value[0] = max;
                    updateValue0(this, data, max);
                }

                if (data.value[1] > max) {
                    data.value[1] = max;
                    updateValue1(this, data, max);
                }
            },

            enumerable: true
        },

        value: {
            get: function() {
                // Observer allows for setting minmax.value[0] = n;
                return Observer(this.data.value);
            },

            set: function(value) {
                if (typeof value !== 'object') {
                    throw new TypeError('<minmax-control>.value must be an object or array ' + (typeof value));
                }

                const data = this.data;

                if (value === data.value) { return; }
                data.value = value;

                if (data.max === undefined || data.min === undefined) { return; }

                observe('0', (value0) => updateValue0(this, data, value0), data.value);
                observe('1', (value1) => updateValue1(this, data, value1), data.value);
            },

            enumerable: true
        }
    },

    construct: function(elem, shadow) {
        const data = elem.data = assign({}, defaults);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        /*shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('button') || e.target;
            if (target.name !== 'control-tick') { return; }
            updateValue(elem, data, parseFloat(target.value));

            // Refocus the input
            shadow
            .getElementById('input')
            .focus();

            trigger('input', elem);
        });*/

        // Listen to UI
        shadow.addEventListener('input', (e) => {
            if (e.target.name === 'unit-value-0') {
                updateUnitValue0(elem, data, parseFloat(e.target.value));
            }

            if (e.target.name === 'unit-value-1') {
                updateUnitValue1(elem, data, parseFloat(e.target.value));
            }
        });

        // Snap input handle to position at the end of travel
        shadow.addEventListener('change', (e) => {
            if (!data.steps) { return; }

            if (e.target.name === 'unit-value-0') {
                e.target.value = data.unitValue0;
            }

            if (e.target.name === 'unit-value-1') {
                e.target.value = data.unitValue1;
            }
        });

        // Mount template
        mount(shadow, mountSettings).push(data);
    },

    connect: function(elem, shadow) {
        // Range control must have value, set it to min if it does not yet
        if (elem.data.value === undefined) {
            elem.value = [elem.data.min, elem.data.max];
        }

        // Mount template
        //mount(shadow, mountSettings).push(elem.data);
    }
})
