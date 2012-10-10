// Hijax user actions that must trigger dropdowns, popdowns slides
// and tabs and handle sending activate events to them.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './bolt', './jquery.prefix'], module);
	} else {
		// Browser globals
		module(jQuery, jQuery.bolt);
	}
})(function(jQuery, bolt, undefined){
	var debug = true;
	
	function prepareDragData(e){
		var elem = jQuery(e.target),
		    data = elem.data('mimetypes'),
		    mimetype;
	
		if (!data) { return; }
	
		if (typeof data === 'string') { data = JSON.parse(data); }
	
		for (mimetype in data){
			if (debug) console.log('[drag data] mimetype:', mimetype, 'data:', data[mimetype]);
			e.originalEvent.dataTransfer.setData(mimetype, JSON.stringify(data[mimetype]));
		}
	};
	
	function prepareDragFeedback(e){
		var elem = jQuery( e.target ),
		    data = elem.data('feedback'),
		    offset, dragOffset;

		if (data && data.node){
			if (debug) console.log('[drag feedback] node:', data.node);
			jQuery(document.body).append(data.node);
			e.originalEvent.dataTransfer.setDragImage(data.node, data.width || 32, data.height || 32);
		}
		else {
			offset = elem.offset();
			dragOffset = {
				offsetX: e.pageX - offset.left,
				offsetY: e.pageY - offset.top
			};

			if (debug) console.log('[drag feedback] offset:', dragOffset);
			e.originalEvent.dataTransfer.setDragImage( e.target, dragOffset.left, dragOffset.top );
			e.originalEvent.dataTransfer.setData( 'webdoc/offset', JSON.stringify(dragOffset) );
		}
	};
	
	bolt.prepareDragData = prepareDragData;
	bolt.prepareDragFeedback = prepareDragFeedback;
});