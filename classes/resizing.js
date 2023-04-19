
// .batch() only exists on Stream when full module imported, import it first
import Stream from '../../fn/modules/stream.js';
import events from '../../dom/modules/events.js';

const classes =  document.documentElement.classList;

events('resize', window)
.batch(0.333333333)
.each((batch) => {
    classes.add('resizing');
    batch.done(() => classes.remove('resizing'));
});
