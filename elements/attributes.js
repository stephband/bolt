
import { by, get, Observer, nothing, requestTick, Privates } from '../../fn/module.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';

export function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.transform === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                root:         data,
                value:        value,
                unitValue:    invert(data.transform, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

function createSteps(data, tokens) {
    if (!tokens || /\s+any\s+/.test(tokens)) {
        return null;
    }

    const values = tokens.split(/\s+/);

    // Single step value not supported yet
    return values.length === 1 ?
        null :
        values
        .map(evaluate)
        .map((value) => {
            const unitValue = invert(data.transform, value, data.min, data.max);
            return {
                unitValue: unitValue,
                value: value
            };
        })
        .sort(by(get('unitValue'))) ;
}

function nearestStep(steps, unitValue) {
    let n = steps.length;
    let diff = Infinity;
    let step;

    while (n--) {
        const d = Math.abs(unitValue - steps[n].unitValue);

        if (d < diff) {
            diff = d;
            step = steps[n];
        }
    }

    return step;
}


export const attributes = {
    min: function(value) { this.min = value; },

    max: function(value) { this.max = value; },

    scale: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        this.data.transform = value || 'linear';

        if (data.ticksAttribute) {
            observer.ticks = createTicks(data, data.ticksAttribute);
        }

        if (data.step) {
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                data.stepsAttribute );
        }

        this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));
    },

    ticks: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        const scope    = privates.scope;

        data.ticksAttribute = value;

        // Create ticks
        scope.ticks(createTicks(data, value));

        // If step is 'ticks' update steps
        if (data.stepsAttribute === 'ticks') {
            data.steps = createSteps(data, value || '');
        }
    },

    steps: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        data.stepsAttribute = value;

        // If steps is 'ticks' use ticks attribute as step value list
        data.steps = createSteps(data, value === 'ticks' ?
            data.ticksAttribute || '' :
            value );
    },

    value: function(value) { this.value = value; },

    unit: function(value) {
        Privates(this).data.unit = value;
    },

    prefix: function(value) {
        Privates(this).data.prefix = value;
    }
};

export const properties = {
    type: {
        value: 'number',
        enumerable: true
    },

    min: {
        get: function() {
            return Privates(this).data.min;
        },

        set: function(value) {
            const privates = Privates(this);
            const data     = privates.data;
            const scope    = privates.scope;

            data.min = evaluate(value);

            // Check for readiness
            if (data.max === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.transform, data.value, data.min, data.max);
        },

        enumerable: true
    },

    max: {
        get: function() {
            return Privates(this).data.max;
        },

        set: function(value) {
            const privates = Privates(this);
            const data     = privates.data;
            const scope    = privates.scope;

            data.max = evaluate(value);

            if (data.min === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.transform, data.value, data.min, data.max);
        },

        enumerable: true
    },

    value: {
        get: function() {
            return Privates(this).data.value;
        },

        set: function(value) {
            const privates  = Privates(this);
            const data      = privates.data;
            const scope     = privates.scope;
            const internals = privates.internals;

            value = evaluate(value);

            if (value === data.value) { return; }

            // Are we ready?
            if (data.max === undefined || data.min === undefined) {
                data.value = value;
                return;
            }

            let unitValue = invert(data.transform, value, data.min, data.max);

            // Round to nearest step
            if (data.steps) {
                const step = nearestStep(data.steps, unitValue);
                value     = step.value;
                unitValue = step.unitValue;
            }

            if (value === data.value) { return; }
            data.value = value;
            data.unitValue = unitValue;

            internals.setFormValue(value);
            scope.displayValue(transformOutput(data.unit, value));
            scope.displayUnit(transformUnit(data.unit, value));
            scope.unitValue(unitValue);
        },

        enumerable: true
    }
};
