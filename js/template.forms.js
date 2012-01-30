// Handle form elements

(function(jQuery, document, undefined){
	var doc = jQuery(document);
	
	function fieldData(target) {
		var data = jQuery.data(target, 'field'),
		    field, name;
		
		if (!data){
			field = jQuery(target);
			name = field.attr('name');
			
			data = {
				field: field,
				label: jQuery('label[for="'+target.id+'"]')
			};
			
			if (name) {
			  data.fields = jQuery('input[name="'+name+'"]');
			}
			
			jQuery.data(target, 'field', data);
		}
		
		return data;
	}
	
	function populateSelect(node){
		// Take a select node and put it's selected option content
		// in the associated label.

		var view = fieldData(node),
				html;
		
		// Remove text nodes from the button
		view.label
		.contents()
		.filter(function() {
			return this.nodeType === (window.Node ? Node.TEXT_NODE : 3);
		})
		.remove();
		
		// Prepend the current value of the select
		html = view.field.find('option[value="'+node.value+'"]').html();
		view.label.prepend(html);
	}
	
	doc
	
	// Readonly inputs have their text selected when you click
	// on them.
	
	.delegate('input[readonly]', 'focus click', function(e) {
		jQuery(e.currentTarget).select();
	})
	
	// Extend the events emitted by input[type='range']
	// nodes with changestart and changeend events.
	
	.delegate('input[type="range"]', 'mousedown touchstart', (function(){
		var endTypes = {
			mousedown: 'mouseup',
			touchstart: 'touchend'
		};
		
		function change(e){
			jQuery(e.target)
			.trigger({ type: 'changestart' })
			.unbind('change', change);
		}
		
		function mouseup(e){
			jQuery(e.target)
			.trigger({ type: 'changeend' })
			.unbind('mouseup', mouseup);
		}
		
		return function(e){
			jQuery(e.target)
			.bind('change', change)
			.bind(endTypes[ e.type ], mouseup);
		};
	})())
	
	// Global form validation
	
	.delegate( 'input, textarea', 'change', function(e) {
		jQuery(this).validate({
			fail: function(){ e.preventDefault(); }
		});
	})
	
	// Active classes for radio input labels
	
	.delegate('input[type="radio"]', 'change', function(e){
		var data = fieldData(e.target);
		
		if (data.fields) {
			data.fields.trigger('statechange');
		}
	})
	
	.delegate('input[type="radio"]', 'statechange', function(e) {
		var data = fieldData(e.target);
		
		if (data.field.prop('checked')) {
			data.label.addClass('active');
		}
		else {
			data.label.removeClass('active');
		}
	})
	
	// Active classes for checkbox input labels
	
	.delegate('input[type="checkbox"]', 'change', function(e) {
		var data = fieldData(e.target);
		
		if (data.field.prop('checked')) {
			data.label.addClass('active');
		}
		else {
			data.label.removeClass('active');
		}
	})
	
	// Value display for select boxes that are wrapped in buttons
	// for style. The value is set as the content of the label.
	.on('change', '.button > select', function(e) {
		populateSelect(e.target);
	})
	
	.on('focusin focusout', '.button > select', function(e) {
		var view = fieldData(e.target);
		
		if (e.type === 'focusin') {
			view.label.addClass('focus');
		}
		else {
			view.label.removeClass('focus');
		}
	})
	
	.ready(function() {
		jQuery('.button > select').each(function() {
			populateSelect(this);
		});
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
})(jQuery, document);



// Create placeholder labels when browser does not
// natively support placeholder attribute.

(function( jQuery, undefined ){
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
})(jQuery);