
/** <xy-input>

Import `<xy-input>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="./module.js"></script>

<style>
    xy-input {
        width: 100%;
        height: 5rem;
        background-color: #eeeeee;
        --x-size: 1rem;
        --y-size: 1rem;
    }
</style>

<xy-input min="" max=""></xy-input>
```
**/

import { clamp }   from '../../../fn/modules/clamp.js';
import get         from '../../../fn/modules/get.js';
import overload    from '../../../fn/modules/overload.js';
import noop        from '../../../fn/modules/noop.js';

import create      from '../../../dom/modules/create.js';
import delegate    from '../../../dom/modules/delegate.js';
import element     from '../../../dom/modules/element.js';
import events      from '../../../dom/modules/events.js';
import gestures    from '../../../dom/modules/gestures.js';
import box         from '../../../dom/modules/rect.js';
import { trigger } from '../../../dom/modules/trigger.js';
import Distributor from '../../../dom/modules/distributor.js';
import { px, rem } from '../../../dom/modules/parse-length.js';

import Literal, { Observer } from '../../../literal/module.js';

const $data    = Symbol('xy-data');
const $literal = Symbol('xy-literal');

const maxTapDuration = 0.25;
const maxDoubleTapDuration = 0.4;
const defaultTargetEventDuration = 0.4;


/* Element */





/*
toCoordinates()
Turn gesture positions into coordinates
*/

function setXY(e, data) {
    const rect = box(data.element);

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
    'pointerdown': (data, e) => {
        data.target = e.target;
        data.time   = e.timeStamp / 1000;

        // If it's within maxDoubleTapDuration of the previous gesture,
        // it's a double tap
        if (data.previous
            && data.previous.type === 'tap'
            && data.time - data.previous.time < maxDoubleTapDuration
        ) {
            data.type   = 'double-tap';
            data.target = data.previous.target;
        }

        const controlBox = box(e.target);
        data.offset = e.target === e.currentTarget ? {
            // Target is the SVG
            x: 0,
            y: 0
        } : {
            // Target is an object in the SVG
            x: e.clientX - (controlBox.left + controlBox.width / 2),
            y: e.clientY - (controlBox.top + controlBox.height / 2)
        } ;

        data.events.push(e);
        return data;
    },

    'pointermove': (data, e) => {
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

    'default': (data, e) => {
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


const handle = delegate({
    '.duration-handle': overload((element, data) => data.type, {
        'pointermove': function(element, data) {
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

    '.control-handle': overload((element, data) => data.type, {
        'tap': function(element, data) {
            //const scope = getScope(data.target);
            //cycleType(scope);
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

        'double-tap': function(element, data) {
            // Pick up scope from previous tap data as outlined above.
            const scope = data.previous.scope;
            remove(data.collection, scope);
            //notify(data.collection, '.', data.collection);
            return data;
        },

        'move': function(element, gesture) {
            //const scope =  getScope(data.target);
            //const y = denormalise[data.yTransform](gesture.yMin, gesture.yMax, -gesture.y);

            const data = gesture.data;
            data.controls[0].x = gesture.x < 0 ? 0 : gesture.x ;
            data.controls[0].y = gesture.y < 0 ? 0 : gesture.y ;

            /*
            scope[2] = scope[1] === 'exponential' ?
                y < minExponential ? minExponential : y :
                // Don't move target handles in the y direction, y is
                // controlled by duration handle
                scope[1] === 'target' ? scope[2] :
                y ;
            */

            //notify(data.collection, '.', data.collection);
            //data.scope.unitValue0(scope[2]);

            return data;
        },

        default: function(element, data) {
            console.log('Untyped gesture', data);
        }
    }),

    '*': overload((element, data) => data.type, {
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

export default element('xy-input', {
    stylesheet: 
        window.xyInputStylesheet ||
        import.meta.url.replace(/\/[^\/]*([?#].*)?$/, '/') + 'shadow.css',

    construct: function(shadow) {
        const literal = Literal('#xy-input-shadow');
        const data = Observer({
            controls: [{ x: 0, y: 0 }],
            xLines: [{ x: 0 }, { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }],
            yLines: [{ y: 0 }, { y: 1 }, { y: 2 }, { y: 3 }, { y: 4 }, { y: 5 }]
        });

        literal.render(data).then(() => shadow.appendChild(literal.content));

        /*
        slot.addEventListener('slotchange', changes);
        button.addEventListener('click', (e) => {
            this.open = !this.open;
        });
        */

        // Internal view object
        this[$data]    = data;
        this[$literal] = literal;

        gestures({ threshold: 0 }, shadow)
        .scan((previous, gesture) => {
            const context = {
                data:     data,
                yMin:     this.min,
                yMax:     this.max,
                xScale:   getComputedStyle(this)['--x-scale'],
                yScale:   getComputedStyle(this)['--y-scale'],
                events:   [],
                element:  this,
                viewbox:  [0, 0, 2, 2],
                previous: previous
            };

            gesture
            .scan(toCoordinates, context)
            .each(handle);

            return context;
        })
        .each(noop);
    },

    connect: function(shadow) {
        // Signal to literal renderer that we have entered the DOM
        this[$literal].connect();
    },

    load: function(shadow) {
        // CSS has loaded
    }
}, {/*
    type: {
        value: 'array',
        enumerable: true
    },*/

    // Remember attributers are setup in this declared order

    /**
    min="0"
    Value at lower limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/
    min: {
        attribute: function(value) {
            this.min = value;
        }
    },

    /**
    max="1"
    Value at upper limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/
    max: {
        attribute: function(value) {
            this.max = value;
        }
    },

    /**
    law="linear"
    Fader law. This is the name of a transform to be applied over the range 
    of the fader travel. Possible values are:

    - `"linear"`
    - `"linear-logarithmic"`
    - `"logarithmic"`
    - `"quadratic"`
    - `"cubic"`
    **/
/*
    law: function(value) {
        const privates = Privates(this);
        const data     = privates.data;
        const scope    = privates.scope;

        data.law = value || 'linear';

        if (data.ticksAttribute) {
            data.ticks = createTicks(data, data.ticksAttribute);
        }

        if (data.step) {
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                data.stepsAttribute );
        }

        scope.unitZero(invert(data.law, 0, data.min, data.max));
    },
*/
    /**
    unit=""
    The value's unit, if it has one. The output value and all ticks are 
    displayed in this unit. Possible values are:
    - `"dB"` – `0-1` is displayed as `-∞dB` to `0dB`
    - `"Hz"`
    **/

    unit: {
        attribute: function(value) {
            this[$data].unit = value;
        }
    },

    /**
    ticks=""
    A space separated list of values at which to display tick marks. Values
    may be listed with or without units, eg:
    
    ```html
    ticks="0 0.2 0.4 0.6 0.8 1"
    ticks="-48dB -36dB -24dB -12dB 0dB"
    ```
    **/

    ticks: {
        attribute: function(value) {
            const data = this[$data];
            data.ticksAttribute = value;
    
            // Create ticks
            scope.ticks(createTicks(data, value));
    
            // If step is 'ticks' update steps
            if (data.stepsAttribute === 'ticks') {
                data.steps = createSteps(data, value || '');
            }
        },
    },

    /**
    steps=""
    Steps is either:

    - A space separated list of values. As with `ticks`, values may be listed with or without units.
    - The string `"ticks"`. The values in the `ticks` attribute are used as steps.
    **/
    steps: {
        attribute: function(value) {
            const data = this[$data];
            data.stepsAttribute = value;

            // If steps is 'ticks' use ticks attribute as step value list
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                value
            );
        }
    },

    /**
    value=""
    The initial value of the fader.
    **/

    value: {
        attribute: function(value) {
            this.value = value;
        },

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
});
