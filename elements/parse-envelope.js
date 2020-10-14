/**
parseEnvelope(string)

The string is parsed for envelope coordinates. Converts strings of the
following form (commas are optional):

```js
"0 0 linear, 1 0.5 exponential, 3 0.25 target 2"
```

Into a nested array of the form:

```js
[
    [0, 0,    "linear"],
    [1, 0.5,  "exponential"], 
    [3, 0.25, "target", 2]
]
```
**/

import capture from '../../fn/modules/capture.js';
import noop from '../../fn/modules/noop.js';

const parseTargetData = capture(/^([+-]?[0-9.]+)/, {
    // Parse:                     (float)
    1: function param(data, captures) {
        data[3] = parseFloat(captures[1]);
        return data;
    },

    catch: function(data) {
        data[3] = defaultTargetEventDuration;
        return data;
    }
});

const parseCoord = capture(/^([0-9.]+)\s+([+-]?[0-9.]+)\s+([\w-]+)/, {
    // Parse:                (x)         (y)              (string)
    0: function x(data, captures) {
        data = {
            0: parseFloat(captures[1]),
            1: parseFloat(captures[2]),
            2: captures[3],
        };

        return data[2] === 'target' ?
            parseTargetData(data, captures) :
            data ;
    },

    catch: noop
}, null);

const parseStart = capture(/^\s*|,\s*|\s+/, {
    // Parse:              start, ',' or ' '
    0: function(data, captures) {
        const coord = parseCoord(captures);
        if (coord) {
            data.push(coord);
            return parseStart(data, captures);
        }
        return data;
    }
});

export function parseEnvelope(string) {
    return parseStart([], string)
}
