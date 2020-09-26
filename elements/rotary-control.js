
import { Observer } from '../../fn/module.js';
import Privates from '../../fn/modules/privates.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import create from '../../dom/modules/create.js';
import { transform } from './control.js';
import { element, gestures, parseValue, trigger } from '../../dom/module.js';
import { attributes, properties } from './attributes.js';

const DEBUG = true;

const assign = Object.assign;

const defaults = {
    transform: 'linear',
    min:    0,
    max:    1
};

const config = {
    path: window.customElementStylesheetPath || ''
};

function createTemplate(elem, shadow, internals) {
    const link   = create('link',  { rel: 'stylesheet', href: config.path + 'rotary-control.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'input', html: '<slot></slot>' });
    const handle = create('div', { part: 'handle' });
    const text   = create('text');
    const abbr   = create('abbr');
    const output = create('output', { children: [text, abbr], part: 'output' });
    const marker = DEBUG ?
        create('comment', ' ticks ') :
        create('text', '') ;

    shadow.appendChild(link);
    shadow.appendChild(style);
    shadow.appendChild(label);
    shadow.appendChild(handle);
    shadow.appendChild(output);
    shadow.appendChild(marker);

    // Get the :host {} style rule from style
    const css = style.sheet.cssRules[0].style;

    return {
        'unitValue': function(unitValue) {
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
                    const span = create('span', {
                        text: scope.displayValue,
                        style: 'transform: translate3d(-50%, 0, 0) rotate3d(0, 0, 1, calc(-1 * (var(--rotation-start) + ' + scope.unitValue + ' * var(--rotation-range)))) translate3d(calc(' + Math.sin(scope.unitValue * 6.28318531) + ' * -33%), 0, 0);'  
                    });

                    const button = create('button', {
                        type: 'button',
                        name: 'unit-value',
                        value: scope.unitValue,
                        style: '--unit-value: ' + scope.unitValue + ';',
                        children: [span],
                        part: 'tick'
                    });

                    marker.before(button);
                    buttons.push(button);
                });
            };
        })([])
    };
}

function updateValue(element, data, unitValue) {
    const value = transform(data.transform, unitValue, data.min, data.max) ;
    element.value = value;
}

element('rotary-control', {
    template: function(elem, shadow) {
        const privates = Privates(elem);
        privates.scope = createTemplate(elem, shadow);
    },

    mode:       'closed',
    focusable:  true,
    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow, internals) {
        const privates = Privates(elem);
        const data     = privates.data  = assign({}, defaults);
        const scope    = privates.scope = createTemplate(elem, shadow, internals);

        privates.internals = internals;

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        shadow.addEventListener('mousedown', (e) => {
            const target = e.target.closest('[name]') || e.target;
            if (target.name !== 'unit-value') { return; }
            updateValue(elem, data, parseFloat(target.value));
            trigger('change', elem);
        });

        gestures({ threshold: 1, selector: 'div' }, shadow)
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
                trigger('input', elem);
            });
        });
    },

    connect: function(elem, shadow) {
        const privates = Privates(elem);
        const data     = privates.data;

        // Rotary control must have value
        if (data.value === undefined) {
            elem.value = data.min;
        }
    }
})
