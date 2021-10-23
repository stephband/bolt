
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

<xy-input name="points" min="0" max="1" value="0 0 1 1"></xy-input>
```
**/

import { clamp }   from '../../../fn/modules/clamp.js';
import get         from '../../../fn/modules/get.js';
import last        from '../../../fn/modules/last.js';
import overload    from '../../../fn/modules/overload.js';
import noop        from '../../../fn/modules/noop.js';

import create      from '../../../dom/modules/create.js';
import delegate    from '../../../dom/modules/delegate.js';
import element     from '../../../dom/modules/element.js';
import events      from '../../../dom/modules/events.js';
import gestures    from '../../../dom/modules/gestures.js';
import rect        from '../../../dom/modules/rect.js';
import { trigger } from '../../../dom/modules/trigger.js';
import Distributor from '../../../dom/modules/distributor.js';
import { px, rem } from '../../../dom/modules/parse-length.js';

import Literal, { Observer } from '../../../literal/module.js';

const assign = Object.assign;

const $data    = Symbol('xy-data');
const $state   = Symbol('xy-state');
const $literal = Symbol('xy-literal');

const maxTapDuration = 0.25;
const maxDoubleTapDuration = 0.4;
const defaultTargetEventDuration = 0.4;


/* Element */


function toPairs(acc, value) {
    const last = acc[acc.length - 1];

    if (!last || last.length > 1) {
        acc.push([value]);
    }
    else {
        last.push(value);
    }

    return acc;
}


/*
toCoordinates()
Turn gesture positions into coordinates
*/

function setXY(e, data) {
    const box = data.pxbox;

    // New pixel position of control, compensating for initial
    // mousedown offset on the control
    const px = e.clientX - box.left - data.offset.x;
    const py = e.clientY - box.top - data.offset.y;

    // Normalise to 0-1, allowing x position to extend beyond viewbox
    data.x = clamp(data.valuebox[0], data.valuebox[0] + data.valuebox[2], data.valuebox[0] + data.valuebox[2] * px / box.width);
    data.y = clamp(data.valuebox[1] + data.valuebox[3], data.valuebox[1], data.valuebox[1] + data.valuebox[3] * py / box.height);
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

        const controlBox = rect(e.target);
        data.offset = e.target === e.currentTarget ? {
            // Target is the SVG
            x: 0,
            y: 0
        } : {
            // Target is an object in the SVG
            x: e.clientX - (controlBox.left + controlBox.width / 2),
            y: e.clientY - (controlBox.top + controlBox.height / 2)
        } ;

        data.events.length = 0;
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

function setFormValue(internal, formdata, name, points) {
    formdata.delete(name);
    points.forEach((point) => formdata.append(name, point.join(',')));
    internal.setFormValue(formdata);
    return formdata;
}

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
            const data = gesture.data;

            data.values[element.dataset.index][0] = gesture.x ;
            data.values[element.dataset.index][1] = gesture.y ;

            const host = gesture.host;
            if (last(gesture.events).type !== 'pointermove') {
                // internal, formdata, name, value
                setFormValue(gesture.internal, gesture.formdata, host.name, data.values);
                trigger('change', host);
            }
            else {
                trigger('input', host);
            }

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

    construct: function(shadow, internal) {
        const literal = Literal('#xy-input-shadow');

        const data = Observer({
            rangebox: [0, 1, 1, -1],
            valuebox: [0, 1, 6, -1],
            values:   [],
            xLines:   [{ x: 0 }, { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }],
            yLines:   [{ y: 0 }, { y: 0.2 }, { y: 0.4 }, { y: 0.6 }, { y: 0.8 }, { y: 1 }]
        });

        const formdata = new FormData();

        literal.render(data).then(() => shadow.appendChild(literal.content));

        const state = {
            data:     data,
            xScale:   getComputedStyle(this)['--x-scale'],
            yScale:   getComputedStyle(this)['--y-scale'],
            events:   [],
            host:     this,
            internal: internal,
            formdata: formdata,
            rangebox: data.rangebox,
            valuebox: data.valuebox,
            // An SVGRect with x, y, width and height props - TODO make other 
            // boxes look like this too
            viewbox:  literal.content.querySelector('svg').viewBox.baseVal
        };

        this[$data]    = data;
        this[$state]   = state;
        this[$literal] = literal;

        gestures({ threshold: 0 }, shadow)
        .scan((previous, gesture) => {
            const pxbox    = rect(this);
            const fontsize = px(getComputedStyle(this)['font-size']);

            data.rangebox[0] = 0;
            data.rangebox[2] = (pxbox.width / fontsize) / data.valuebox[2];
            data.rangebox[1] = pxbox.height / fontsize
            data.rangebox[3] = -pxbox.height / fontsize;

            const gestureState = assign({ pxbox, previous, fontsize }, state);

            gesture
            .scan(toCoordinates, gestureState)
            .each(handle);

            return gestureState;
        })
        .each(noop);
    },

    connect: function(shadow) {
        
    },

    load: function(shadow) {
        // Signal to literal renderer that we have entered the DOM
        this[$literal].connect();

        // CSS has loaded
        const data     = this[$data];
        const pxbox    = rect(this);
        const fontsize = px(getComputedStyle(this)['font-size']);

        data.rangebox[0] = 0;
        data.rangebox[2] = (pxbox.width / fontsize) / data.valuebox[2];
        data.rangebox[1] = (pxbox.height / fontsize) / data.valuebox[3];
        data.rangebox[3] = -(pxbox.height / fontsize) / data.valuebox[3];

        console.log('Rangebox', data.rangebox);
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
        },

        get: function() {
            return this[$data].valuebox[1];
        },

        set: function(value) {
            this[$data].valuebox[1] = parseFloat(value) || 0;
        }
    },

    /**
    max="1"
    Value at upper limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/
    max: {
        attribute: function(value) {
            this.min = value;
        },

        get: function() {
            return this[$data].valuebox[1] + this[$data].valuebox[3];
        },

        set: function(value) {
            this[$data].valuebox[3] = (parseFloat(value) || 1) - this[$data].valuebox[1];
        }
    },

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
            const values = value.split(/\s*,?\s*/).map(parseFloat);
            this[$data].values.length = 0;
            values.reduce(toPairs, this[$data].values);
            setFormValue(this[$state].internal, this[$state].formdata, this.name, this[$data].values);
        },

        get: function() {
            return this[$data].values;
        },

        set: function(values) {
            assign(this[$data].values, values);
            setFormValue(this[$state].internal, this[$state].formdata, this.name, this[$data].values);
        },

        enumerable: true
    }
});
