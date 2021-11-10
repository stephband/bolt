import axes   from './axes.js';
import scales from './scales.js';

import { requestDrawCurve, clear, drawXLines, drawYLines, drawCrosshair } from './canvas.js';
import { drawAudioEnvelope } from './draw-audio.js';


const assign = Object.assign;

const defaults = {
    min:      0,
    max:      1,
    xScale:    'linear',
    yScale:    'linear',
    xaxis:    axes.default,
    yaxis:    axes.default
};

export default function Data(host) {
    assign(this, defaults);
    this.host     = host;
    this.points   = [{ x: 0, y: 0, type: 'step' }, { x: 0.5, y: 0.5, type: 'linear' }, { x: 0.7, y: 0.8, type: 'exponential' }, { x: 0.8, y: 0.2, type: 'target', duration: 0.1 }];
    // Start in the 100px range to avoid a flash of ultra large SVG content
    this.rangebox = [0, 6.75, 6.75, -6.75];
    this.valuebox = { x: 0, y: 0, width: 1, height: 1 };
}

assign(Data.prototype, {
    clear:     clear,
    drawCurve: requestDrawCurve,
    drawCrosshair: drawCrosshair,
    drawXLines: drawXLines,
    drawYLines: drawYLines,
    drawAudioEnvelope: drawAudioEnvelope,

    toRatioX: function(x) {
        return scales[this.xScale].to(this.valuebox.x, this.valuebox.x + this.valuebox.width, x);
    },

    toRatioY: function(y) {
        return scales[this.yScale].to(this.valuebox.y, this.valuebox.y + this.valuebox.height, y);
    },

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
