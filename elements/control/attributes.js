
import by from '../../fn/modules/by.js';
import get from '../../fn/modules/get.js';
import nothing from '../../fn/modules/nothing.js';
import overload from '../../fn/modules/overload.js';
import requestTick from '../../fn/modules/request-tick.js';
import Privates from '../../fn/modules/privates.js';
import trigger from '../../dom/modules/trigger.js';
import { evaluate, invert, transform, transformTick, transformOutput, transformUnit } from './control.js';


export function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.law === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                value:        value,
                unitValue:    invert(data.law, value, data.min, data.max),
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
            return {
                value: value,
                unitValue: invert(data.law, value, data.min, data.max)
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
    // Remember attributers are setup in this declared order

    /**
    min="0"
    Value at lower limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    min: function(value) {
        this.min = value;
    },

    /**
    max="1"
    Value at upper limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    max: function(value) {
        this.max = value;
    },

    /**
    law="linear"
    Fader law. This is the name of a transform to be applied over the range 
    of the fader travel. Possible values are:

    - `"linear"`
    - `"linear-logarithmic"`
    - `"logarithmic"`
    - `"quadratic"`
    - `"cubic"`
    **/

    law: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        const scope    = privates.scope;

        data.law = value || 'linear';

        if (data.ticksAttribute) {
            data.ticks = createTicks(data, data.ticksAttribute);
        }

        if (data.step) {
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                data.stepsAttribute );
        }

        scope.unitZero(invert(data.law, 0, data.min, data.max));
    },

    /**
    unit=""
    The value's unit, if it has one. The output value and all ticks are 
    displayed in this unit. Possible values are:
    - `"dB"` – `0-1` is displayed as `-∞dB` to `0dB`
    - `"Hz"`
    **/

    unit: function(value) {
        Privates(this).data.unit = value;
    },

    /**
    ticks=""
    A space separated list of values at which to display tick marks. Values
    may be listed with or without units, eg:
    
    ```html
    ticks="0 0.2 0.4 0.6 0.8 1"
    ticks="-48dB -36dB -24dB -12dB 0dB"
    ```
    **/

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

    /**
    steps=""
    Steps is either:

    - A space separated list of values. As with `ticks`, values may be listed with or without units.
    - The string `"ticks"`. The values in the `ticks` attribute are used as steps.
    **/

    steps: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        data.stepsAttribute = value;

        // If steps is 'ticks' use ticks attribute as step value list
        data.steps = createSteps(data, value === 'ticks' ?
            data.ticksAttribute || '' :
            value );
    },

    /**
    value=""
    The initial value of the fader.
    **/

    value: function(value) {
        this.value = value;
    },

    prefix: function(value) {
        Privates(this).data.prefix = value;
    }
};

export const properties = {
    /**
    .type="number"
    A readonly property with the value `"number"` (provided for consistency 
    with native form elements, which all have a type).
    **/

    type: {
        value: 'number',
        enumerable: true
    },

    /**
    .min=0
    Value at lower limit of fader, as a number.
    **/

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
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },

    /**
    .max=1
    Value at lower limit of fader, as a number.
    **/

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
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },
    
    /**
    .value=0
    Current value of the field, as a number.
    **/
    
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
            /*
            if (data.max === undefined || data.min === undefined) {
                data.value = value;
                return;
            }*/

            let unitValue = invert(data.law, value, data.min, data.max);

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


/* Events */

/**
"input"
Sent continuously during a fader movement.
**/

function touchstart(e) {
    const target = e.target.closest('button');

    // Ignore non-ticks
    if (!target) { return; }

    const unitValue = parseFloat(target.value);
    const value = transform(this.data.law, unitValue, this.data.min, this.data.max) ;
    this.element.value = value;

    // Refocus the input (should not be needed now we have focus 
    // control on parent?) and trigger input event on element
    //            shadow.querySelector('input').focus();

    // Change event on element
    trigger('input', this.element);
}

function input(e) {
    const unitValue = parseFloat(e.target.value); 
    const value = transform(this.data.law, unitValue, this.data.min, this.data.max) ;
    this.element.value = value;

    // If the range has steps make sure the handle snaps into place
    if (this.data.steps) {
        e.target.value = this.data.unitValue;
    }
}

export const handleEvent = overload((e) => e.type, {
    'touchstart': touchstart,
    'mousedown': touchstart,
    'input': input
});
