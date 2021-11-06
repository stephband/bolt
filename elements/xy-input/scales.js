
import { dB24, dB30, dB36, dB48, dB60, dB66, dB72, dB96 } from './constants.js';

const assign = Object.assign;


// LinLogScale()

const linLogRanges = {};

function linLog(xover, max, value) {    
    const v = value / (max * xover);
    return (v <= 1 ? v : (Math.log(v) + 1)) / linLogRanges[xover];
}

function linLogInv(xover, max, ratio) {    
    const r = ratio * linLogRanges[xover];
    return max * xover * (r <= 1 ? r : Math.pow(Math.E, r - 1));
}

function LinLogScale(xover) {
    this.xover = xover;

    if (!linLogRanges[xover]) {
        // Cache linlog ranges for later use in calculations
        linLogRanges[xover] = Math.log(1 / xover) + 1;
    }
}

assign(LinLogScale.prototype, {
    to: function(min, max, value) {
        const rangeMin   = linLog(this.xover, max, min);
        const rangeValue = linLog(this.xover, max, value);
        return (rangeValue - rangeMin) / (1 - rangeMin);
    },

    from: function(min, max, ratio) {
        const rangeMin   = linLog(this.xover, max, min);
        const rangeValue = ratio * (1 - rangeMin) + rangeMin;
        return linLogInv(this.xover, max, rangeValue);
    },

    generateAxis: function(min, max) {}
});


// Export scales

export default {
    'linear': {
        to: function(min, max, value) {
            return (value - min) / (max - min);
        },

        from: function(min, max, ratio) {
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

    'logarithmic-24dB': new LinLogScale(dB24),
    'logarithmic-30dB': new LinLogScale(dB30),
    'logarithmic-36dB': new LinLogScale(dB36),
    'logarithmic-48dB': new LinLogScale(dB48),
    'logarithmic-60dB': new LinLogScale(dB60),
    'logarithmic-66dB': new LinLogScale(dB66),
    'logarithmic-72dB': new LinLogScale(dB72),
    'logarithmic-96dB': new LinLogScale(dB96)
};
