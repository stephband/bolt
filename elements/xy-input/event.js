
import overload from '../../../fn/modules/overload.js';
import toType from '../../../fn/modules/to-type.js';

const assign = Object.assign;
const define = Object.defineProperties;

/*
    "step"
    "linear"
    "exponential"
    "target"
*/

export default function Event(time, gain, type, duration) {
    this.time = time;
    this.gain = gain;
    this.type = type;

    if (type === 'target') {
        this.duration = duration;
    }
}

assign(Event, {
    of: function of(time, gain, type, duration) {
        return new Event(time, gain, type, duration);
    },

    from: overload(toType, {
        object: function from(array) {
            return Event.of.apply(this, arguments);
        },

        string: function from(string) {
            const array = string.trim().split(/\s*/);
            // Todo: numberify numbers
            return Event.of.apply(this, array);
        }
    })
});

assign(Event.prototype, {
    toJSON: function() {
        return this.type === 'target' ?
            [this.x, this.y, this.type, this.duration] :
            [this.x, this.y, this.type] ;
    }
});

define(Event.prototype, {
    // Support x,y graphing
    x: {
        get: function() { return this.time; },
        set: function(x) { this.time = x; }
    },
    
    y: {
        get: function() { return this.value; },
        set: function(y) { this.value = y; }
    }
});
