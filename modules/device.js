
// Adds a class to the document root depending on the last input device
// used, enabling you to set :focus and :hover styles depending on the type of
// input responible for them. Hopefully. Not foolproof, but better than getting
// rid of focus outlines altogether.

import classes from '../../dom/modules/classes.js';

export const config = {
    simulatedEventDelay: 0.08,
    keyClass:   'key-device',
    mouseClass: 'mouse-device',
    touchClass: 'touch-device',
    keyType:    'key',
    mouseType:  'mouse',
    touchType:  'touch'
};

export const device = {
    type: 'mouse'
};

var list       = classes(document.documentElement);
var currentClass, timeStamp;

function updateClass(newClass) {
    // We are already in mouseClass state, nothing to do
    if (currentClass === newClass) { return; }
    list.remove(currentClass);
    list.add(newClass);
    currentClass = newClass;
}

function mousedown(e) {
    // If we are within simulatedEventDelay of a touchend event, ignore
    // mousedown as it's likely a simulated event. Reset timeStamp to
    // gaurantee that we only block one mousedown at most.
    if (e.timeStamp < timeStamp + config.simulatedEventDelay * 1000) { return; }
    timeStamp = undefined;
    updateClass(config.mouseClass);
    device.type = config.mouseType;
}

function keydown(e) {
    // If key is not tab, enter or escape do nothing
    if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Space", "Escape", "Tab"].indexOf(e.code) === -1) { return; }
    updateClass(config.keyClass);
    device.type = config.keyType;
    timeStamp = e.timeStamp;
}

function touchend(e) {
    timeStamp = e.timeStamp;
    updateClass(config.touchClass);
    device.type = config.touchType;
}

document.addEventListener('mousedown', mousedown);
document.addEventListener('keydown', keydown);
document.addEventListener('touchend', touchend);
