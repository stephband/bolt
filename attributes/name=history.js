
import get      from '../../fn/modules/get.js';
import events   from '../../dom/modules/events.js';
import matches  from '../../dom/modules/matches.js';

// Delegate change events on name="history" elements
events('click', document)
.map(get('target'))
.filter(matches('[name="history"]'))
.map(get('value'))
.filter((method) => !!method)
.each((method) => (history[method] ? history[method]() : ''));
