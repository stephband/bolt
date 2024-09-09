
import get      from 'fn/get.js';
import set      from 'fn/set.js';
import overload from 'fn/overload.js';
import { default as getById } from 'dom/get.js';
import events   from 'dom/events.js';
import matches  from 'dom/matches.js';
import trigger  from 'dom/trigger.js';

const selector = '[name="location"]';

function isHashRef(ref) {
    return /^#\S+$/.test(ref);
}

// Delegate change events on [name="location"] elements
events('change', document)
.map(get('target'))
.filter(matches(selector))
.map(get('value'))
// Ignore links for empty spaces
.filter((value) => !!value)
.each(overload(isHashRef, {
    true: function(ref) {
        const id = ref.slice(1);
        // Where default is prevented trigger returns false
        const triggered = trigger('dom-activate', getById(id));
        triggered && (window.location.hash = id);
        //document.activeElement.blur();
    },

    false: set('location', window)
}));

// Delegate click events on button[name="location"] elements
events('click', document)
.map((e) => (e.target.closest('button' + selector) || undefined))
.map(get('value'))
.filter((method) => !!method)
.each((method) => (history[method] ? history[method]() : ''));
