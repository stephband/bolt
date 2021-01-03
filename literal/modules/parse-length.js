
import id         from '../../../fn/modules/id.js';
import overload   from '../../../fn/modules/overload.js';
import parseValue from '../../../fn/modules/parse-value.js';
import toType     from '../../../fn/modules/to-type.js';

/**
parselength(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25rem'.
**/

const parseLength = overload(toType, {
    'number': id,

    'string': parseValue({
        'px': (n) => n,
        'em': (n) => 16 * n,
        'rem': (n) => 16 * n,
        catch: (n, unit) => {
            if (Number.isNaN(n)) {
                throw new Error('Invalid CSS length');
            }

            if (unit) {
                throw new Error('Invalid CSS length unit ' + unit);
            }

            return n;
        }
    })
});

export default parseLength;

/**
toPx(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25rem'.
**/

export function px(n) {
    return parseLength(n) + 'px';
}

/**
toRem(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25rem'.
**/

export function em(n) {
    return parseLength(n) / 16;
}

export function rem(n) {
    return (parseLength(n) / 16);
}

/*
export function formatrem() {
    // Chrome needs min 7 digit precision for accurate rendering
    .toFixed(8)
    // Remove trailing 0s
    .replace(/\.?0*$/, '')
    // Postfix
    + 'rem';
}
*/