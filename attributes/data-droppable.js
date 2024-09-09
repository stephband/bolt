
/**
data-droppable

The `droppable` attribute turns an element into a drop target for drag-and-drop
actions, and is given the class `dragover` while data of an accepted mimetype is
being dragged over it.

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
import intersect from 'fn/intersect.js';
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
    if (!overnode) { return; }
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

function dragenter(e) {
    if (overnode && (overnode === e.target || overnode.contains(e.target))) { return; }
    offOvernode();

    var droppable  = closest('[droppable], [data-droppable]', e.target);
    if (!droppable) { return; }

    var dragtypes = e.dataTransfer.types;
    if (!dragtypes.length) { return; }

    var droptypes = getDroptypes(droppable);
    if (!droptypes) {
        // Where data-droppable is not defined, assume the droppable won't
        // exclude any types. Strange assumption, perhaps?
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        onOvernode(droppable, nothing);
        return;
    }

    var types = intersect(dragtypes, droptypes);

    if (!types.length) {
        e.dataTransfer.dropEffect = "none";
        return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    onOvernode(droppable, types);
}

function dragover(e) {
    var droppable = closest('.droppable, [droppable]', e.target);
    if (!droppable) { return; }
    e.preventDefault()
}

var parseData = choose({
    'application/json': JSON.parse,
    default: id
});

function drop(e) {
    offOvernode();

    var droppable = closest('.droppable, [droppable]', e.target);
    if (!droppable) { return; }

    // Stop the browser from doing something defaulty like trying to
    // display the dragged thing in a new window.
    e.preventDefault();

    var droptypes = getDroptypes(droppable);
    if (!droptypes) { return; }

    var dragtypes = e.dataTransfer.types;
    if (!dragtypes.length) { return; }

    var types = intersect(dragtypes, droptypes);
    if (!types.length) { return; }

    var data = types.map(function(mimetype) {
        var data = e.dataTransfer.getData(mimetype);
        return data && {
            mimetype: mimetype,
            data: parseData(mimetype, e.dataTransfer.getData(mimetype))
        } || undefined ;
    });

    // We need a mechanism to do something useful with this data...
    // Emit another event.
    trigger(droppable, 'dom-drop', { detail: data });
}

events('dragenter', document).each(dragenter);
events('dragover', document).each(dragover);
events('drop', document).each(drop);

if (window.console) {
    events('dom-drop', dcoument).each(function(e) {
        console.log('Dropped data:', e.detail);
    });
}
