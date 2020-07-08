
import { Observer } from '../../fn/module.js';
import { transform } from './control.js';
import { element, trigger } from '../../dom/module.js';
import Sparky, { mount, config } from '../../sparky/module.js';
import { attributes, properties } from './attributes.js';

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

function updateValue(element, data, unitValue) {
    const observer = Observer(data);
    observer.unitValue = unitValue;

    const value = transform(data.transform, unitValue, data.min, data.max) ;
    element.value = value;
}


element('range-control', {
    template: '#range-control',
    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow) {
        const data = this.data = assign({}, defaults);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('button') || e.target;
            if (target.name !== 'control-tick') { return; }
            updateValue(elem, data, parseFloat(target.value));

            // Refocus the input
            shadow
            .getElementById('input')
            .focus();

            trigger('input', elem);
        });

        shadow.addEventListener('input', (e) => {
            if (e.target.name !== 'control-input') { return; }
            updateValue(elem, data, parseFloat(e.target.value));
        });

        // Snap to position at the end of travel
        shadow.addEventListener('change', (e) => {
            if (e.target.name !== 'control-input') { return; }
            if (!data.steps) { return; }
            e.target.value = elem.data.unitValue;
        });
    },

    connect: function(elem, shadow) {
        // Range control must have value
        if (this.data.value === undefined) {
            this.value = this.data.min;
        }

        // Mount template
        mount(shadow, mountSettings).push(this.data);
    }
})
