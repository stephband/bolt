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
		.on('change focusout', 'textarea[placeholder], input[placeholder]', changeHandler)
		.on('focusin', 'textarea[placeholder], input[placeholder]', focusHandler)
		
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
