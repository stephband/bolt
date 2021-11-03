
import id from '../../../fn/modules/id.js';
import { dB6, dB24, dB30, dB48, dB54, dB60, dB96 } from './constants.js';

export const scales = {
    'linear': {
        to: id,
        from: id
    },

    'quadratic': {
        to: (value) =>  value * value,
        from: (value) => Math.pow(value, 0.5)
    },

    'cubic': {
        to: (value) =>  value * value * value,
        from: (value) => Math.pow(value, 0.333333333333)
    },

    // TODO: Calculate proper linear section factors for these fns.
    // We need to find where the tangent of 20log10(value) hits 0, and use
    // that distance as the ratio to switch between linear and db-linear.
    'db-linear-24': {
        to: function dbLinear24(value) {
            return value < dB24 ?
                0.27 * value / dB24 :
                1 + 0.73 * (20 * Math.log10(value) / 24) ;
        },
        
        from: function(value) {
            return value < 0.27 ?
                value * dB24 / 0.27 :
                Math.pow(10, (24 * ((value - 1) / 0.73) / 20)) ;
        }
    },
    
    'db-linear-30': {
        to: function dbLinear30(value) {
            return value < dB30 ?
                0.22 * value / dB30 :
                1 + 0.78 * (20 * Math.log10(value) / 30) ;
        },
        
        from: function(value) {
            return value < 0.22 ?
                value * dB30 / 0.22 :
                Math.pow(10, (30 * ((value - 1) / 0.78) / 20)) ;
        }
    },

    'db-linear-48': {
        to: function dbLinear48(value) {
            return value < dB48 ?
                0.16 * value / dB48 :
                1 + 0.84 * (20 * Math.log10(value) / 48) ;
        },

        from: function(value) {
            return value < 0.16 ?
                value * dB48 / 0.16 :
                Math.pow(10, (48 * ((value - 1) / 0.84) / 20)) ;
        }
    },

    'db-linear-60': {
        to: function dbLinear60(value) {
            return value < dB60 ?
                0.14 * value / dB60 :
                1 + 0.86 * (20 * Math.log10(value) / 60) ;
        },
        
        from: function(value) {
            return value < 0.14 ?
                value * dB60 / 0.14 :
                Math.pow(10, (60 * ((value - 1) / 0.86) / 20)) ;
        }
    },

    'db-linear-96': {
        to: function dbLinear96(value) {
            return value < dB96 ?
                0.08 * value / dB96 :
                1 + 0.92 * (20 * Math.log10(value) / 96) ;
        },
        
        from: function(value) {
            return value < 0.08 ?
                value * dB96 / 0.08 :
                Math.pow(10, (96 * ((value - 1) / 0.92) / 20)) ;
        }
    },
    
    'linear-log-20': {
        to: function log20(value) {
            return value < 20 ?
                0.08 * value / 20 :
                1 + 0.92 * Math.log(value) ;
        },

        from: function(value) {
            return value < 0.08 ?
                value * dB96 / 0.08 :
                Math.pow(10, (96 * ((value - 1) / 0.92) / 20)) ;
        }
    }
};
