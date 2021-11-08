
import parseValue from './parse-value.js';

function toTicks(ticks, value) {
    const tick = ticks[ticks.length - 1];

    // Does value begin with something other than a number? Must be a label.
    if (tick && !/^-?\d/.test(value)) {
        tick.label = value;
    }
    else {
        ticks.push({
            value: parseValue(value)
        });
    }

    return ticks;
}

export default function parseTicks(string) {
    return string
    .split(/\s*,\s*|\s+/)
    .reduce(toTicks, []);
}
