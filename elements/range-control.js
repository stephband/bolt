
import { Observer, nothing, requestTick } from '../../fn/module.js';
import { evaluate, invert, transform, transformOutput, transformTick, transformUnit  } from './control.js';
import { element } from '../../dom/module.js';
import Sparky, { mount, config } from '../../sparky/module.js';

const DEBUG = false;//window.DEBUG === undefined || window.DEBUG;

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
                tickValue:    invert(data.transform, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

function updateValue(element, data, inputValue) {
    const observer   = Observer(data);
    observer.inputValue = inputValue;

    const value = transform(data.transform, inputValue, data.min, data.max) ;
    element.value = value;
}


element('range-control', {

    template: '#range-control',

    attributes: {
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
    },

    properties: {
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
                observer.inputValue = invert(data.transform, data.value, data.min, data.max);
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
                observer.inputValue = invert(data.transform, data.value, data.min, data.max);
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
                    observer.inputValue   = invert(data.transform, value, data.min, data.max);
                });
            },

            enumerable: true
        }
    },

    construct: function(shadow) {
        this.data = assign({}, defaults);
    },

    connect: function(shadow) {
        if (DEBUG) { console.log('<range-control> added to document', this.value, this.data); }

        const data     = this.data;
        const observer = Observer(data);

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
            const target = e.target.closest('button') || e.target;
            if (target.name !== 'control-tick') { return; }
            updateValue(this, data, parseFloat(target.value));

            // Refocus the input
            shadow
            .getElementById('input')
            .focus();
        });

        shadow.addEventListener('input', (e) => {
            if (e.target.name !== 'control-input') { return; }
            updateValue(this, data, parseFloat(e.target.value));
        });
    }
})
