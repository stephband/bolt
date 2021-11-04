
/** <xy-input>

Import `<xy-input>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="./module.js"></script>

<style>
    xy-input {
        width: 100%;
        height: 5rem;
    }
</style>

<xy-input name="points" ymin="0" ymax="1" xmin="0" xmax="20000" value="0 0 1 1"></xy-input>
```
**/

import { clamp }   from '../../../fn/modules/clamp.js';
import id          from '../../../fn/modules/id.js';
import last        from '../../../fn/modules/last.js';
import overload    from '../../../fn/modules/overload.js';
import noop        from '../../../fn/modules/noop.js';
import { Observer, notify, getTarget } from '../../../fn/observer/observer.js';

import delegate    from '../../../dom/modules/delegate.js';
import element     from '../../../dom/modules/element.js';
import events      from '../../../dom/modules/events.js';
import gestures    from '../../../dom/modules/gestures.js';
import rect        from '../../../dom/modules/rect.js';
import { trigger } from '../../../dom/modules/trigger.js';
import { px, rem } from '../../../dom/modules/parse-length.js';

import Literal     from '../../../literal/module.js';

import { scales } from './scales.js';
import Data from './data.js';

const assign = Object.assign;

const $state = Symbol('state');

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

function getPaddingBox(element) {
    const box         = rect(element);
    const computed    = getComputedStyle(element);
    const paddingLeft = (px(computed.borderLeftWidth) || 0) + (px(computed.paddingLeft) || 0);
    const paddingTop  = (px(computed.borderTopWidth) || 0) + (px(computed.paddingTop) || 0);

    box.x      = box.x + paddingLeft;
    box.y      = box.y + paddingTop;
    box.width  = box.width  - paddingLeft - (px(computed.borderRightWidth) || 0) - (px(computed.paddingRight) || 0);
    box.height = box.height - paddingTop - (px(computed.borderBottomWidth) || 0) - (px(computed.paddingBottom) || 0);

    return box;
}

function setXY(e, data) {
    const box      = data.pxbox;
    const valuebox = data.data.valuebox;

    // New pixel position of control, compensating for initial
    // mousedown offset on the control
    const px = e.clientX - box.x - data.offset.x;
    const py = box.height - (e.clientY - box.y - data.offset.y);

    // Normalise to 0-1, allowing x position to extend beyond viewbox
    data.x = clamp(valuebox.x, valuebox.x + valuebox.width, data.data.toValueX(valuebox.x + valuebox.width * px / box.width));
    data.y = clamp(valuebox.y, valuebox.y + valuebox.height, data.data.toValueY(valuebox.y + valuebox.height * py / box.height));
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
            x: e.clientX - (controlBox.x + controlBox.width / 2),
            y: e.clientY - (controlBox.y + controlBox.height / 2)
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
            const points = Observer(data.points);

            points[element.dataset.index][0] = gesture.x ;
            points[element.dataset.index][1] = gesture.y ;

            const host = gesture.host;
            if (last(gesture.events).type !== 'pointermove') {
                // internal, formdata, name, value
                setFormValue(gesture.internal, gesture.formdata, host.name, data.points);
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


function updateViewbox(element, data) {
    const observer = Observer(data);
    const pxbox    = getPaddingBox(element);
    const fontsize = px(getComputedStyle(element)['font-size']);

    observer.rangebox[0] = 0;
    observer.rangebox[2] = pxbox.width / fontsize;
    observer.rangebox[1] = 0;
    observer.rangebox[3] = -pxbox.height / fontsize;
}


export default element('xy-input', {
    stylesheet: 
        window.xyInputStylesheet ||
        import.meta.url.replace(/\/[^\/]*([?#].*)?$/, '/') + 'shadow.css',

    construct: function(shadow, internal) {
        const literal  = new Literal('#xy-input-shadow');
        const data     = new Data();
        const formdata = new FormData();

        literal.render(data).then(() => shadow.appendChild(literal.content));

        this[$state] = {
            host:     this,
            data:     data,
            internal: internal,
            literal:  literal,
            formdata: formdata,
            viewbox:  literal.content.querySelector('svg').viewBox.baseVal
        };

        gestures({ threshold: 0 }, shadow)
        .scan((previous, gesture) => {
            const pxbox    = getPaddingBox(this);
            const fontsize = px(getComputedStyle(this)['font-size']);

            // Assign without notify?
            data.rangebox[0] = 0;
            data.rangebox[2] = pxbox.width / fontsize;
            data.rangebox[1] = 0;
            data.rangebox[3] = -pxbox.height / fontsize;

            const state = assign({
                pxbox,
                previous,
                fontsize,
                events: []
            }, this[$state]);

            gesture
            .scan(toCoordinates, state)
            .each(handle);

            return state;
        })
        .each(noop);
        
        events('resize', window).each((e) => updateViewbox(this, data));
    },

    connect: function(shadow) {
        
    },

    load: function(shadow) {
        // Signal to literal renderer that we have entered the DOM
        this[$state].literal.connect();

        // CSS has loaded
        updateViewbox(this, this[$state].data);
    }
}, {/*
    type: {
        value: 'array',
        enumerable: true
    },*/

    // Remember attributers are setup in this declared order

    xmin: {
        /**
        xmin="0"
        Value at lower limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        attribute: function(value) {
            this.xmin = value;
        },

        /**
        .xmin
        Value at lower limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        get: function() {
            return this[$state].data.xmin;
        },

        set: function(value) {
            value = parseFloat(value) || 0;
            const data = this[$state].data;

            if (value === data.xmin) { return; }

            data.xmin = value;
            const isValueboxAttribute = this.getAttribute('valuebox');

            if (!isValueboxAttribute) {
                data.valuebox.x = value;
                data.valuebox.width = data.xmax - data.valuebox.x;
            }

            notify('xmin', data);
            
            if (!isValueboxAttribute) {
                notify('valuebox.x', data);
                notify('valuebox.width', data);
            }
        }
    },

    xmax: {
        /**
        xmax="1"
        Value at upper limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        attribute: function(value) {
            this.xmax = value;
        },

        /**
        .xmax
        Value at upper limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        get: function() {
            return this[$state].data.xmax;
        },

        set: function(value) {
            value = parseFloat(value);

            if (Number.isNaN(value)) {
                if (window.DEBUG) {
                    throw new Error('Invalid value max = ' + value + ' set on <xy-input>');
                }

                value = 1;
            }

            const data = this[$state].data;

            if (value === data.xmax) { return; }

            data.xmax = value;

            const isValueboxAttribute = this.getAttribute('valuebox');
            !isValueboxAttribute && (data.valuebox.width = value - data.valuebox.x);
            notify('xmax', data);
            !isValueboxAttribute && notify('valuebox.width', data);
        }
    },

    ymin: {
        /**
        ymin="0"
        Value at lower limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        attribute: function(value) {
            this.ymin = value;
        },

        /**
        .ymin
        Value at lower limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        get: function() {
            return this[$state].data.min;
        },

        set: function(value) {
            value = parseFloat(value) || 0;
            const data = this[$state].data;

            if (value === data.min) { return; }
            data.min = value;

            const isValueboxAttribute = this.getAttribute('valuebox');
            if (!isValueboxAttribute) {
                data.valuebox.y = value;
                data.valuebox.height = data.max - data.valuebox.y;
            }

            notify('min', data);
            
            if (!isValueboxAttribute) {
                notify('valuebox.y', data);
                notify('valuebox.height', data);
            }
        }
    },

    ymax: {
        /**
        ymax="1"
        Value at upper limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        attribute: function(value) {
            this.ymax = value;
        },

        /**
        .ymax
        Value at upper limit of fader. Can interpret values with recognised units,
        eg. `"0dB"`.
        **/

        get: function() {
            return this[$state].data.max;
        },

        set: function(value) {
            value = parseFloat(value);

            if (Number.isNaN(value)) {
                if (window.DEBUG) {
                    throw new Error('Invalid value max = ' + value + ' set on <xy-input>');
                }

                value = 1;
            }

            const data = this[$state].data;

            if (value === data.max) { return; }
            data.max = value;

            const isValueboxAttribute = this.getAttribute('valuebox');
            !isValueboxAttribute && (data.valuebox.height = value - data.valuebox.y);
            notify('max', data);
            !isValueboxAttribute && notify('valuebox.height', data);
        }
    },

    yscale: {
        /**
        yscale=""
        Scale on the y axis. This is the name of a transform to be applied over the 
        y range of the fader travel. Possible values are:
    
        - `"linear"`
        - `"db-linear-24"`
        - `"db-linear-48"`
        - `"db-linear-60"`
        - `"db-linear-96"`
        - `"logarithmic"`
        - `"quadratic"`
        - `"cubic"`
        **/

        attribute: function(value) {
            const data = this[$state].data;

            if (window.DEBUG && !scales[value]) {
                throw new Error('<xy-input> invalid attribute scale="' + value + '" (valid values "' + Object.keys(scales).join('" ,"') + '")');
            }

            Observer(data).yScale = value;

            /*
            data.transformY = value === 'db-linear-96' ? dbLinear96 :
                value === 'db-linear-60' ? dbLinear60 :
                value === 'db-linear-48' ? dbLinear48 :
                value === 'linear' ? id :
                id ;
            */

            /*
            if (data.ticksAttribute) {
                data.ticks = createTicks(data, data.ticksAttribute);
            }
    
            if (data.step) {
                data.steps = createSteps(data, value === 'ticks' ?
                    data.ticksAttribute || '' :
                    data.stepsAttribute );
            }
            */
        }
    },

    valuebox: {
        /** 
        valuebox=""
        Defines an `"x y width height"` box to use as the range of values that 
        map to the padding box of the `<xy-input>`. The origin is at the 
        bottom and y increases upwards.

        Where not given, valuebox is internally set to the limits of `min` 
        and `max`. Most often this is what you want, and the valuebox attribute
        is safe to ignore.
        **/

        attribute: function(value) {
            // TODO: parse valuebox
        }
    },

    unit: {
        /**
        unit=""
        The value's unit, if it has one. The output value and all ticks are 
        displayed in this unit. Possible values are:
        - `"dB"` – `0-1` is displayed as `-∞dB` to `0dB`
        - `"Hz"`
        **/

        attribute: function(value) {
            this[$state].data.unit = value;
        }
    },

    ticks: {
        /**
        ticks=""
        A space separated list of values at which to display tick marks. Values
        may be listed with or without units, eg:
        
        ```html
        ticks="0 0.2 0.4 0.6 0.8 1"
        ticks="-48dB -36dB -24dB -12dB 0dB"
        ```
        **/

        attribute: function(value) {
            const data = this[$state].data;
            data.ticksAttribute = value;
    
            // Create ticks
            //scope.ticks(createTicks(data, value));
    
            // If step is 'ticks' update steps
            if (data.stepsAttribute === 'ticks') {
                data.steps = createSteps(data, value || '');
            }
        },
    },

    steps: {
        /**
        steps=""
        Steps is either:
    
        - A space separated list of values. As with `ticks`, values may be listed with or without units.
        - The string `"ticks"`. The values in the `ticks` attribute are used as steps.
        **/

        attribute: function(value) {
            const data = this[$state].data;
            data.stepsAttribute = value;

            // If steps is 'ticks' use ticks attribute as step value list
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                value
            );
        }
    },

    sequential: {
        /** 
        sequential=""
        Boolean attribute. When set, data points may not overlap their 
        neighbours, keeping the order of points on the x axis constant.
        **/
        attribute: function(value) {
            this[$state].data.sequential = value !== null;
        }
    },

    value: {        
        /**
        value=""
        The initial value of the element.
        **/

        attribute: function(value) {
            const values = value.split(/\s*,\s*|\s+/).map(parseFloat);
            const { data, internal, formdata } = this[$state];
            data.points.length = 0;
            values.reduce(toPairs, Observer(data.points));
            setFormValue(internal, formdata, this.name, data.points);
        },

        /**
        .value
        The value of the element.
        **/

        get: function() {
            return this[$state].data.points;
        },

        set: function(values) {
            const { data, internal, formdata } = this[$state];
            // TODO: do a deep assign, and accept a flat array
            assign(Observer(data.points), values);
            setFormValue(internal, formdata, this.name, data.points);
        },

        enumerable: true
    }

    /** 
    "input"
    Event sent when one of the handles moves.
    **/

    /** 
    "change"
    Event sent on conclusion of a move (and after formdata is updated).
    **/
});
