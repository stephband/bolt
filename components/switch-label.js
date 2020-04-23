
/* Enabales left-right swipe gestures on .switch-label */

import { limit } from '../../fn/module.js';
import { attribute, closest, gestures, style, trigger } from '../../dom/module.js';

console.log('WOOOOO')

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
    var e = events.shift();
    var label = closest(selector, e.target);

    var x0 = e.pageX;
    var y0 = e.pageY;
    var dx;
    var state = switchState(label);
    var x = state ? 1 : 0 ;

    label.classList.add('no-select');
    label.classList.add('gesturing');

    events
    .each(function (e) {
        dx = e.pageX - x0;

        var rx = limit(0, 1, x + dx / swipeRangePx);
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