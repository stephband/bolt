
import { scales } from './scales.js';
import { dB6, dB24, dB30, dB48, dB54, dB60, dB96 } from './constants.js';
//import { Observer } from '../../../fn/observer/observer.js';

const assign = Object.assign;

const defaults = {
    min:      0,
    max:      1,
    xScale:    'linear',
    yScale:    'db-linear-48'
};

export default function Data() {
    assign(this, defaults);

    this.points =   [];
    this.rangebox = [0, 1, 1, -1];
    this.valuebox = { x: 0, y: 0, width: 1, height: 1 };
    //this.xTicks =   [{ x: 0, label: "0" }, { x: 0.2, label: "0.2" }, { x: 0.4, label: "0.4" }, { x: 0.6, label: "0.6" }, { x: 0.8, label: "0.8" }, { x: 1, label: "1" }];
    //this.xTicks =   [{ x: 0.02, label: "0.02" }, { x: 0.2, label: "0.2" }, { x: 2, label: "2" }, { x: 20, label: "20" }, { x: 200, label: "200" }, { x: 2000, label: "2k" }, { x: 20000, label: "20k" }];
    this.xTicks =   [{ x: 20, label: "20Hz" }, { x: 100, label: "100Hz" }, { x: 1000, label: "1kHz" }, { x: 10000, label: "10kHz" }, { x: 20000, label: "20kHz" },
        { x: 32.70, label: 'C1' }, { x: 65.41, label: 'C2' }, { x: 130.81, label: 'C3' }, { x: 261.63, label: 'C4' }, { x: 440, label: '440Hz' }, { x: 523.25, label: 'C5' }, { x: 1046.50, label: 'C6' }, { x: 2093.00, label: 'C7' }, { x: 4186.01, label: 'C8' }
    ];
    //this.yTicks =   [{ y: 0, label: "0" }, { y: 0.2, label: "0.2" }, { y: 0.4, label: "0.4" }, { y: 0.6, label: "0.6" }, { y: 0.8, label: "0.8" }, { y: 1, label: "1" }];
    this.yTicks =   [{ y: 0, label: '-∞' }, { y: dB60, label: '-60' }, { y: dB54, label: '-54' }, { y: dB48, label: '-48' }, { y: 0.0078125, label: '-42' }, { y: 0.015625, label: '-36' }, { y: dB30, label: '-30' }, { y: dB24, label: '-24' }, { y: 0.125, label: '-18' }, { y: 0.25, label: '-12' }, { y: dB6, label: '-6' }, { y: 1, label: '0dB' }, { y: 2, label: '+6' }, { y: 4, label: '+12' }, { y: 8, label: '+18' }, { y: 16, label: '+24' }],
    //this.xLines =   [{ x: 0 }, { x: 0.2 }, { x: 0.4 }, { x: 0.6 }, { x: 0.8 }, { x: 1 }];
    this.xLines =   [{ x: 20 }, { x: 30 }, { x: 40 }, { x: 50 }, { x: 60 }, { x: 70 }, { x: 80 }, { x: 90 }, { x: 100 }, { x: 200 }, { x: 300 }, { x: 400 }, { x: 500 }, { x: 600 }, { x: 700 }, { x: 800 }, { x: 900 }, { x: 1000 }, { x: 2000 }, { x: 3000 }, { x: 4000 }, { x: 5000 }, { x: 6000 }, { x: 7000 }, { x: 8000 }, { x: 9000 }, { x: 10000 }, { x: 20000 }];
    //this.xLines =   [{ x: 0.02 }, { x: 0.2 }, { x: 2 }, { x: 20 }, { x: 200 }, { x: 2000 }, { x: 20000 }];
    //this.yLines =   [{ y: 0 }, { y: 0.2 }, { y: 0.4 }, { y: 0.6 }, { y: 0.8 }, { y: 1 }];
    this.yLines =   [{ y: 0 }, { y: dB60 }, { y: dB54 }, { y: dB48 }, { y: 0.0078125 }, { y: 0.015625 }, { y: dB30 }, { y: dB24 }, { y: 0.125 }, { y: 0.25 }, { y: dB6 }, { y: 1 }, { y: 2 }, { y: 4 }, { y: 8 }, { y: 16 }];
}

assign(Data.prototype, {
    toViewX: function(x) {
        const ratio = scales[this.xScale].to(x, this.valuebox.x, this.valuebox.x + this.valuebox.width);
        return ratio * this.rangebox[2] + this.rangebox[0];
    },

    toViewY: function(y) {
        const ratio = scales[this.yScale].to(y, this.valuebox.y, this.valuebox.y + this.valuebox.height);
        return ratio * this.rangebox[3] + this.rangebox[1];
    },

    toValueX: function(xratio) {
        return scales[this.xScale].from(xratio, this.valuebox.x, this.valuebox.x + this.valuebox.width);
    },

    toValueY: function(yratio) {
        return scales[this.yScale].from(yratio, this.valuebox.y, this.valuebox.y + this.valuebox.height);
    }
});
