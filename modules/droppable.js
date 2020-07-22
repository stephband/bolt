
/*
droppable

Listen for drops on droppables, compare their droppable-mimetypes against
the drag data and send a dom-drop event with available data.

Adds the class 'dragover' to droppables during the drag-n-drop action.

<p>The <code>droppable</code> attribute turns an element into
a drop target for drag-and-drop actions, and is given the class
<code>dragover</code> while data of an accepted mimetype is being
dragged over it.</p>
<p>Define the mimetypes of data to accept in the <code>droppable-mimetypes</code>
attribute:</p>

```
<div droppable droppable-mimetypes="application/json">
    Drop JSON on me.
</div>
```
*/

import { choose, id, intersect, nothing, prepend } from '../../fn/module.js';
import { attribute, classes, closest, events, on } from '../../dom/module.js';

const trigger = events.trigger;

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
    var mimetypes = attribute('droppable-mimetypes', node);
    return mimetypes && mimetypes.trim().split(/\s+/);
}

function dragenter(e) {
    if (overnode && (overnode === e.target || overnode.contains(e.target))) { return; }
    offOvernode();

    var droppable  = closest('.droppable, [droppable]', e.target);
    if (!droppable) { return; }

    var dragtypes = e.dataTransfer.types;
    if (!dragtypes.length) { return; }

    var droptypes = getDroptypes(droppable);
    if (!droptypes) {
        // Where droppable-mimetypes is not defined, assume the droppable won't
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


on('dragenter', dragenter, document);
on('dragover', dragover, document);
on('drop', drop, document);

if (window.console) {
    on('dom-drop', function(e) {
        console.log('Dropped data:', e.detail);
    }, document);
}
