/* Canvas */

import by  from '../../../fn/modules/by.js';
import get from '../../../fn/modules/get.js';

import Envelope from '../../../soundstage/nodes/envelope.js';
//import { drawCurvePositive } from '../../../soundstage/modules/canvas.js';
//import Event from './event.js';

// Oversampling produces graphs with fewer audio aliasing artifacts
// when curve points fall between pixels.
const samplesPerPixel = 4;

/**
drawCurvePositive(ctx, box, rate, data, color)

Draws a filled automation curve.

ctx:   canvas context
box:   array of 4 numbers describing view box
rate:  data points per px
data:  array of data points
color: base color
**/

export function drawCurvePositive(ctx, box, rate, data, color) {
    let n = -1;

    ctx.lineWidth   = '2';
    ctx.lineCap     = 'round';

    ctx.beginPath();
    ctx.moveTo(
        box.x,
        box.y + box.height
        //box.y + (1 - box.height) * data[n]
    );

    while (++n < data.length) {
        ctx.lineTo(
            box.x + n / rate,
            box.y + (1 - data[n]) * box.height
        );
    }

    // Stroke the waveform
    ctx.strokeStyle = color;
    ctx.stroke();

    // Now complete its area and then fill it
    ctx.lineTo(
        box.x + box.width,
        box.y + box.height
    );

    ctx.lineTo(
        box.x,
        box.y + box.height
    );

    ctx.fillStyle = color + '2b';
    ctx.fill();
    ctx.closePath();
}

export function drawTargetLines(ctx, box, data, color) {
    let n = -1;
const radius = 18;

    ctx.lineWidth   = '2';
    ctx.lineCap     = 'round';
    ctx.strokeStyle = color;
    ctx.setLineDash([2, 6]);

    ctx.beginPath();

    while (++n < data.length) {
        if (data[n].type !== 'target') {
            continue;
        }

        // Vertical line
        ctx.moveTo(
            box.x + data[n].x * box.width,
            box.y + (1 - (data[n - 1] ? data[n - 1].y : 0)) * box.height
        );
        
        ctx.lineTo(
            box.x + data[n].x * box.width,
            box.y + (1 - data[n].y) * box.height + ((data[n - 1] ? data[n - 1].y : 0) > data[n].y ? -radius : radius)
        );

        // Horizontal line
        ctx.moveTo(
            box.x + data[n].x * box.width + radius,
            box.y + (1 - data[n].y) * box.height
        );
        
        ctx.lineTo(
            // Draw to next event
            box.x + (data[n + 1] ? data[n + 1].x : 1) * box.width,
            box.y + (1 - data[n].y) * box.height
        );
    }

    ctx.stroke();
    ctx.closePath();
}

export function drawAudioEnvelope(ctx, viewbox, valuebox, events, color) {
    // Draw lines / second
    const drawRate = samplesPerPixel * viewbox.width / valuebox.width;
    const offline  = new OfflineAudioContext(1, samplesPerPixel * viewbox.width, 22050);
    const envelope = new Envelope(offline, { 'attack': events.map((event) => (
            // Condense time by drawRate so that we generate samplePerPixel
            // samples per pixel.
            event.type === 'target' ?
                [event.x * drawRate / 22050, event.type, event.y, event.duration * drawRate / 22050] :
                [event.x * drawRate / 22050, event.type, event.y]
        ))
    });

    envelope.connect(offline.destination);
    envelope.start(valuebox.x, 'attack');
    envelope.stop(valuebox.width);

    ctx.activeRenders = ctx.activeRenders ?
        ctx.activeRenders + 1 :
        1 ;

    ctx.cacheddata && drawCurvePositive(ctx, viewbox, samplesPerPixel, ctx.cacheddata, color);
    ctx.cacheddata && drawTargetLines(ctx, viewbox, events.map((event) => ({
        x:        this.toRatioX(event.x),
        y:        this.toRatioY(event.y),
        type:     event.type,
        duration: event.duration
    })).sort(by(get('x'))), color);

    return offline
    .startRendering()
    .then((buffer) => {
        // Only actually render the latest
        if (--ctx.activeRenders) { return; }
        const data = buffer.getChannelData(0).map((y) => this.toRatioY(y));
        !ctx.cacheddata && drawCurvePositive(ctx, viewbox, samplesPerPixel, data, color);
        !ctx.cacheddata && drawTargetLines(ctx, viewbox, events.map((event) => ({
            x:        this.toRatioX(event.x),
            y:        this.toRatioY(event.y),
            type:     event.type,
            duration: event.duration
        })).sort(by(get('x'))), color);
        ctx.cacheddata = data;
    });
}
