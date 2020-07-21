
import { clamp, get, Observer, observe, overload } from '../../fn/module.js';
import { transform } from './control.js';
import { element } from '../../dom/module.js';
import { setupSparky, mountSparky } from '../../sparky/modules/sparky.js';
import { mount, config } from '../../sparky/module.js';
import { attributes, createTicks } from './attributes.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';

const DEBUG = window.DEBUG === true;

const assign = Object.assign;

const getTargetName = (e) => e.target.name;

const defaults = {
    transform: 'linear',
    min:   0,
    max:   1,

    // Data object is passed to addEventListener directly, allowing
    // a handleEvents handler to listen to events. Not sure this is best -
    // we could split handlers into input and change handlers here already
    // without delegating, although we'd need some extra handler objects...
    handleEvent: overload(get('type'), {
        'input': overload(getTargetName, {
            'unit-value-0': function(e) {
                updateUnitValue0(this.shadow.host, this, parseFloat(e.target.value));
            },

            'unit-value-1': function(e) {
                updateUnitValue1(this.shadow.host, this, parseFloat(e.target.value));
            }
        }),

        'change': overload(getTargetName, {
            'unit-value-0': function(e) {
                // Snap input handle to position at the end of travel
                if (!this.steps) { return; }
                e.target.value = this.unitValue0;
            },

            'unit-value-1': function(e) {
                // Snap input handle to position at the end of travel
                if (!this.steps) { return; }
                e.target.value = this.unitValue1;
            }
        })
    })
};

const mountSettings = Object.assign({}, config, {
    mount: mountSparky,
    attributePrefix:  ':',
    attributeFn:      'fn'
});


/* Update value */

function setFormValue(name, internals, formdata, value) {
    // We use formdata to format form query into the correct format
    formdata.set(name, value[0]);
    formdata.append(name, value[1]);
    internals.setFormValue(formdata);
}

function updateValue0(host, data, value) {
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
        updateValue1(host, data, value0);
    }

    observer.unitValue0    = unitValue0;
    observer.displayValue0 = transformOutput(data.unit, value0);
    host.style.setProperty('--unit-value-0', unitValue0);
    setFormValue(host.name, data.internals, data.formdata, data.value);
}

function updateValue1(host, data, value) {
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
        updateValue0(host, data, value1);
    }

    observer.unitValue1    = unitValue1;
    observer.displayValue1 = transformOutput(data.unit, value1);
    host.style.setProperty('--unit-value-1', unitValue1);
    setFormValue(host.name, data.internals, data.formdata, data.value);
}

function updateUnitValue0(host, data, unitValue0) {
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
        updateUnitValue1(host, data, unitValue0);
    }

    data.value[0]          = value0;
    observer.unitValue0    = unitValue0;
    observer.displayValue0 = transformOutput(data.unit, value0);
    host.style.setProperty('--unit-value-0', unitValue0);
    setFormValue(host.name, data.internals, data.formdata, data.value);
}

function updateUnitValue1(host, data, unitValue1) {
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
        updateUnitValue0(host, data, unitValue1);
    }

    data.value[1]          = value1;
    observer.unitValue1    = unitValue1;
    observer.displayValue1 = transformOutput(data.unit, value1);

    host.style.setProperty('--unit-value-1', unitValue1);
    setFormValue(host.name, data.internals, data.formdata, data.value);
}


/* Element definition */

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
                if (typeof value === 'string') {
                    value = value.split(',').map(parseFloat);
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

    construct: function(host, shadow, internals) {
        const data = host.data = assign({
            shadow:    shadow,
            internals: internals,
            formdata:  new FormData()
        }, defaults);

        // Listen to UI
        shadow.addEventListener('input', data);
        shadow.addEventListener('change', data);

        // Mount template, extend shadow with Sparky push() and stop()
        const sparky = setupSparky(shadow, shadow, mountSettings);
    },

    connect: function(host, shadow) {
        // Range control must have value, set it to min if it does not yet
        if (host.data.value === undefined) {
            host.value = [host.data.min, host.data.max];
        }

        // Push data in
        shadow.push(host.data);
    }
})
