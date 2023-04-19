
/* Enabales left-right swipe gestures on .switch-label */

import { clamp }   from '../../fn/modules/clamp.js';
import overload    from '../../fn/modules/overload.js';
import attribute   from '../../dom/modules/attribute.js';
import closest     from '../../dom/modules/closest.js';
import gestures    from '../../dom/modules/gestures.js';
import { trigger } from '../../dom/modules/trigger.js';
import { px }      from '../../dom/modules/parse-length.js';


const selector = '.switch-label';


function switchState(label) {
    var id = attribute('for', label);
    var input = document.getElementById(id);
    return input.checked;
}

function switchOn(label) {
    var id = attribute('for', label);
    var input = document.getElementById(id);
    if (input.checked) { return; }
    input.checked = true;
    trigger('change', input);
}

function switchOff(label) {
    var id = attribute('for', label);
    var input = document.getElementById(id);
    if (!input.checked) { return; }
    input.checked = false;
    trigger('change', input);
}

gestures({ select: selector, threshold: 2
    // Todo: Threshold should be a function?
    // If the gesture is more vertical than horizontal, don't count it
    // as a swipe. Stop the stream and get out of here.
    //() => {
        //if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
            // Meheh??
            //    events.stop();
            //    return;
        //}
    //}
}, document)
.each((events) => events
    .reduce(overload((data, e) => e.type, {
        pointerdown: (data, e) => {
            data.e0     = e;
            data.x0     = e.clientX;
            data.y0     = e.clientY;

            const label = closest(selector, e.target);
            const state = switchState(label);

            data.label  = label;
            data.state  = state;
            data.x      = state ? 1 : 0 ;

            // Work out range of travel
            const trackWidth  = getComputedStyle(label).getPropertyValue('--track-width');
            const handleWidth = getComputedStyle(label).getPropertyValue('--handle-width');
            data.xRange = px(trackWidth) - px(handleWidth);

            label.classList.add('no-select');
            label.classList.add('gesturing');

            return data;
        },

        pointermove: (data, e) => {
            const { x0, y0, label, state, xRange } = data;
            const x1 = e.clientX;
            const y1 = e.clientY;

            const dx = x1 - x0;
            const rx = clamp(0, 1, data.x + dx / xRange);

            label.style.setProperty('--normal-value', rx);

            if (rx >= 0.666667 && !state) {
                data.state = true;
                switchOn(label);
            }
            else if (rx < 0.666667 && state) {
                data.state = false;
                switchOff(label);
            }

            return data;
        },

        default: (data, e) => {
            const { label } = data;
            label.classList.remove('no-select');
            label.classList.remove('gesturing');
            label.style.removeProperty('--normal-value');
            return data;
        }
    }), {})
);
