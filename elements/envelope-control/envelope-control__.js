


/**
<envelope-control>

Import `<envelope-control>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="./path/to/bolt/elements/envelope-control.rolled.js"></script>
<envelope-control name="scale" min="-1" max="1" ticks="-1 -0.8 -0.6 -0.4 -0.2 0 0.2 0.4 0.6 0.8 1">Scale</envelope-control>
```

**/

import Privates from '../../fn/modules/privates.js';
import { Observer, by, capture, insert, get, noop, overload, toCamelCase, toLevel, toType, id, notify, nothing, observe, remove } from '../../fn/module.js';
import { clamp } from '../../fn/modules/clamp.js';
import { rect as box, element, gestures, trigger, create } from '../../dom/module.js';
import { evaluate, invert, transformTick, transformOutput, transformUnit } from './control.js';
import Sparky, { mount, config, getScope } from '../../sparky/module.js';
import { attributes, properties } from './attributes.js';

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
const maxDoubleTapDuration = 0.4;
const defaultTargetEventDuration = 0.4;
const minExponential = toLevel(-96);

const mountOptions = Object.assign({}, config, {
    mount: function(node, options) {
        // Does the node have Sparkyfiable attributes?
        const attrFn = node.getAttribute(options.attributeFn);
        const attrInclude = node.getAttribute(options.attributeSrc);

        if (!attrFn && !attrInclude) { return; }

        options.fn = attrFn;
        options.include = attrInclude;
        var sparky = Sparky(node, options);

        // This is just some help for logging
        //sparky.label = 'Sparky (<envelope-control>)';

        // Return sparky
        return sparky;
    },

    attributePrefix:  ':',
    attributeFn:      'fn',
    attributeSrc:     'src',

    pipes: {
        'sum03': (object) => object[0] + object[3],
        'sum033333': (object) => object[0] + object[3] + object[3] + object[3] + object[3] + object[3]
    }
});

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

const parseCoord = capture(/^([\w-]+)\s+([0-9.]+)\s+([+-]?[0-9.]+)/, {
    // Parse:                (float)     (string)   (float)
    1: function type(data, captures) {
        data[1] = captures[1];
        if (type === 'target') {
            parseTargetData(data, captures);
        }
        return data;
    },

    2: function x(data, captures) {
        data[0] = parseFloat(captures[2]);
        return data;
    },

    3: function y(data, captures) {
        data[2] = parseFloat(captures[3]);
        return data;
    },

    catch: noop
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


/* Shadow */

function observeAll(scope, object) {
    const unobservers = [];
    for (path in scope) {
        const fn = scope[path];
        unobservers.push(observe(path, scope[path], object));
    }
    return unobservers;
}

function createTemplate(elem, shadow, internals) {
    const link   = create('link',  { rel: 'stylesheet', href: config.path + 'envelope-control.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'svg', children: [create('slot')] });
    const svg    = create('svg', {
        class: 'envelope-svg',
        viewBox: '0 -1.125 2 1.125', 
        preserveAspectRatio: 'xMinYMid slice',
        html: `<defs>
                <linearGradient id="handle-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop class="stop-1" offset="0%"/>
                    <stop class="stop-2" offset="100%"/>
                </linearGradient>
            </defs>`
    });

    shadow.appendChild(link);
    shadow.appendChild(style);
    shadow.appendChild(label);
    shadow.appendChild(svg);

    // Get the :host {} style rule from style
    const css = style.sheet.cssRules[0].style;

    const valuescope = {
        '.': function(value, changes) {
            
        }
    };

    return {
        'value': function(value) {
            console.log('scope.value', value);
            observeAll(valuescope, value);
        },


        '': function(unitValue) {
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

                /*
                <text text-anchor="end" x="-0.05" y="0.035" style="font-size: 0.07; fill: #01181e;">-∞</text>
                <circle fn="get:value each scope" class="control control-handle control-point" :cx="{[0]}" :cy="{[2|multiply:-1]}" r="0.0375" tabindex="1"></circle>
                */

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
        data.duration = e.timeStamp / 1000 - data.time;

        // If the gesture does not yet have a type, check whether duration is
        // short and call it a tap
        if (!data.type && (data.duration < maxTapDuration)) {
            data.type = 'tap';
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

            scope[0] = data.x < 0 ? 0 : data.x ;
            scope[2] = scope[1] === 'exponential' ?
                y < minExponential ? minExponential : y :
                // Don't move target handles in the y direction, y is
                // controlled by duration handle
                scope[1] === 'target' ? scope[2] :
                y ;

            notify(data.collection, '.', data.collection);

            data.scope.unitValue0(scope[2]);

            return data;
        },

        default: function(data) {
            console.log('Untyped gesture', data);
        }
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

function assignValueAtBeat(value, event) {
    event.valueAtBeat = value;
    return event[2];
}

element('envelope-control', {
    template: '/bolt/elements/envelope-control.template.html#envelope-control',

    attributes: attributes,

    properties: assign({}, properties, {
        type: {
            value: 'array',
            enumerable: true
        },

        value: {
            get: function() {
                const privates = Privates(this);
                return privates.data.value;
            },

            set: function(value) {
                const privates = Privates(this);
                const data     = privates.data;
                const scope    = privates.scope;

                if (value === data.value) {
                    return;
                }

                if (typeof value === 'string') {
                    value = parseData([], value);
                }

                // Force value array to contain at least one control point
                // at [0,1] if it does not already have one at time 0
                if (!value.length || value[0][0] !== 0) {
                    value.unshift([0, 'step', 1]);
                }

                // Previous value object needs to be unobserved
                if (data.value) {
                    
                }
console.log('SET VALUE', value);
                data.value  = Observer(value);
                scope.value = value;

                var yTransform = data.transform;
                yTransform = yTransform ? toCamelCase(yTransform) : 'linear' ;

                function renderBackground(url) {
                    privates.svg.style.backgroundImage = 'url(' + url + ')';
                }

                if (data.unobserve) {
                    data.unobserve();
                }

                var graphOptions = this.graphOptions = this.graphOptions || {
                    yMin:   this.min,
                    yMax:   this.max,
                    xLines: [0.5, 1, 1.5, 2],
                    //yLines: yLines,
                    xScale: id,
                    yScale: (y) => normalise[yTransform](this.min, this.max, y),
                    viewbox: privates.svg
                        .getAttribute('viewBox')
                        .split(/\s+/)
                        .map(parseFloat)
                };

                var promise = Promise.resolve();

                data.unobserve = observe('.', (array) => {
                    // Keep first cue at time 0
                    array[0][0] = 0;

                    // Keep rendering smoothish by throttling dataURL renders to the
                    // rate at which they can be generated by the OfflineAudioContext
                    if (!promise) { return; }

                    promise = promise.then(() => {
                        array
                        .sort(by(getTime))
                        .reduce(assignValueAtBeat, 0);

                        const style = getComputedStyle(this);
                        graphOptions.gridColor = style.getPropertyValue('--grid-color');
                        graphOptions.valueColor = style.getPropertyValue('--value-color');

                        promise = requestEnvelopeDataURL(array, graphOptions)
                        .then(renderBackground);
                    });

                    promise = undefined;
                }, value);

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
    }),

    construct: function(elem, shadow, internals) {
        // Setup internal data store `privates`
        const privates = Privates(elem);
        const data     = privates.data  = assign({}, defaults);
    
        privates.element   = elem;
        privates.shadow    = shadow;
        privates.internals = internals;
        //privates.handleEvent = handleEvent;
        privates.svg       = shadow.querySelector('svg');

        const styleElem = create('style', ':host {}');
        shadow.insertBefore(styleElem, shadow.firstChild);
        const style = styleElem.sheet.cssRules[0].style;

        // Experiment with scope internal API
        var id = 0;
        const scope = privates.scope = {
            unobserveValue: noop,
            set value(array) {
                this.unobserveValue();
                this.unobserveValue = observe('.', function(array, changes) {
                    const handles = privates.svg.querySelectorAll('.control-handle');
                    console.log('REMOVE', changes.index, changes.removed.length);

                    var n = changes.removed.length;
                    while (n--) {
                        if (!handles[changes.index + n]) {
                            throw new Error('There is no handle at index ' + changes.index);
                        }

                        handles[changes.index + n].remove();
                    }

                    console.log('ADD   ', changes.index, changes.added.length);

                    var unobserveEntry = noop;
                    changes.added.forEach((entry, i) => {
                        privates.svg.appendChild(create('circle', {
                            class: 'control control-handle control-point',
                            cx: '0',
                            cy: '0',
                            r:  '0.0375'
                        }));

                        unobserveEntry();
                        unobserveEntry = observe('.', function(entry, change) {
                            console.log('CHANGE', change.name, change.added);
                        }, entry);
                    });
                    
                    console.log('ARRAY ', JSON.stringify(array));
                    window.a = array;
                }, array);
            },

            ticks:    console.log,
            unitZero: console.log,
            unitValue0: function(value) {
                style.setProperty('--unit-value-0', value);
            }
        };

        // Listen to touches on ticks
        //shadow.addEventListener('mousedown', privates);
        //shadow.addEventListener('touchstart', privates);

        // Listen to range input
        //shadow.addEventListener('input', privates);
    },

    load: function(elem, shadow) {
        const privates = Privates(elem);
        const data     = privates.data;
        var yLines     = elem.getAttribute('ticks');

        yLines = yLines ?
            yLines.split(/\s+/g).map(parseY) :
            nothing ;

        var yTransform = data.transform;
        yTransform = yTransform ? toCamelCase(yTransform) : 'linear' ;

        // Todo: We never .stop() this stream, does it eat memory?
        gestures({ threshold: 0 }, privates.svg)
        .scan(function(previous, gesture) {
            const e0 = gesture.shift();
            const controlBox = box(e0.target);
            const time = e0.timeStamp / 1000;

            const context = {
                target: e0.target,
                time:   time,
                svg:    privates.svg,
                yMin:   elem.min,
                yMax:   elem.max,
                yTransform: yTransform,
                events: [e0],
                scope: privates.scope,

                // Grab the current viewBox as an array of numbers
                viewbox: elem.graphOptions ?
                    elem.graphOptions.viewbox :
                    [],

                collection: elem.value,

                previous: previous,

                offset: e0.target === e0.currentTarget ?
                    // If target is the SVG
                    {
                        x: 0,
                        y: 0
                    } :
                    // If target is an object in the SVG
                    {
                        x: e0.clientX - (controlBox.left + controlBox.width / 2),
                        y: e0.clientY - (controlBox.top + controlBox.height / 2)
                    }
            };

            // If it's within maxDoubleTapDuration of the previous gesture,
            // it's a double tap
            if (previous
                && previous.type === 'tap'
                && time - previous.time < maxDoubleTapDuration) {
                data.type   = 'double-tap';
                data.target = previous.target;
            }

            gesture
            .scan(intoCoordinates, context)
            .each(handleGesture);

            return context;
        })
        .each(noop);

        // Mount template
        mount(shadow, mountOptions).push(data);
    }
});





/* Canvas */

import Envelope from '../../soundstage/nodes/envelope.js';
import { drawXLine, drawYLine, drawCurvePositive } from '../../soundstage/modules/canvas.js';

// Todo: in supported browsers, render the canvas directly to background
// https://stackoverflow.com/questions/3397334/use-canvas-as-a-css-background

const canvas  = document.createElement('canvas');
canvas.width  = 600;
canvas.height = 300;
const ctx     = canvas.getContext('2d');

// Oversampling produces graphs with fewer audio aliasing artifacts
// when curve points fall between pixels.
const samplesPerPixel = 4;

function requestEnvelopeDataURL(data, options) {
    // Allow 1px paddng to accomodate half of 2px stroke of graph line
    const viewBox  = [
        1,
        canvas.height * (1 - 1 / options.viewbox[3]),
        598,
        canvas.height / options.viewbox[3]
    ];
    const valueBox = [0, 1, 2.25, -1];

    // Draw lines / second
    const drawRate = samplesPerPixel * viewBox[2] / valueBox[2];
    const offline  = new OfflineAudioContext(1, samplesPerPixel * viewBox[2], 22050);
    const events   = data.map((e) => ({
        0: e[0] * drawRate / 22050,
        1: e[1],
        2: e[2],
        3: e[3] ? e[3] * drawRate / 22050 : undefined
    }));

    events.unshift({
        0: 0,
        1: 'step',
        2: options.yMax
    });

    const envelope = new Envelope(offline, {
        // Condense time by drawRate so that we generate samplePerPixel
        // samples per pixel.
        'attack': events
    });

    envelope.connect(offline.destination);
    envelope.start(valueBox[0], 'attack');
    envelope.stop(valueBox[2]);

    return offline
    .startRendering()
    .then(function(buffer) {
        //canvas.width = 300;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        options.xLines && options.xLines
        .map(options.xScale)
        .forEach((x) => drawXLine(ctx, viewBox, valueBox, x, options.gridColor));

        options.yLines && options.yLines
        .map(options.yScale)
        .forEach((y) => drawYLine(ctx, viewBox, valueBox, y, options.gridColor));

        const data = buffer.getChannelData(0).map(options.yScale);
        drawCurvePositive(ctx, viewBox, samplesPerPixel, data, options.valueColor);

        return canvas.toDataURL();
    });
}
