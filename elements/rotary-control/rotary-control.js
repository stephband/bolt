
/**
<rotary-control>

Import `<rotary-control>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="rotary-control.rolled.js"></script>
<rotary-control name="pan" min="-1" max="1" ticks="-1 -0.8 -0.6 -0.4 -0.2 0 0.2 0.4 0.6 0.8 1">Pan</rotary-control>
<rotary-control name="gain" min="-48dB" max="0dB" ticks="-∞dB -48dB -42dB -36dB -30dB -24dB -18dB -12dB -6dB 0dB" law="linear-logarithmic" unit="dB" value="-6dB">Volume</rotary-control>
```

**/

/*
The CSS that makes this web component flexible may look a little funky. The
width of the component dictates the size of the handle, track and tick radius,
then those elements push the (automatic) height of the component. The ticks are
normally layed out vertically before being transformed. They are usually the
tallest element. If there are no ticks the component will collapse a bit
smaller.
*/

import Privates from '../../fn/modules/privates.js';
import { clamp } from '../../fn/modules/clamp.js';
import overload from '../../fn/modules/overload.js';
import create from '../../dom/modules/create.js';
import { transform } from './control.js';
import element from '../../dom/modules/element.js';
import gestures from '../../dom/modules/gestures.js';
import parseValue from '../../dom/modules/parse-length.js';
import trigger from '../../dom/modules/trigger.js';
import { attributes, properties, handleEvent } from './attributes.js';

//console.log('<rotary-control> stephen.band/bolt/elements/rotary-control.html');

const DEBUG = true;

const assign = Object.assign;

// Get path to dir of this module
const path   = import.meta.url.replace(/\/[^\/]*([?#].*)?$/, '/');

const defaults = {
    law: 'linear',
    min: 0,
    max: 1
};


/* Shadow */

function createTemplate(elem, shadow, internals) {
    const link   = create('link',  { rel: 'stylesheet', href: path + 'module.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'input', html: '<slot></slot>' });
    const handle = create('div', { class: 'handle' });
    const text   = create('text');
    const abbr   = create('abbr');
    const output = create('output', { children: [text, abbr], part: 'output' });
    const marker = create('text', '') ;

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


/* Events */

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

        privates.element     = elem;
        privates.shadow      = shadow;
        privates.internals   = internals;
        privates.handleEvent = handleEvent;

        shadow.addEventListener('mousedown', privates);

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
                const value = transform(data.law, unitValue, data.min, data.max) ;
                elem.value = value;
                // Doesn't work
                //elem.dispatchEvent(new InputEvent('input'));
                trigger('input', elem);
            });
        });
    },

    connect: function(elem, shadow) {
        const privates = Privates(elem);
        const data     = privates.data;

        // Rotary control must have value
        if (data.value === undefined) {
            elem.value = clamp(data.min, data.max, 0);
        }
    }
})
