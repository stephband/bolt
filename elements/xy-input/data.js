import axes   from './axes.js';
import scales from './scales.js';

const assign = Object.assign;

const defaults = {
    min:      0,
    max:      1,
    xScale:    'linear',
    yScale:    'linear',
    xaxis:    axes.default,
    yaxis:    axes.default
};

export default function Data() {
    assign(this, defaults);
    this.points   = [[0, 0]];
    this.rangebox = [0, 1, 1, -1];
    this.valuebox = { x: 0, y: 0, width: 1, height: 1 };
}

assign(Data.prototype, {
    toViewX: function(x) {
        const ratio = scales[this.xScale].to(this.valuebox.x, this.valuebox.x + this.valuebox.width, x);
        return ratio * this.rangebox[2] + this.rangebox[0];
    },

    toViewY: function(y) {
        const ratio = scales[this.yScale].to(this.valuebox.y, this.valuebox.y + this.valuebox.height, y);
        return ratio * this.rangebox[3] + this.rangebox[1];
    },

    toValueX: function(xratio) {
        return scales[this.xScale].from(this.valuebox.x, this.valuebox.x + this.valuebox.width, xratio);
    },

    toValueY: function(yratio) {
        return scales[this.yScale].from(this.valuebox.y, this.valuebox.y + this.valuebox.height, yratio);
    }
});
