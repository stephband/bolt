
import { scales } from './scales.js';
import { dB6, dB24, dB30, dB48, dB54, dB60, dB96 } from './constants.js';
//import { Observer } from '../../../fn/observer/observer.js';

const assign = Object.assign;

const defaults = {
    min:      0,
    max:      1,
    xScale:    'log-20',
    yScale:    'db-linear-30'
};

export default function Data() {
    assign(this, defaults);

    this.points =   [];
    this.rangebox = [0, 1, 1, -1];
    this.valuebox = { x: 0, y: 0, width: 1, height: 1 };
    //this.xTicks =   [{ x: 0, label: "0" }, { x: 0.2, label: "0.2" }, { x: 0.4, label: "0.4" }, { x: 0.6, label: "0.6" }, { x: 0.8, label: "0.8" }, { x: 1, label: "1" }];
    //this.yTicks =   [{ y: 0, label: "0" }, { y: 0.2, label: "0.2" }, { y: 0.4, label: "0.4" }, { y: 0.6, label: "0.6" }, { y: 0.8, label: "0.8" }, { y: 1, label: "1" }];
    this.yTicks =   [{ y: 0, label: '-∞' }, { y: dB60, label: '-60' }, { y: dB54, label: '-54' }, { y: dB48, label: '-48' }, { y: 0.0078125, label: '-42' }, { y: 0.015625, label: '-36' }, { y: dB30, label: '-30' }, { y: dB24, label: '-24' }, { y: 0.125, label: '-18' }, { y: 0.25, label: '-12' }, { y: dB6, label: '-6' }, { y: 1, label: '0dB' }],
    //this.xLines =   [{ x: 0 }, { x: 0.2 }, { x: 0.4 }, { x: 0.6 }, { x: 0.8 }, { x: 1 }];
    this.xLines =   [{ x: 0.02 }, { x: 0.2 }, { x: 2 }, { x: 20 }, { x: 200 }, { x: 2000 }, { x: 20000 }];
    this.xTicks =   [{ x: 0.02, label: "0.02" }, { x: 0.2, label: "0.2" }, { x: 2, label: "2" }, { x: 20, label: "20" }, { x: 200, label: "200" }, { x: 2000, label: "2k" }, { x: 20000, label: "20k" }];
    //this.yLines =   [{ y: 0 }, { y: 0.2 }, { y: 0.4 }, { y: 0.6 }, { y: 0.8 }, { y: 1 }];
    this.yLines =   [{ y: 0 }, { y: dB60 }, { y: dB54 }, { y: dB48 }, { y: 0.0078125 }, { y: 0.015625 }, { y: dB30 }, { y: dB24 }, { y: 0.125 }, { y: 0.25 }, { y: dB6 }, { y: 1 }, { y: 2 }, { y: 4 }];
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

    toValueX: function(x) {
        return scales[this.xScale].from(x, this.valuebox.x, this.valuebox.x + this.valuebox.width);
    },

    toValueY: function(y) {
        return scales[this.yScale].from(y, this.valuebox.y, this.valuebox.y + this.valuebox.height);
    }
});
