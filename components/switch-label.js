
/* Enabales left-right swipe gestures on .switch-label */

import { clamp } from '../../fn/module.js';
import { attribute, closest, gestures, style, trigger } from '../../dom/module.js';

var selector     = '.switch-label';
var swipeRangePx = 40;

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

gestures({ selector: selector, threshold: 4 }, document)
.each(function(events) {
    // First event is touchstart or mousedown
    var e0     = events.shift();
    var latest = events.latest();
    var e1     = latest.shift();
    var x0     = e0.clientX;
    var y0     = e0.clientY;
    var x1     = e1.clientX;
    var y1     = e1.clientY;

    // If the gesture is more vertical than horizontal, don't count it
    // as a swipe. Stop the stream and get out of here.
    if (Math.abs(x1 - x0) < Math.abs(y1 - y0)) {
        events.stop();
        return;
    }

    var label = closest(selector, e0.target);
    var state = switchState(label);
    var x = state ? 1 : 0 ;
    var dx;

    label.classList.add('no-select');
    label.classList.add('gesturing');

    latest.each(function (e) {
        dx = e.clientX - x0;

        var rx = clamp(0, 1, x + dx / swipeRangePx);
        label.style.setProperty('--switch-handle-gesture-x', rx);

        if (rx >= 0.666667 && !state) {
            state = true;
            switchOn(label);
        }
        else if (rx < 0.666667 && state) {
            state = false;
            switchOff(label);
        }
    })
    .done(function() {
        label.classList.remove('no-select');
        label.classList.remove('gesturing');
        label.style.removeProperty('--switch-handle-gesture-x');
    });
});