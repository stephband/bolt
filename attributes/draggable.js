/*
draggable

The native behaviour of the `draggable="true"`*
attribute is extended with the `draggable-mimetypes`
attribute, which defines data to be carried by a drag action:

```html
<div draggable="true" draggable-mimetypes="application/json: [0,1,2,3]">
    Drag me
</div>
```

<small>* Note that `draggable` must be `"true"`. It is not a boolean attribute.</small>
*/

import { capture } from '../../fn/modules/capture.js';

import attribute from '../../dom/modules/attribute.js';
import classes, { removeClass } from '../../dom/modules/classes.js';
import delegate  from '../../dom/modules/delegate.js';
import identify  from '../../dom/modules/identify.js';
import select    from '../../dom/modules/select.js';
import remove    from '../../dom/modules/remove.js';
import { on, off }  from '../../dom/modules/events.js';

import { register } from '../../sparky/module.js';

var debug  = true;

//                 xxxxx: wef;
var rmimetype = /^([^:\s]+)\s*:\s*([^;\s]+);\s*/;

function lastIndex(data) {
	return data.index + data[0].length;
}

function dragstartButton(target, e) {
	var data = attribute('draggable-mimetypes', target);

	if (data) {
		data = capture(rmimetype, {
			1: function handleMime(data, results) {
				data[results[1]] = results[2];
				if ((lastIndex(results) + 2) < results.input.length) {
					parse(rmimetype, { 1: handleMime }, data, results);
				}
				return data;
			}
		}, {}, data);
	}
	else {
		// Todo: needed for Neho - factor out
		data = {
			"Text":       identify(target),
			"text/plain": identify(target)
			//"application/json": JSON.stringify({})
		};
	}

	var mimetype;

	for (mimetype in data){
		// IE only accepts the types "URL" and "Text". Other types throw errors.
		try {
			e.dataTransfer.setData(mimetype, data[mimetype]);
			e.dataTransfer.dropEffect = "none";
			e.dataTransfer.effectAllowed = "all";

			// Wait for the next frame before setting the dragging class. It's
			// for style, and if it is styled immediately the dragging ghost
			// also gets the new style, which we don't want.
			window.requestAnimationFrame(function() {
				classes(target).add('dragging');
			});
		}
		catch(e) {
			if (debug) { console.warn('[drag data] mimetype: ' + mimetype + ' Can\'t be set.'); }
		}
	}
}

var dragstart = delegate({ '[draggable]': dragstartButton });

function dragend(e) {
	classes(e.target).remove('dragging');
}

on('dragstart', dragstart, document);
on('dragend', dragend, document);


function dragendButton(e) {
	select('.dropzone', document).forEach(remove);
	select('.dragover', document).forEach(removeClass('dragover'));
}

register('data-on-drag', function(node, params) {
	var dragstart = delegate({ '[draggable]': dragstartButton });
	var dragend   = delegate({ '[draggable]': dragendButton });

	//.on('selectstart', '.node-button', cache, selectstartIE9)
	on('dragstart', dragstart, node);
	//.on('drag', '.node-button', cache, dragButton)
	on('dragend', dragend, node);

	this.done(function() {
		off('dragstart', dragstart, node);
		off('dragend', dragend, node);
	});
});
