(function(jQuery, undefined){
	var debug = this.console && console.log;
	
	// A helper to map multiple event handlers to DOM node bindings, based
	// on the definitions in the object passed in, which looks like:
	// 
	// { 
	//   eventType: function,   // Bind a function to fire on eventType
	//   eventType: {           // Delegate from map
	//     selector: function,  // Selector to delegate to on eventType
	//     ...
	//   }
	// }
	
	jQuery.fn.handle = function(events) {
		var elem = this,
		    event, handler, deleSelector, deleHandler;
		
		for (event in events){
			handler = events[event];
			
			// Either bind the handler...
			if ( typeof handler === 'function' ){
				elem.bind( event, events[event] );
			}
			// ...or delegate the list of handlers
			else {
				for ( deleSelector in handler ){
					deleHandler = handler[deleSelector];
					elem.delegate( deleSelector, event, deleHandler );
				}
			}
		}
		
		return this;
	};
	
	// Create a handler that calls a function from a key:fn
	// map based on the value of an html attribute.
	// 
	// attr    String   - Attribute
	// obj     Object   - A key:value map of attribute handler functions
	// context Object   - Context used as this for calling the callback
	// returns Function - The actual event handler
	
	function handleAttribute(attr, obj, context){
		// Curry link handler using this scope
		return function(e){
			var link = jQuery(e.currentTarget),
			    match = link.attr(attr);
	
			// If the attribute matches an obj key
			if (match && obj[match]) {
				debug && console.log('[Handle attribute]', attr, match);
	
				// Don't do anything browsery
				e.preventDefault();
	
				// Call it with link as scope
				return obj[match].call( context || this, e );
			}
		};
	}
	
	
	// Create a drop handler that calls a function from a key:fn
	// map based on the dropped object's mimetype(s).
	//
	// obj     Object   - A key:value map of attribute handler functions
	// context Object   - Context used as this for calling the callback
	// returns Function - The actual event handler
	
	function handleMimetype(obj, context) {
		// Curry handler using this scope
		return function(e){
			var type;

			// This block is just for logging, so we can see some
			// data. IE does not have the property dataTransfer.types
			// so we can't tell what mimetypes are being carried in IE.
			if (debug && e.originalEvent.dataTransfer.types) {

				var types = e.originalEvent.dataTransfer.types,
						l = types.length,
						dataObj;

				console.group('[Handler] handleMimeType');

				// Log available mimetypes
				while (l--) {
					dataObj = e.originalEvent.dataTransfer.getData(types[l]);
				}
			}

			for (type in obj) {
				if ( e.originalEvent.dataTransfer.getData(type) || (type === 'Files' && e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) ) {
					debug && console.group('Matched mimetype:' + type);

					// Call it with this as scope. If it returns false we want
					// to continue trying other mimetypes, otherwise return.

					if (obj[type].call(context || this, e) !== false) {
						// Don't do anything browsery
						e.preventDefault();
						console.groupEnd();
						break;
					}
				}
			}

			// To end the log group created at the begining of this function
			if (debug && e.originalEvent.dataTransfer.types ) {
				console.groupEnd();
			}
		};
	}
	
	// Extend jQuery.event with helpful handler functions
	
	jQuery.event.handleAttribute = handleAttribute;
	jQuery.event.handleMimetype = handleMimetype;
})(jQuery);