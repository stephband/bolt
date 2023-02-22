
import get      from '../../fn/modules/get.js';
import events   from '../../dom/modules/events.js';

// Support <select name="window"> (or indeed radio or checkbox or text) and
// the class .location-select for legacy reasons
const selector = '[name="window"]';

// Delegate click events on button[name="location"] elements
events('click', document)
.map((e) => (e.target.closest('button' + selector) || undefined))
.map(get('value'))
.filter((method) => !!method)
.each((method) => (window[method] ? window[method]() : ''));
