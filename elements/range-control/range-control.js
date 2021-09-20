

/**
<range-control>

Import `<range-control>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="range-control.rolled.js"></script>
<range-control name="ratio" min="-1" max="1" ticks="-1 -0.8 -0.6 -0.4 -0.2 0 0.2 0.4 0.6 0.8 1" value="0">Scale</range-control>
<range-control name="gain" min="-48dB" max="0dB" ticks="-∞dB -48dB -42dB -36dB -30dB -24dB -18dB -12dB -6dB 0dB" law="linear-logarithmic" unit="dB" value="-6dB">Volume</range-control>
<range-control name="frequency" min="20" max="20000" ticks="20Hz 100Hz 200Hz 1kHz 2kHz 10kHz 20kHz" law="logarithmic" unit="Hz" value="20Hz">Frequency</range-control>
<range-control name="rating" min="1" max="5" ticks="1 2 3 4 5" steps="ticks" law="linear" value="3">Rating</range-control>
```

**/

/*
About volume controls:
https://www.dr-lex.be/info-stuff/volumecontrols.html

Safari 14 crashes when clicking on elements with delegateFocus:
https://github.com/material-components/material-components-web-components/issues/1720
*/

import Privates from '../../fn/modules/privates.js';
import { clamp } from '../../fn/modules/clamp.js';
import overload from '../../fn/modules/overload.js';
import create from '../../dom/modules/create.js';
import element from '../../dom/modules/element.js';
import { attributes, properties, handleEvent } from './attributes.js';

const DEBUG = true;

const assign = Object.assign;
const define = Object.defineProperties;

// Get path to dir of this module
const path   = import.meta.url.replace(/\/[^\/]*([?#].*)?$/, '/');

const defaults = {
    law: 'linear',
    min: 0,
    max: 1
};


/* Shadow */

function createTemplate(elem, shadow) {
    const link   = create('link',  { rel: 'stylesheet', href: path + 'module.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'input', html: '<slot></slot>', part: 'label' });
    const input  = create('input', { type: 'range', id: 'input', name: 'unit-value', min: '0', max: '1', step: 'any' });
    const text   = create('text');
    const abbr   = create('abbr');
    const output = create('output', { children: [text, abbr], part: 'output' });
    const marker = create('text', '');

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
            if (input.value !== unitValue + '') {
                input.value = unitValue + '';
            }

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
            // Add and remove output > abbr
            if (displayUnit) {
                if (!abbr.parentNode) {
                    output.appendChild(abbr);
                }

                // Update abbr text
                abbr.textContent = displayUnit;
            }
            else if (abbr.parentNode) {
                abbr.remove();
            }
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
                        text: scope.displayValue,
                        part: 'tick'
                    });

                    marker.before(button);
                    buttons.push(button);
                });
            };
        })([])
    };
}

/* Element */

export default element('range-control', {
    template: function(elem, shadow) {
        const privates = Privates(elem);
        privates.scope = createTemplate(elem, shadow);
    },

    mode:       'closed',
    focusable:  true,
    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow, internals) {
        // Setup internal data store `privates`
        const privates = Privates(elem);
        const data     = privates.data  = assign({}, defaults);

        privates.element     = elem;
        privates.shadow      = shadow;
        privates.internals   = internals;
        privates.handleEvent = handleEvent;

        // Listen to touches on ticks
        shadow.addEventListener('mousedown', privates);
        shadow.addEventListener('touchstart', privates);

        // Listen to range input
        shadow.addEventListener('input', privates);
    },

    connect: function(elem, shadow) {
        const privates = Privates(elem);
        const data     = privates.data;

        // Range control must have value
        if (data.value === undefined) {
            elem.value = clamp(data.min, data.max, 0);
        }
    }
});
