import { Observer, nothing, requestTick } from '../../fn/module.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';

function createTicks(data, tokens) {
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
            //console.log(value, invert(data.transform, value, data.min, data.max), transformTick(data.unit, value));
            return Object.freeze({
                root:         data,
                value:        value,
                tickValue:    invert(data.transform || 'linear', value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

export const attributes = {
    min:       function(value) { this.min = value; },

    max:       function(value) { this.max = value; },

    value:     function(value) { this.value = value; },

    prefix:    function(value) { this.data.prefix = value; },

    transform: function(value) { this.data.transform = value; },

    unit:      function(value) { this.data.unit = value; },

    ticks: function(value) {
        const data     = this.data;
        const observer = Observer(data);
        observer.ticks = createTicks(data, value);
    }
};


export const properties = {
    type: {
        value: 'number',
        enumerable: true
    },

    min: {
        get: function() {
            return this.data.min;
        },

        set: function(value) {
            const data = this.data;
            value = evaluate(value);

            if (value === data.min) { return; }

            const observer = Observer(data);
            observer.min   = evaluate(value);

            // Check for readiness
            if (data.max === undefined || data.value === undefined) { return; }

            observer.ticks = createTicks(data, this.getAttribute('ticks') || '');
            observer.unitValue = invert(data.transform, data.value, data.min, data.max);
        },

        enumerable: true
    },

    max: {
        get: function() {
            return this.data.max;
        },

        set: function(value) {
            const data = this.data;
            value = evaluate(value);

            if (value === data.max) { return; }

            const observer = Observer(data);
            observer.max   = evaluate(value);

            // Check for readiness
            if (data.min === undefined || data.value === undefined) { return; }

            observer.ticks = createTicks(data, this.getAttribute('ticks') || '');
            observer.unitValue = invert(data.transform, data.value, data.min, data.max);
        },

        enumerable: true
    },

    value: {
        get: function() {
            return this.data.value;
        },

        set: function(value) {
            const data = this.data;
            value = evaluate(value);

            if (value === data.value) { return; }
            data.value = value;

            const observer = Observer(data);

            if (data.max === undefined || data.min === undefined) { return; }

            // Todo: set value is being called from within a Sparky frame,
            // which is normal, but it's messing with the renderer cueing for
            // range-control's inner Sparky mounting. I think cueing needs to
            // improve, with data updates being done in one round and all
            // render processes delayed by a tick. I'm not sure. Anyway, as
            // a bodge job, we delay by a tick here. This may mean DOM update
            // values are a frame behind. Investigate.
            requestTick(() => {
                observer.displayValue = transformOutput(data.unit, value);
                observer.displayUnit  = transformUnit(data.unit, value);
                observer.unitValue   = invert(data.transform || 'linear', value, data.min, data.max);
                this.style.setProperty('--unit-value', data.unitValue);
            });
        },

        enumerable: true
    }
};