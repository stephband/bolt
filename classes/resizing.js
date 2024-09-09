
// .batch() only exists on Stream when full module imported, import it first
import Stream from 'fn/stream.js';
import events from 'dom/events.js';

const classes =  document.documentElement.classList;
let timer;

events('resize', window)
.each((e) => {
    if (timer) {
        classes.add('resizing');
        clearTimeout(timer);
    }

    timer = setTimeout(() => {
        classes.remove('resizing');
        timer = undefined;
    }, 333);
});
