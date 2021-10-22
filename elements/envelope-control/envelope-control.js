


/**
<envelope-control>

Import `<envelope-control>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="envelope-control.rolled.js"></script>
<envelope-control min="0" max="1" value="0 0.1 step 0.5 1 linear 1 0.3 linear" name="ratio" ticks="-1 -0.8 -0.6 -0.4 -0.2 0 0.2 0.4 0.6 0.8 1" style="height: 16rem;">Envelope</envelope-control>
```

**/

import { Observer, observe } from '../../fn/modules/observer.js';
import by          from '../../fn/modules/by.js';
import insert      from '../../fn/modules/insert.js';
import get         from '../../fn/modules/get.js';
import noop        from '../../fn/modules/noop.js';
import overload    from '../../fn/modules/overload.js';
import toCamelCase from '../../fn/modules/to-camel-case.js';
import id          from '../../fn/modules/id.js';
import notify      from '../../fn/modules/notify.js';
import nothing     from '../../fn/modules/nothing.js';
import remove      from '../../fn/modules/remove.js';

import { clamp } from '../../fn/modules/clamp.js';
import Privates from '../../fn/modules/privates.js';
import gestures from '../../dom/modules/gestures.js';
import element from '../../dom/modules/element.js';
import create from '../../dom/modules/create.js';
import { attributes, properties } from './attributes.js';
import { parseEnvelope } from './parse-envelope.js';
import { requestEnvelopeDataURL } from './request-envelope-data-url.js';

const assign = Object.assign;

const defaults = {
    law: 'linear',
    min: 0,
    max: 1
};

const maxTapDuration = 0.25;
const maxDoubleTapDuration = 0.4;
const defaultTargetEventDuration = 0.4;


/* Views */

function insertView(marker, views, index, view) {
    if (index > 0) {
        views[index - 1].node.after(view.node);
    }
    else if (views[index]) {
        views[index].node.before(view.node);
    }
    else {
        // Todo: put a marker node in place to handle collections
        marker.appendChild(view.node);
    }

    views.splice(index, 0, view);
}

function destroyView(view) {
    view.unobserve();
    view.node.remove();
}

function arrayMutate(views, changes, marker, createView, destroyView) {
    const index   = changes.index; 
    const removed = changes.removed;
    const added   = changes.added;

    // Cut views out
    var n = removed.length;
    while (n--) {
        if (!views[index + n]) {
            throw new Error('There is no handle to remove at index ' + (index + n));
        }
        
        destroyView(views[index + n]);
        console.log('Removed', views[index + n]);
    }

    views.splice(index, removed.length);

    // Add new views in
    var n = added.length;
    while (n--) {
        const view = createView(added[n]);
        insertView(marker, views, index, view);
        console.log('Added  ', view);
    }
}


const entryScope = {
    // Time
    '0': function(node, data) {
        console.log('x', data[0]);
        node.setAttribute('cx', data[0]);
    },

    '1': function(handle, data) {
        console.log('y', data[1]);
        node.setAttribute('cy', -data[1]);
    },

    '2': function(handle, data) {
        console.log('type', data[2]);
    },

    '3': function(handle, data) {
        console.log('duration', data[3]);
    }
};

function createHandleView(scope, data) {
    const node = create('circle', {
        class: 'control control-handle control-point',
        cx: '0',
        cy: '0',
        r:  '0.0375'
    });

    // Return a view object
    return {
        node: node,
        unobserve: observe('.', function(data, change) {
            return entryScope[change.name]
                && entryScope[change.name](node, data) ;
        }, data)
    };
}


/*
toCoordinates()
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

const toCoordinates = overload((data, e) => e.type, {
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
            //const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[3] = data.x <= scope[0] ?
                // Just using it for a small number... Todo: check why this
                // objects being set to 0
                minExponential :
                data.x - scope[0] ;
            scope[2] = y;

            //notify(data.collection, '.', data.collection);

            return data;
        },

        default: noop
    }),

    '.control-handle': overload(getType, {
        'tap': function(data) {
            //const scope = getScope(data.target);
            cycleType(scope);
            //notify(data.collection, '.', data.collection);

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
            //notify(data.collection, '.', data.collection);
            return data;
        },

        'move': function(data) {
            //const scope =  getScope(data.target);
            const y = denormalise[data.yTransform](data.yMin, data.yMax, -data.y);

            scope[0] = data.x < 0 ? 0 : data.x ;
            scope[2] = scope[1] === 'exponential' ?
                y < minExponential ? minExponential : y :
                // Don't move target handles in the y direction, y is
                // controlled by duration handle
                scope[1] === 'target' ? scope[2] :
                y ;

            //notify(data.collection, '.', data.collection);
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


/*
Cycle types
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


/**
<envelope-control>
**/

element('envelope-control', {
    template: function(elem, shadow) {
        const link  = create('link',  { rel: 'stylesheet', href: config.path + 'envelope-control.css' });
        const css   = create('style', ':host {}');
        const label = create('label', { for: 'svg', children: [create('slot')] });
        const svg   = create('svg', {
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
        shadow.appendChild(css);
        shadow.appendChild(label);
        shadow.appendChild(svg);

        // Get the :host {} style rule from style
        const style = style.sheet.cssRules[0].style;

        const views   = [];
        var unobserve = noop;

        const privates = Privates(elem);
        var promise = Promise.resolve();

        var graphOptions = {
            yMin:   0,//this.min,
            yMax:   1,//this.max,
            xLines: [0.5, 1, 1.5, 2],
            //yLines: yLines,
            xScale: id,
            yScale: (y) => normalise[yTransform](this.min, this.max, y),
            viewbox: [0, -1.125, 2, 1.125]
                //privates.svg
                //.getAttribute('viewBox')
                //.split(/\s+/)
                //.map(parseFloat)
        };

        function renderBackground(url) {
            svg.style.backgroundImage = 'url(' + url + ')';
        }

        privates.scope = {
            'value': function(array) {
                console.log('scope.value', array);
                unobserve();
                unobserve = observe('.', (array, changes) => {
                    arrayMutate(views, changes, svg, createHandleView, destroyView);
                    console.log(array.length, JSON.stringify(array));

                    // Keep rendering smoothish by throttling dataURL renders to the
                    // rate at which they can be generated by the OfflineAudioContext
                    if (!promise) { return; }
    
                    promise.then(() => {
                        array
                        .sort(by(getTime))
                        .reduce(assignValueAtBeat, 0);
    
                        const style = getComputedStyle(elem);
                        graphOptions.gridColor = style.getPropertyValue('--grid-color');
                        graphOptions.valueColor = style.getPropertyValue('--value-color');
    
                        promise = requestEnvelopeDataURL(array, graphOptions)
                        .then(renderBackground);
                    });
    
                    promise = undefined;
                }, array);
            },

            'ticks': noop,
            'steps': noop,
            'unitZero': noop
        };
    },

    construct: function(elem, shadow, internals) {
        // Setup internal data store `privates`
        const privates = Privates(elem);
        const data     = privates.data  = Observer(assign({}, defaults));
    
        privates.element   = elem;
        privates.shadow    = shadow;
        privates.internals = internals;

        // Attach template scope to data 
        observe('.', function(data, change) {
            return privates.scope[change.name]
                && privates.scope[change.name](data[change.name]) ;
        }, data);

        var yLines = //elem.getAttribute('ticks');
        //yLines = yLines ?
        //    yLines.split(/\s+/g).map(parseY) :
            nothing ;

        var yTransform = data.law;
        yTransform = yTransform ?
            toCamelCase(yTransform) :
            'linear' ;

        // Todo: We never .stop() this stream, does it eat memory? Probs.
        gestures({ threshold: 0 }, shadow.querySelector('svg'))
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
                // This is bollocks, should be part of scope/template code
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
            .scan(toCoordinates, context)
            .each(handleGesture);

            return context;
        })
        .each(noop);
    },

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

                if (value === data.value) {
                    return;
                }

                if (typeof value === 'string') {
                    value = parseEnvelope(value);
                }

                // Force value array to contain at least one control point
                // at [0,1] if it does not already have one at time 0
                if (!value.length || value[0][0] !== 0) {
                    value.unshift([0, 1, 'step']);
                }

                data.value = Observer(value);
            },

            enumerable: true
        }
    })
});