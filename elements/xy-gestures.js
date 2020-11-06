
import { Observer, by, capture, insert, get, noop, overload, toCamelCase, toLevel, toType, id, notify, nothing, observe, remove } from '../../fn/module.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import Privates from '../../fn/modules/privates.js';
import { observeAll } from '../../fn/modules/observer/observe.js';
import gestures from '../../dom/modules/gestures.js';
import { element, create } from '../../dom/module.js';
import { attributes, properties } from './attributes.js';
import { parseEnvelope } from './parse-envelope.js';
import { requestEnvelopeDataURL } from './request-envelope-data-url.js';
import * as normalise from '../../fn/modules/normalisers.js';
import * as denormalise from '../../fn/modules/denormalisers.js';

const maxTapDistance       = 2;    // px
const maxTapDuration       = 0.25; // seconds
const maxDoubleTapDuration = 0.5;  // seconds


/*
toCoordinates()
Turn gesture positions into coordinates
*/

function setXY(e, data) {
    const rect = data.rect;

    // New pixel position of control, compensating for initial
    // mousedown offset on the control
    const px = e.clientX - rect.left - data.offsetX;
    const py = e.clientY - rect.top - data.offsetY;

    // Normalise to ratio
    const nx = px / rect.height;
    const ny = py / rect.width;

    // Normalise to pointerbox coordinates
    data.x = data.pointerbox[0] + nx * data.pointerbox[3];
    data.y = data.pointerbox[1] + ny * data.pointerbox[4];
    
    return data;
}

const toCoordinates = overload((data, e) => e.type, {
    'pointermove': (data, e) => {
        //data.events.push(e);
        const e0 = data.e0;

        // If the duration is too short or the mouse has not travelled far
        // enough it is too early to call this a move gesture
        if ((e.timeStamp - e0.timeStamp) < maxTapDuration
            && (e.clientX - e0.clientX) < maxTapDistance
            && (e.clientY - e0.clientY) < maxTapDistance) {
            return data;
        }

        data.type = 'move';

        return setXY(e, data);
    },

    'pointerup': (data, e) => {
        //data.events.push(e);
        const e0 = data.e0;
        data.duration = (e.timeStamp - e0.timeStamp) / 1000;

        // If the gesture does not yet have a type, check whether duration is
        // short and call it a tap
        if (!data.type && (data.duration < maxTapDuration)) {
            data.type = 'tap';
        }

        return data;
    }
});


function classify(previous, current) {
    const e0 = current.e0;

    current.type = current.type === 'tap'
        && previous.type === 'tap'
        && previous.e0.pointerId === current.e0.pointerId
        && (e0.timeStamp - previous.e0.timeStamp) / 1000 < maxDoubleTapDuration ?
            'double-tap' :
            current.type ;

    return current;
}

export default function xyGestures(element, routes) {
    const handle = match(get('target'), routes);

    return gestures(options, element)
    .scan(function(previous, gesture) {
        const e0         = gesture.shift();
        const targetRect = rect(e0.target);
        const data = {
            e0:          e0,
            // Todo: options function in here to set offsets depending on 
            // target selector or something
            offsetX:     targetRect.width / 2,
            offsetY:     targetRect.height / 2,
            rect:        rect(e0.currentTarget),
            pointerbox:  options.pointerbox || [0, -1.125, 2, 1.125],
            previous:    previous,
            //stream:      gesture
        };

        gesture
        .scan(toCoordinates, data)
        .filter(get('type'))
        .scan(classify, nothing)
        .each(handle);

        return data;
    }, {})
    .each(noop);
}
