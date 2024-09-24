import events from 'dom/events.js';

/* Elements with overflow hidden have a nasty habit of scrolling, particularly
   in Safari. Here we augment the .no-scroll class to reset scroll to 0 whenever
   it tries to misbehave. */

events({ type: 'scroll', passive: true, capture: true }, document.documentElement).each((e) => {
    // Safari sometimes has document as e.target, which is a bit nuts. document
    // does not have .matches().
    if (!e.target.matches('.no-scroll')) return;
    e.target.scrollLeft = 0;
    e.target.scrollTop  = 0;
});
