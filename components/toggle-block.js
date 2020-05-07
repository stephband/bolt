
import '../../dom/js/switchable.js';
import '../../dom/js/swipeable.js';
import { cache, get, last } from '../../fn/module.js';
import { append, before, rect, children, classes, closest, events, find, isTargetEvent, matches, next, previous as prev, query, style } from '../../dom/module.js';

events('dom-activate', document)
.map(get('target'))
.filter(matches('.toggle-block'))
.each(function(node) {
    const box = node.getBoundingClientRect();
    const lastChild = last(node.children);
    const bottom = lastChild && lastChild.getBoundingClientRect().bottom;
    const height = box.height + bottom - box.top;
    node.style.maxHeight = height + 'px';

    events('transitionend', node)
    .each(function(e) {
        node.style.maxHeight = '';
    });
});

events('dom-deactivate', document)
.map(get('target'))
.filter(matches('.toggle-block'))
.each(function(node) {
    const box = node.getBoundingClientRect();
    node.style.transition = 'none';
    node.style.maxHeight = box.height + 'px';

    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            node.style.transition = '';
            node.style.maxHeight = '';
        });
    });
});
