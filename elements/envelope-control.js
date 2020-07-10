
import { Observer, by, capture, insert, get, noop, overload, toCamelCase, toLevel, toType, id, notify, nothing, observe, remove } from '../../fn/module.js';
import { clamp } from '../../fn/modules/maths/clamp.js';
import { rect as box, element, gestures, trigger } from '../../dom/module.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';
import { attributes } from './attributes.js';

import * as normalise from '../../fn/modules/normalisers.js';
import * as denormalise from '../../fn/modules/denormalisers.js';
import parseValue from '../../fn/modules/parse-value.js';


const DEBUG = true;

const assign = Object.assign;

const defaults = {
    transform: 'linear',
    min:    0,
    max:    1
};

const maxTapDuration = 0.25;
const defaultTargetEventDuration = 0.4;
const minExponential = toLevel(-96);


/*
Y value parser
Export units to make this extensible
*/

export const units = {
    '':   id,
    'dB': toLevel,
    'db': toLevel,
    'DB': toLevel
};

const parseY = overload(toType, {
    'number': id,
    'string': parseValue(units)
});


/*
Envelope parser
Coordinates are parsed from the value attribute thus:

"0 0 linear, 1 0.5 exponential"

to

[[0, 0, "linear"], [1, 0.5, "exponential"]]
*/

const parseTargetData = capture(/^([+-]?[0-9.]+)/, {
    // Parse:                     (float)
    1: function param(data, captures) {
        data[3] = parseFloat(captures[1]);
        return data;
    },

    catch: function(data) {
        data[3] = defaultTargetEventDuration;
        return data;
    }
});

const parseCoord = capture(/^([0-9.]+)\s+([\w-]+)\s+([+-]?[0-9.]+)/, {
    // Parse:                (float)     (string)   (float)
    1: function x(data, captures) {
        data[0] = parseFloat(captures[1]);
        return data;
    },

    2: function y(data, captures) {
        data[1] = captures[2];
        return data;
    },

    3: function type(data, captures) {
        data[2] = captures[3];
        if (type === 'target') {
            parseTargetData(data, captures);
        }
        return data;
    }
});

const parseData = capture(/^\s*|,\s*|\s+/, {
    // Parse:              start, ',' or ' '
    0: function(data, captures) {
        const coord = parseCoord({}, captures);
        if (coord) {
            data.push(coord);
            return parseData(data, captures);
        }
        return data;
    }
});


/*
Tick values
*/

function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.transform === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                node:         create('use', { href: '#tick??' }),
                root:         data,
                value:        value,
                tickValue:    invert(data.transform, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}


/*
Coordinate type converter
*/

const types = {
    "step": function(event) {
        event[1] = 'step';
        delete event[3];
    },

    "linear": function(event) {
        event[1] = 'linear';
        delete event[3];
    },

    "exponential": function(event) {
        event[1] = 'exponential';
        delete event[3];
    },

    "target": function(event) {
        event[1] = 'target';
        if (typeof event[3] !== 'number') {
            event[3] = defaultTargetEventDuration;
        }
    }
};

function cycleType(event) {
    const arr = Object.keys(types);
    const i = arr.indexOf(event[1]);
    return types[arr[(i + 1) % arr.length]](event);
}


/*
intoCoordinates()
Turn gesture positions into coordinates
*/

function setXY(e, data) {
    const rect = box(data.svg);

    // New pixel position of control, compensating for initial
    // mousedown offset on the control
    const px = e.clientX - rect.left - data.offset.x;
    const py = e.clientY - rect.top - data.offset.y;

    // Normalise to 0-1, allowing x position to extend beyond viewbox
    const rx = clamp(0, 4, px / rect.height);
    const ry = clamp(0, 1, py / rect.height);

    // Assume viewbox is always full height, use box height as scale
    data.x = data.viewbox[0] + rx * data.viewbox[3];
    data.y = data.viewbox[1] + ry * data.viewbox[3];
}

const intoCoordinates = overload((data, e) => e.type, {
    'mousedown': (data, e) => {
        data.events.push(e);
        const controlBox = box(e.target);

        // The centre of the control point, if there is a control point
        data.offset = e.target === e.currentTarget ? {
            x: 0,
            y: 0
        } : {
            x: e.clientX - (controlBox.left + controlBox.width / 2),
            y: e.clientY - (controlBox.top + controlBox.height / 2)
        };

        return data;
    },

    'mousemove': (data, e) => {
        data.events.push(e);
        const e0 = data.events[0];

        // If the duration is too short or the mouse has not travelled far
        // enough it is too early to call this a move gesture
        if ((e.timeStamp - e0.timeStamp) < maxTapDuration
            && (e.clientX - e0.clientX) < 4
            && (e.clientY - e0.clientY) < 4) {
            return data;
        }

        data.type = 'move';
        setXY(e, data);

        return data;
    },

    'mouseup': (data, e) => {
        data.events.push(e);
        const e0 = data.events[0];

        data.duration = (e.timeStamp - e0.timeStamp) / 1000;

        // If the gesture does not yet have a type, check whether duration is
        // short and call it a tap
        if (!data.type && (data.duration < maxTapDuration)) {
            if (data.previous
                && data.previous.type === 'tap'
                && (data.previous.events[0].timeStamp > (data.events[0].timeStamp - 400))) {
                data.type = 'double-tap';
                data.target = data.previous.target;
                setXY(data.previous.events[0], data);
            }
            else {
                data.type = 'tap';
            }
        }

        return data;
    }
});


/*
Handle gesture
*/

const getTime   = get('0');
const getTarget = get('target');
const getType   = get('type');

function match(getNode, fns) {
    return function() {
        const node = getNode.apply(this, arguments);
        const selectors = Object.keys(fns);
        var n = -1;

        while (selectors[++n]) {
            if (node.matches(selectors[n])) {
                return fns[selectors[n]].apply(this, arguments);
            }
        }

        throw new Error('Match not found in selectors');
    };
}

const handleGesture = match(getTarget, {
    '.duration-handle': overload(getType, {
        'move': function(data) {
            const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[3] = data.x <= scope[0] ?
                // Just using it for a small number... Todo: check why this
                // objects being set to 0
                minExponential :
                data.x - scope[0] ;
            scope[2] = y;

            notify(data.collection, '.', data.collection);

            return data;
        },

        default: noop
    }),

    '.control-handle': overload(getType, {
        'tap': function(data) {
            const scope = getScope(data.target);
            cycleType(scope);
            notify(data.collection, '.', data.collection);

            // We store scope on data here so that we may pick it up on
            // double-tap, at whcih time the target will no longer have scope
            // because it will have been replaced by another node.
            //
            // Two other approaches:
            //
            // 1. Get scope earlier in the chain. Not elegant, as earlier steps
            // really have nothing to do with scope.
            //
            // 2. Delay tap for 300ms or so until we can be certain it's not
            // going to turn into a double-tap. This is probably most
            // reasonable but will require a little guddling about.
            data.scope = scope;

            return data;
        },

        'double-tap': function(data) {
            // Pick up scope from previous tap data as outlined above.
            const scope = data.previous.scope;

            remove(data.collection, scope);
            notify(data.collection, '.', data.collection);
            return data;
        },

        'move': function(data) {
            const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[0] = data.x < 0 ? 0 : data.x
            scope[2] = scope[1] === 'exponential' ?
                y < minExponential ? minExponential : y :
                // Dont't move target handles in the y direction, y is
                // controlled by durastion handle
                scope[1] === 'target' ? scope[2] :
                y ;

            notify(data.collection, '.', data.collection);

            return data;
        },

        default: noop
    }),

    '*': overload(getType, {
        'double-tap': function(data) {
            const x = data.x;
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            // Insert new control point
            insert(getTime, data.collection, [x, 'step', y]);
            notify(data.collection, '.', data.collection);
            return data;
        },

        default: noop
    })
});


element('envelope-control', {
    template: '#envelope-control',

    attributes: {
        min: function(value) {
            this.min = parseY(value);
        },

        max: function(value) {
            this.max = parseY(value);
        },

        transform: function(value) {
            const data     = this.data;
            this.data.transform = value || 'linear';

            if (data.ticksAttribute) {
                observer.ticks = createTicks(data, data.ticksAttribute);
            }

            //if (data.step) {
            //    data.steps = createSteps(data, value === 'ticks' ?
            //        data.ticksAttribute || '' :
            //        data.stepsAttribute );
            //}

            this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));
        },

        ticks: function(value) {
            console.log('ATTR TICKS', value);
            const data     = this.data;
            const observer = Observer(data);
            data.ticksAttribute = value;
            const yTicks = observer.ticks = createTicks(data, value);
console.log('Ticks', yTicks, data.ticksAttribute);
            // If step is 'ticks' update steps
            //if (data.stepsAttribute === 'ticks') {
            //    data.steps = createSteps(data, value || '');
            //}
        },

        value: function(string) {
            // Value is an array representation of string in the form
            // "time value type data ..."
            this.value = parseData(string);
        }
    },

    properties: {
        type: {
            value: 'array',
            enumerable: true
        },

        min: {
            get: function() {
                return this.data.min;
            },

            set: function(value) {
                const data = this.data;
                const observer = Observer(data);
                observer.min = value;

                // Check for readiness
                if (data.max === undefined) { return; }
                const yTicks = createTicks(data, data.ticksAttribute);
console.log('Ticks', yTicks, data.ticksAttribute);
                this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

                // Check for readiness
                if (data.value === undefined) { return; }
                //observer.unitValue = invert(data.transform, data.value, data.min, data.max);
            },

            enumerable: true
        },

        max: {
            get: function() {
                return this.data.max;
            },

            set: function(value) {
                const data = this.data;
                const observer = Observer(data);
                observer.max = value;

                if (data.min === undefined) { return; }
                //observer.ticks = createTicks(data, data.ticksAttribute);
                //this.style.setProperty('--unit-zero', invert(data.transform, 0, data.min, data.max));

                // Check for readiness
                if (data.value === undefined) { return; }
                //observer.unitValue = invert(data.transform, data.value, data.min, data.max);
            },

            enumerable: true
        },

        value: {
            get: function() {
                return this.data.value;
            },

            set: function(value) {
                const data = this.data;

                if (value === data.value) { return; }
                data.value = value;

console.log('VALUE', value);
                const observer = Observer(data);

                if (data.max === undefined || data.min === undefined) { return; }

                //let unitValue = invert(data.transform, value, data.min, data.max);

                // Round to nearest step
                //if (data.steps) {
                //    const step = nearestStep(data.steps, unitValue);
                //    value = step.value;
                //    unitValue = step.unitValue;
                //}

                //observer.displayValue = transformOutput(data.unit, value);
                //observer.displayUnit  = transformUnit(data.unit, value);
                //observer.unitValue    = unitValue;
            },

            enumerable: true
        }
    },

    construct: function(elem, shadow) {
        const data = elem.data = assign({}, defaults);
    },

    load: function(elem, shadow) {
        var svg    = shadow.querySelector('svg');
        var yLines = elem.getAttribute('ticks');

        yLines = yLines ?
            yLines.split(/\s+/g).map(parseY) :
            nothing ;

        var yMin = elem.min;
        yMin = yMin ? parseY(yMin) : 0 ;

        var yMax = elem.max;
        yMax = yMax ? parseY(yMax) : 1 ;

        var yTransform = svg.getAttribute('transform');
        yTransform = yTransform ? toCamelCase(yTransform) : 'linear' ;

        var scope;

        const graphOptions = {
            yMin:   yMin,
            yMax:   yMax,
            xLines: [0.5, 1, 1.5, 2],
            yLines: yLines,
            xScale: id,
            yScale: (y) => normalise[yTransform](yMin, yMax, y),
            viewbox: svg
                .getAttribute('viewBox')
                .split(/\s+/)
                .map(parseFloat)
        };

        // Todo: We never .stop() this stream, does it eat memory?
        gestures({ threshold: 1 }, svg).scan(function(previous, gesture) {
            const context = {
                target: gesture.target,
                svg:    svg,
                yMin:   yMin,
                yMax:   yMax,
                yTransform: yTransform,
                events: [],

                // Grab the current viewBox as an array of numbers
                viewbox: graphOptions.viewbox,

                collection: scope,

                previous: previous
            };

            gesture
            .scan(intoCoordinates, context)
            .each(handleGesture);

            return context;
        })
        .each(noop);

        function renderBackground(data) {
            svg.style.backgroundImage = 'url(' + data + ')';
        }

        //return scopes.tap((array) => {
        //    var promise = Promise.resolve();
        //    scope = array;

        //    observe('.', (array) => {
        //        // Keep rendering smooth by throttling dataURL renders to the
        //        // rate at which they can be generated by the OfflineAudioContext
        //        if (!promise) { return; }

        //        promise = promise.then(() => {
        //            array
        //            .sort(by(getTime))
        //            .reduce(assignValueAtBeat, 0);

        //            promise = requestEnvelopeDataURL(array, graphOptions)
        //            .then(renderBackground);
        //        });

        //        promise = undefined;
        //    }, scope);
        //});
    }
})
