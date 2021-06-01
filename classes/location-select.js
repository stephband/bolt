
import get      from '../../fn/modules/get.js';
import set      from '../../fn/modules/set.js';
import overload from '../../fn/modules/overload.js';
import { default as getById } from '../../dom/modules/get.js';
import events   from '../../dom/modules/events.js';
import matches  from '../../dom/modules/matches.js';
import trigger  from '../../dom/modules/trigger.js';

// Support <select name="location"> (or indeed radio or checkbox or text) and
// the class .location-select for legacy reasons
const selector = '.location-select, [name="location"]';

function isHashRef(ref) {
    return /^#\S+$/.test(ref);
}

// Delegate change events on location-select elements
events('change', document)
.map(get('target'))
.filter(matches(selector))
.map(get('value'))
// Ignore links for empty spaces
.filter((value) => !!value)
.each(overload(isHashRef, {
    true: function(ref) {
        const id = ref.slice(1);
        trigger('dom-activate', getById(id));
        window.location.hash = id;
    },

    false: set('location', window)
}));
