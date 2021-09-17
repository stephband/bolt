/* Canvas */

import Envelope from '../../soundstage/nodes/envelope.js';
import { drawXLine, drawYLine, drawCurvePositive } from '../../soundstage/modules/canvas.js';

// Todo: in supported browsers, render the canvas directly to background
// https://stackoverflow.com/questions/3397334/use-canvas-as-a-css-background

const canvas  = document.createElement('canvas');
canvas.width  = 600;
canvas.height = 300;
const ctx     = canvas.getContext('2d');

// Oversampling produces graphs with fewer audio aliasing artifacts
// when curve points fall between pixels.
const samplesPerPixel = 4;

export function requestEnvelopeDataURL(data, options) {
    // Allow 1px paddng to accomodate half of 2px stroke of graph line
    const viewBox  = [
        1,
        canvas.height * (1 - 1 / options.viewbox[3]),
        598,
        canvas.height / options.viewbox[3]
    ];
    const valueBox = [0, 1, 2.25, -1];

    // Draw lines / second
    const drawRate = samplesPerPixel * viewBox[2] / valueBox[2];
    const offline  = new OfflineAudioContext(1, samplesPerPixel * viewBox[2], 22050);
    const events   = data.map((e) => ({
        0: e[0] * drawRate / 22050,
        1: e[1],
        2: e[2],
        3: e[3] ? e[3] * drawRate / 22050 : undefined
    }));

    events.unshift({
        0: 0,
        1: 'step',
        2: options.yMax
    });

    const envelope = new Envelope(offline, {
        // Condense time by drawRate so that we generate samplePerPixel
        // samples per pixel.
        'attack': events
    });

    envelope.connect(offline.destination);
    envelope.start(valueBox[0], 'attack');
    envelope.stop(valueBox[2]);

    return offline
    .startRendering()
    .then(function(buffer) {
        //canvas.width = 300;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        options.xLines && options.xLines
        .map(options.xScale)
        .forEach((x) => drawXLine(ctx, viewBox, valueBox, x, options.gridColor));

        options.yLines && options.yLines
        .map(options.yScale)
        .forEach((y) => drawYLine(ctx, viewBox, valueBox, y, options.gridColor));

        const data = buffer.getChannelData(0).map(options.yScale);
        drawCurvePositive(ctx, viewBox, samplesPerPixel, data, options.valueColor);

        return canvas.toDataURL();
    });
}
