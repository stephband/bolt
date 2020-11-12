
import '../../bolt/modules/switchable.js';
import '../../bolt/modules/swipeable.js';
import '../../fn/modules/stream.wait.js';
import { cache, get, last } from '../../fn/module.js';
import { append, before, rect, children, classes, closest, events, find, isTargetEvent, matches, next, previous as prev, query, style } from '../../dom/module.js';

const maxDuration = 0.5;

function updateSlideshowHrefs(node) {
    var block = closest('.slides-block', node);
    if (!block) { return; }

    var prevSlide = prev(node) || last(query('.switchable', block));
    var nextSlide = next(node) || query('.switchable', block)[0];
    var prevThumb = query('.prev-thumb', block);
    var nextThumb = query('.next-thumb', block);

    prevThumb.forEach(function(node) {
        node.href = '#' + prevSlide.id;
    });

    nextThumb.forEach(function(node) {
        node.href = '#' + nextSlide.id;
    });
}

function requestFrame(n, fn) {
    var frame;

    function request() {
        frame = requestAnimationFrame(--n > 0 ? request : fn);
    }

    function cancel() {
        cancelAnimationFrame(frame);
    }

    request();
    return cancel;
}

function update(parent, node) {
    var cl = classes(parent);
    var box = rect(node);

    // Slides not visible will bork
    if (!box) { return; }

    var l1 = box.left;
    var l2 = rect(parent).left;
    var l  = l1 - l2 - style('margin-left', node);

    cl.add('no-transition');
    parent.style.transform = 'translate(' + (-l) + 'px, 0px)';

    // The above may not have taken place inside a frame, in which case the
    // DOM will refresh at the same time as the coming frame.. so we need
    // the frame after that to teardown.
    requestFrame(2, function() {
        cl.remove('no-transition');
    });
}

function shuffle(view, slides, parent, node) {
    clearTimeout(view.timer);
    events.off(parent, 'transitionend', view.transitionend);

    var i = slides.indexOf(node);
    var movers;

    if (i < 2) {
        movers = slides.splice(i - 2);
        movers.forEach(before(slides[0]));
        update(parent, node);
    }
    else if (i + 3 > slides.length) {
        movers = slides.splice(0, 2 - (slides.length - i - 1));
        movers.forEach(append(parent));
        update(parent, node);
    }

    // Regenerate the prev / next button hrefs
    updateSlideshowHrefs(node);
}

var getView = cache(function(parent) {
    return {};
});

// Move slides around the DOM to give the feel of a continuous slideshow
events('dom-activate', document)
.map(get('target'))
.dedup()
.filter(matches('.switchable, [switchable]'))
.each(function(node) {
    var parent = node.parentNode;
    var view   = getView(parent);

    if (!matches('.swipeable, [swipeable]', parent)) { return; }

    var slides = children(parent).filter(matches('.switchable, [switchable]'));

    if (slides.length < 3) {
        console.warn("Slides: Not enough slides to create 'infinite' slideshow.")
        updateSlideshowHrefs(node);
        return;
    }

    function transitionend(e) {
        if (!isTargetEvent(e)) { return; }
        shuffle(view, slides, parent, node);
    }

    clearTimeout(view.timer);
    view.timer = setTimeout(shuffle, maxDuration * 1000, view, slides, parent, node);

    events.off(parent, 'transitionend', view.transitionend);
    view.transitionend = transitionend;
    events.on(parent, 'transitionend', view.transitionend);
});

function updateBlock(block) {
    var parent = find('.swipeable, [swipeable]', block);
    var node   = find('.active', block);
    update(parent, node);
}

// Reposition slides when window resizes
events('resize', window)
.wait(0.333333)
.flatMap(function() {
    return query('.slides-block', document);
})
.each(updateBlock);
