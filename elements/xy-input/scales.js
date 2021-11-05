
import id from '../../../fn/modules/id.js';
import { dB6, dB24, dB30, dB48, dB54, dB60, dB96 } from './constants.js';

const log24 = Math.log(dB24);
const log30 = Math.log(dB30);
const log48 = Math.log(dB48);
const log60 = Math.log(dB60);
const log96 = Math.log(dB96);

function linlog(xover, log, value) {
    return value <= xover ?
        value / xover :
        Math.log(value) - (log - 1) ;
}

function invlinlog(xover, log, value) {
    return value - 1 <= 0 ?
        value * xover :
        Math.pow(Math.E, value + log - 1)
}

export default {
    'linear': {
        to: function(value, min, max) {
            return (value - min) / (max - min);
        },

        from: function(ratio, min, max) {
            return min + ratio * (max - min);
        }
    },
    /*
    'quadratic': {
        to: (value) =>  value * value,
        from: (value) => Math.pow(value, 0.5)
    },

    'cubic': {
        to: (value) =>  value * value * value,
        from: (value) => Math.pow(value, 0.333333333333)
    },
    */
    // TODO: Calculate proper linear section factors for these fns.
    // We need to find where the tangent of 20log10(value) hits 0, and use
    // that distance as the ratio to switch between linear and db-linear.
    'db-linear-24': {
        to: function(value, min, max) {
            const rangeMin = linlog(dB24, log24, min);
            const rangeMax = linlog(dB24, log24, max);
            const range    = rangeMax - rangeMin;
            return (linlog(dB24, log24, value) - rangeMin) / range ;
        },
        
        from: function(ratio, min, max) {
            const rangeMin = linlog(dB24, log24, min);
            const rangeMax = linlog(dB24, log24, max);
            const range    = rangeMax - rangeMin;
            return invlinlog(dB24, log24, ratio * range + rangeMin) ;
        }
    },
    
    'db-linear-30': {
        to: function(value, min, max) {
            const xover    = dB30 * max;
            const log      = Math.log(xover);
            const rangeMin = linlog(xover, log, min);
            const rangeMax = linlog(xover, log, max);
            const range    = rangeMax - rangeMin;
            return (linlog(xover, log, value) - rangeMin) / range ;
        },

        from: function(ratio, min, max) {
            const xover    = dB30 * max;
            const log      = Math.log(xover);
            const rangeMin = linlog(xover, log, min);
            const rangeMax = linlog(xover, log, max);
            const range    = rangeMax - rangeMin;
            return invlinlog(xover, log, ratio * range + rangeMin) ;
        }
    },

    'db-linear-48': {
        to: function(value, min, max) {
            const rangeMin = linlog(dB48, log48, min);
            const rangeMax = linlog(dB48, log48, max);
            const range    = rangeMax - rangeMin;
            return (linlog(dB48, log48, value) - rangeMin) / range ;
        },
        
        from: function(ratio, min, max) {
            const rangeMin = linlog(dB48, log48, min);
            const rangeMax = linlog(dB48, log48, max);
            const range    = rangeMax - rangeMin;
            return invlinlog(dB48, log48, ratio * range + rangeMin) ;
        }
    },

    'db-linear-60': {
        to: function dBLinear60(value, min, max) {
            const rangeMin = linlog(dB60, log60, min);
            const rangeMax = linlog(dB60, log60, max);
            const range    = rangeMax - rangeMin;
            return (linlog(dB60, log60, value) - rangeMin) / range ;
        },

        from: function(ratio, min, max) {
            const rangeMin = linlog(dB60, log60, min);
            const rangeMax = linlog(dB60, log60, max);
            const range    = rangeMax - rangeMin;
            return invlinlog(dB60, log60, ratio * range + rangeMin) ;
        }
    },

    'db-linear-96': {
        to: function(value, min, max) {
            const rangeMin = linlog(dB96, log96, min);
            const rangeMax = linlog(dB96, log96, max);
            const range    = rangeMax - rangeMin;
            return (linlog(dB96, log96, value) - rangeMin) / range ;
        },
        
        from: function(ratio, min, max) {
            const rangeMin = linlog(dB96, log96, min);
            const rangeMax = linlog(dB96, log96, max);
            const range    = rangeMax - rangeMin;
            return invlinlog(dB96, log96, ratio * range + rangeMin) ;
        }
    },

    'lin-20-log': {
        to: function(value, min, max) {
            const rangeMin = linlog(20, Math.log(20), min);
            const rangeMax = linlog(20, Math.log(20), max);
            const range    = rangeMax - rangeMin;
            return (linlog(20, Math.log(20), value) - rangeMin) / range ;
        },
        
        from: function(ratio, min, max) {
            const rangeMin = linlog(20, Math.log(20), min);
            const rangeMax = linlog(20, Math.log(20), max);
            const range    = rangeMax - rangeMin;
            return invlinlog(20, Math.log(20), ratio * range + rangeMin) ;
        }
    }
};












/*
function dbLinear(min, max, value) {
    return value < dB96 ?
        0.08 * value / dB96 :
        1 + 0.92 * (20 * Math.log10(value) / 96) ;
}

function dBLinear(min, max, value) {
    // The bottom 1/9th of the range is linear from 0 to min, while
    // the top 8/9ths is dB linear from min to max.
    return value <= min ?
        (value / min) / 9 :
        (0.1111111111111111 + (Math.log(value / min) / Math.log(max / min)) / 1.125) ;
}
*/
























