/* Canvas */

import Envelope from '../../../soundstage/nodes/envelope.js';
import { drawCurvePositive } from '../../../soundstage/modules/canvas.js';


// Oversampling produces graphs with fewer audio aliasing artifacts
// when curve points fall between pixels.
const samplesPerPixel = 4;

export function drawAudioEnvelope(ctx, viewbox, valuebox, events, color) {
    // Draw lines / second
    const drawRate = samplesPerPixel * viewbox.width / valuebox.width;
    const offline  = new OfflineAudioContext(1, samplesPerPixel * viewbox.width, 22050);
    const envelope = new Envelope(offline, { 'attack': events.map((event) => (
            // Condense time by drawRate so that we generate samplePerPixel
            // samples per pixel.
            event.type === 'target' ?
                new Event(event.x * drawRate / 22050, event.y, event.type, event.duration) :
                new Event(event.x * drawRate / 22050, event.y, event.type)
        ))
    });

    envelope.connect(offline.destination);
    envelope.start(valuebox.x, 'attack');
    envelope.stop(valuebox.width);

    return offline
    .startRendering()
    .then((buffer) => {
        const data = buffer.getChannelData(0).map((y) => this.toPxY(y));
        drawCurvePositive(ctx, viewbox, samplesPerPixel, data, color);
    });
}
