
import { dB6, dB24, dB30, dB48, dB54, dB60, dB66, dB72, dB78, dB84, dB90, dB96 } from './constants.js';

export default {
    dB: [
        { value: 0, label: '-∞' },
        { value: dB96/2/2 }, 
        { value: dB96/2 }, 
        { value: dB96, label: '-96' }, 
        { value: dB90, label: '-90' }, 
        { value: dB84, label: '-84' }, 
        { value: dB78, label: '-78' }, 
        { value: dB72, label: '-72' }, 
        { value: dB66, label: '-66' }, 
        { value: dB60, label: '-60' }, 
        { value: dB54, label: '-54' }, 
        { value: dB48, label: '-48' }, 
        { value: 0.0078125, label: '-42' }, 
        { value: 0.015625, label: '-36' }, 
        { value: dB30, label: '-30' }, 
        { value: dB24, label: '-24' }, 
        { value: 0.125, label: '-18' }, 
        { value: 0.25, label: '-12' }, 
        { value: dB6, label: '-6' }, 
        { value: 1, label: '0dB' }, 
        { value: 2, label: '+6' }, 
        { value: 4, label: '+12' }, 
        { value: 8, label: '+18' }, 
        { value: 16, label: '+24' }
    ],

    Hz: [
        { value: 20, label: "20Hz" }, { value: 30 }, { value: 40 }, { value: 50 }, { value: 60 }, { value: 70 }, { value: 80 }, { value: 90 },
        { value: 100, label: "100Hz" }, { value: 200 }, { value: 300 }, { value: 400 }, { value: 500 }, { value: 600 }, { value: 700 }, { value: 800 }, { value: 900 },
        { value: 1000, label: "1kHz" }, { value: 2000 }, { value: 3000 }, { value: 4000 }, { value: 5000 }, { value: 6000 }, { value: 7000 }, { value: 8000 }, { value: 9000 },
        { value: 10000, label: "10kHz" }, { value: 20000, label: "20kHz" }
    ],

    notes: [
        { value: 32.70, label: 'C1' },
        { value: 65.41, label: 'C2' },
        { value: 130.81, label: 'C3' },
        { value: 261.63, label: 'C4' },
        { value: 523.25, label: 'C5' }, 
        { value: 1046.50, label: 'C6' },
        { value: 2093.00, label: 'C7' },
        { value: 4186.01, label: 'C8' }
    ],

    default: [
        { value: 0, label: "0" }, 
        { value: 0.2, label: "0.2" }, 
        { value: 0.4, label: "0.4" }, 
        { value: 0.6, label: "0.6" }, 
        { value: 0.8, label: "0.8" }, 
        { value: 1, label: "1" }
    ]
};
