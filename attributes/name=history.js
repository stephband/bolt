
import get      from 'fn/get.js';
import events   from 'dom/events.js';
import matches  from 'dom/matches.js';

// Delegate change events on name="history" elements
events('click', document)
.map(get('target'))
.filter(matches('[name="history"]'))
.map(get('value'))
.filter((method) => !!method)
.each((method) => (history[method] ? history[method]() : ''));
