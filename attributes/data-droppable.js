
/**
data-droppable

The `data-droppable` attribute turns an element into a drop target
for drag-and-drop actions, and is given the class `dragover` while data of an
accepted mimetype is being dragged over it.

Define the mimetypes of data to accept in a `data-droppable`
attribute:

```html
<div droppable data-droppable="application/json">
    Drop JSON on me.
</div>
```
*/

import choose    from 'fn/choose.js';
import id        from 'fn/id.js';
import nothing   from 'fn/nothing.js';
import prepend   from 'fn/prepend.js';
import attribute from 'dom/attribute.js';
import classes   from 'dom/classes.js';
import closest   from 'dom/closest.js';
import events    from 'dom/events.js';
import trigger   from 'dom/trigger.js';


let overnode;
let overclasses;


function onOvernode(node, types) {
    overnode = node;
    overclasses = types.map(prepend('dragover-'));
    overclasses.unshift('dragover');

    var list = classes(overnode);
    overclasses.forEach(function(value) {
        list.add(value);
    });
}

function offOvernode() {
    if (!overnode) return;
    const list = classes(overnode);
    overclasses.forEach(function(value) {
        list.remove(value);
    });

    overnode    = undefined;
    overclasses = undefined;
}

function getDroptypes(node) {
    var mimetypes = attribute('data-droppable', node);
    return mimetypes && mimetypes.trim().split(/\s+/);
}

export function dragenter(e) {
    // Has dragenter already been handled? Do nothing.
    if (e.defaultPrevented) return;

    if (overnode && (overnode === e.target || overnode.contains(e.target))) return;
    offOvernode();

    var droppable  = closest('[data-droppable]', e.target);
    if (!droppable) return;

    var dragtypes = e.dataTransfer.types;
    if (!dragtypes.length) return;

    var droptypes = getDroptypes(droppable);
    if (droptypes && droptypes.length) {
        // Check that dragged data has a mimetype in droptypes
        var types = dragtypes.filter(x => droptypes.includes(x));
        if (!types.length) {
            e.dataTransfer.dropEffect = "none";
            return;
        }
    }

    e.dataTransfer.dropEffect = "copy";
    e.preventDefault();
    onOvernode(droppable, types);
}

export function dragover(e) {
    // Has dragover already been handled? Do nothing.
    if (e.defaultPrevented) return;

    var droppable = closest('[data-droppable]', e.target);
    if (!droppable) return;

    e.preventDefault();
}

var parseData = choose({
    'application/json': JSON.parse,
    default: id
});

export function drop(e) {
    // Has drop already been handled? Do nothing.
    if (e.defaultPrevented) return;

    offOvernode();

    var droppable = closest('[data-droppable]', e.target);
    if (!droppable) return;

    // Stop the browser from doing something defaulty like trying to
    // display the dragged thing in a new window.
    e.preventDefault();

    var droptypes = getDroptypes(droppable);
    if (!droptypes) return;

    var dragtypes = e.dataTransfer.types;
    if (!dragtypes.length) return;

    var types = dragtypes.filter(x => droptypes.includes(x));
    if (!types.length) return;

    // Mimetypes should be declared in order of preference. Here we take data
    // from the first mimetype that matches with some data
    let n = -1, mimetype, data;
    while (mimetype = types[++n]) {
        const string = e.dataTransfer.getData(mimetype);
        if (!string) continue;
        data = parseData(mimetype, string);
        break;
    }

    // We need a mechanism to do something useful with this data...
    // Emit another event.
    if (data !== undefined) {
        console.log('Dropped', data);
        trigger({ type: 'dropped', detail: data }, droppable);
    }
}

events('dragenter', document).each(dragenter);
events('dragover', document).each(dragover);
events('drop', document).each(drop);

if (window.console) {
    events('dropped', document).each(function(e) {
        console.log('Dropped data:', e.detail);
    });
}
