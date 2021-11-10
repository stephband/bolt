
import parseValue from './parse-value.js';

function toPoints(points, value) {
    const point = points[points.length - 1];

    if (point && point.y === undefined) {
        point.y = parseValue(value);
    }
    else if (point && !/^-?\d/.test(value)) {
        point.type = value;
    }
    else {
        points.push({
            x: parseValue(value)
        });
    }

    return points;
}

export default function parseCoordinates(string) {
    return string
    .split(/\s*,\s*|\s+/)
    .reduce(toPoints, []);
}
