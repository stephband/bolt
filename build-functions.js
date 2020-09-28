// Import from direct path so that Sparky is not launched on templates immediately
import { register } from '../sparky/modules/fn.js';

register('filter-type', function(node, params) {
    const type = params[0];
    return this.map(function(array) {
        return array.reduce(function(output, data) {
            // Remove preceeding title where it is not followed by a
            // data of the right type
            if (data.type !== type && output[output.length - 1] && output[output.length - 1].type === 'title') {
                --output.length;
            }

            if (data.type === type || data.type === 'title') {
                output.push(data);
            }

            return output;
        }, []);
    });
});