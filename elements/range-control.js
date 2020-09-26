
import { Privates, Observer, observe } from '../../fn/module.js';
import { transform } from './control.js';
import { create, element, trigger } from '../../dom/module.js';
import { attributes, properties } from './attributes.js';

const DEBUG = true;

const assign = Object.assign;
const define = Object.defineProperties;

const defaults = {
    transform: 'linear',
    min:    0,
    max:    1
};

export const config = {
    path: '/source/bolt/elements/'
};

function createEach(createNode) {
    const mark = create('text', '');
    return mark;
}

function createTemplate(elem, shadow) {
    const link   = create('link',  { rel: 'stylesheet', href: config.path + 'range-control.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'input', html: '<slot></slot>' });
    const input  = create('input', { type: 'range', id: 'input', name: 'unit-value', min: '0', max: '1', step: 'any' });
    const text   = create('text');
    const abbr   = create('abbr');
    const output = create('output', { children: [text, abbr] });
    const marker = DEBUG ?
        create('comment', ' ticks ') :
        create('text', '') ;

    shadow.appendChild(link);
    shadow.appendChild(style);
    shadow.appendChild(label);
    shadow.appendChild(input);
    shadow.appendChild(output);
    shadow.appendChild(marker);

    // Get the :host {} style rule from style
    const css = style.sheet.cssRules[0].style;

    return {
        'unitValue': function(unitValue) {
            // Check that input is not the currently active node before updating
            //if (input.getRootNode().activeElement !== input) {
                // Check that the input does not already have the value
                if (input.value !== unitValue + '') {
                    input.value = unitValue + '';
                }
            //}

            css.setProperty('--unit-value', unitValue);
        },

        'unitZero': function(unitZero) {
            css.setProperty('--unit-zero', unitZero);
        },

        'displayValue': function(displayValue) {
            text.textContent = displayValue;
            css.setProperty('--display-value', displayValue);
        },

        'displayUnit': function(displayUnit) {
            abbr.textContent = displayUnit;
        },

        'ticks': (function(buttons) {
            return function(scopes) {    
                // Clear out existing ticks
                buttons.forEach((node) => node.remove());
                buttons.length = 0;

                // Create new ticks and put them in the dom    
                scopes.forEach(function(scope) {
                    const button = create('button', {
                        type: 'button',
                        name: 'unit-value',
                        value: scope.unitValue,
                        style: '--tick-value: ' + scope.unitValue + ';',
                        text: scope.displayValue 
                    });

                    marker.before(button);
                    buttons.push(button);
                });
            };
        })([])
    };
}

export default element('range-control', {
    template: '',

    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow, internals) {
        const privates = Privates(elem);
        const data     = privates.data  = assign({}, defaults);
        const scope    = privates.scope = createTemplate(elem, shadow, internals);
        privates.internals = internals;

        // Listen to touches on tick buttons
        function down(e) {
            if (e.target.type !== 'button') { return; }

            const unitValue = parseFloat(e.target.value);
            const value = transform(data.transform, unitValue, data.min, data.max) ;

            elem.value = value;

            // Refocus the input (should not be needed now we have focus 
            // control on parent?) and trigger input event on element
//            shadow.querySelector('input').focus();

            // Change event on element
            trigger('change', elem);
        }

        shadow.addEventListener('mousedown', down);
        shadow.addEventListener('touchstart', down);

        // Listen to range input
        shadow.addEventListener('input', (e) => {
            const unitValue = parseFloat(e.target.value); 
            const value = transform(data.transform, unitValue, data.min, data.max) ;
            elem.value = value;

            // If the range has steps make sure the handle snaps into place
            if (data.steps) {
                e.target.value = data.unitValue;
            }
        });
    },

    connect: function(elem, shadow) {
        const privates = Privates(elem);
        const data     = privates.data;

        // Range control must have value
        if (data.value === undefined) {
            elem.value = data.min;
        }
    }
});
