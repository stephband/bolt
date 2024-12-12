
/**
data-law

Extends range inputs with a `data-law` attribute. The named fader law is
applied to the input value and set as a number on `input.outputValue`.

```html
<input type="range" step="any" data-law="log-24db" value="0" />
```

```js
input.addEventListener('input', (e) => {
    const value = e.target.outputValue;
});
```

Two other values are also set. `input.normalValue` is a number in the range
`0-1` (regardless of `min` and `max`) that effectively describes the position
of the handle on its track.

Normal value is also exposed as style var `--normal-value`. Use this to apply
styles that respond to handle movement.

Possible fader laws:

- "linear", the default behaviour of a range input
- "pow-2", exponential curve
- "pow-3", exponential curve
- "pow-4", exponential curve
- "log", logarithmic curve, `min` *must* be positive
- "log-6db", linear up to -6dB, then logarithmic to `"max"`
- "log-12db", linear up to -12dB
- "log-18db", linear up to -18dB
- "log-24db", linear up to -24dB
- "log-30db", linear up to -30dB
- "log-36db", linear up to -36dB
- "log-48db", linear up to -48dB
- "log-60db", linear up to -60dB
- "log-72db", linear up to -72dB
- "log-96db", linear up to -96dB
**/


import delegate    from 'dom/delegate.js';
import events      from 'dom/events.js';
import clamp       from 'fn/clamp.js';
import normalise   from 'fn/normalise.js';
import getLaw      from 'form/modules/scales.js';


function assignValues(input) {
    const min    = input.min === '' ? 0   : parseFloat(input.min);
    const max    = input.max === '' ? 100 : parseFloat(input.max);
    const law    = getLaw(input.dataset.law);

    if (!law) throw new Error('Input law data-law="' + input.dataset.law + '" not found');

    const value  = input.valueAsNumber || parseFloat(input.value);
    const normal = normalise(min, max, value);
    const output = law.denormalise(min, max, normal);

    // Depending on the law rounding errors may have crept in - clamp output
    input.normalValue = normal;
    input.outputValue = clamp(min, max, output);
    input.style.setProperty('--normal-value', normal);
}

export default function setupDataLaw(root) {
    // Listen in capture phase so that all listeners in bubble phase get it
    return events({ type: 'input', select: '[type="range"][data-law]', capture: true }, root)
    .each((e) => assignValues(e.target));
}

// Updates anything already in the DOM
document.body.querySelectorAll('[data-law]').forEach((input) => assignValues(input));

// Setup document. TODO: We may wnot want this, as we want to use this module in CEs without updating the document
setupDataLaw(document);
