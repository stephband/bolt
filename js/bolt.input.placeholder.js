// Create placeholder labels when browser does not
// natively support placeholder attribute.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function( jQuery, undefined ){
	var store = {},
			a = 0;
	
	function identify(fly){
	  // Generate an id, apply it to the input node
	  // and return it.
	  var id = 'input_' + a++ ;
	  
	  fly.id = id;
	  return id;
	}
	
	function changeHandler(e) {
		var input = e.target,
		  	value = input.value,
		  	placeholder = store[input.id];
		
		if ( !value || !value.length ) {
		  placeholder.css({ display: 'block' });
		}
		else {
		  placeholder.css({ display: 'none' });
		};
	}
	
	function focusHandler(e) {
		var input = e.target,
		  	placeholder = store[input.id];
		
		placeholder.css({ display: 'none' });
	}
	
	// Feature detect placeholder support, and when there is no
	// support create placeholder labels to simulate placeholder
	// attributes, and delegate event handlers.
	
	if (!jQuery.support.placeholder) {
		
		// Delegate events coming from inputs and texareas with placeholders.
		
		jQuery(document)
		.delegate('textarea[placeholder], input[placeholder]', 'change focusout', changeHandler)
		.delegate('textarea[placeholder], input[placeholder]', 'focusin', focusHandler)
		
		// Create placeholder labels.
		
		.ready(function() {
			var elem = jQuery('textarea[placeholder], input[placeholder]');
			
			elem.each(function(i){
				var input = this,
				    elem = jQuery(this),
				    id = input.id || identify(input),
				    val = input.value,
				    css = elem.position(),
				    height = input.nodeName.toLowerCase() === 'input' ? elem.height() : elem.css('lineHeight'),
				    text = input.getAttribute('placeholder'),
				    placeholder = jQuery('<label/>', {
				    	'class': 'placeholder',
				    	'for': id,
				    	'text': text
				    });

				jQuery.extend(css, {
					height: height + 'px',
					lineHeight: height + 'px',
					fontSize: elem.css('font-size'),
					paddingLeft: elem.css('padding-left'),
					paddingRight: elem.css('padding-right')
				});

				placeholder
				.css(css)
				.insertAfter(elem);

				store[id] = placeholder;

				if (!val || !val.length) {
					placeholder.css({ display: 'block' });
				};
			});
		});
	}
});

// Create placeholder labels when browser does not
// natively support placeholder attribute.

//if ( !jQuery.support.placeholder ) {
//	
//	doc
//	.delegate('textarea[placeholder], input[placeholder]', 'change valuechange', function(){
//		var input = jQuery(this),
//				value = input.val();
//		
//		if ( !value || !value.length ) {
//			input.addClass('empty');
//		}
//		else {
//			input.removeClass('empty');
//		};
//	})
//	
//	// TODO: bind DOMNodeInserted only at the end of the
//	// ready function, as we're not actually interested in
//	// processing DOM nodes that get inserted before that.
//	// Also, find a way of emulating DOMNodeInserted in IE.
//	
//	.bind('ready DOMNodeInserted', (function(){
//		var ignore = false;
//		
//		function identify(node){
//			// Generate an id, apply it to the input node
//			// and return it.
//			return (node.id = 'input_' + parseInt(Math.random() * 100000000));
//		}
//		
//		return function(e){
//			var elem;
//			
//			//console.log('DOM node inserted', e.target);
//			
//			if (ignore) { return; }
//			
//			// Look for nodes with placeholder attributes.
//			elem = (
//				e.target.getAttribute && e.target.getAttribute('placeholder') ?
//					jQuery(e.target) :
//				e.target.childNodes.length ?
//					jQuery('textarea[placeholder], input[placeholder]', e.target) :
//					false
//			);
//			
//			if (!elem || !elem.length) { return; }
//			
//			console.log('DOM node inserted, needs placeholder', e.target);
//			
//			elem.each(function(i){
//				var input = jQuery(this),
//						id, value, height, position, text, placeholder;
//				
//				// If placeholder already exists, do nothing.
//				if (input.data('placeholder')) { return; }
//				
//				id = this.id || identify(this);
//				value = input.val();
//				height = input.is('input') ? input.outerHeight() : input.css('lineHeight');
//				position = input.position();
//				text = input.attr('placeholder');
//				placeholder = jQuery('<label/>', {
//				  html: text,
//				  'for': id, 
//				  'class': 'placeholder',
//				  
//				  // It's not really my style to be setting CSS in
//				  // JavaScript, but it seems to make sense here.
//				  // Let's see how this plays out.
//				  css: {
//				  	top: position.top,
//				  	left: position.left,
//				  	height: height,
//				  	lineHeight: height + 'px',
//				  	paddingLeft: input.css('paddingLeft'),
//				  	paddingRight: input.css('paddingRight')
//				  }
//				});
//				
//				// Use ignore to signal that the inserted node is coming
//				// from this function!
//				ignore = true;
//				
//				input
//				.after(placeholder)
//				.data('placeholder', placeholder);
//				
//				ignore = false;
//				
//				if (!value || !value.length) {
//					input.addClass('empty');
//				};
//			});
//		};
//	})());
//}