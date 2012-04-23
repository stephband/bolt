// Handle dropdowns, popdowns and tabs

(function( jQuery, undefined ){
	var debug = (window.console && window.console.log),
	    
	    classes = jQuery.event.special.activate.classes,
	    
	    add = jQuery.event.add,
	    
	    remove = jQuery.event.remove,

	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    };

	function identify(node) {
		var id = node.id;

		if (!id) {
			do { id = Math.ceil(Math.random() * 1000000); }
			while (document.getElementById(id));
			node.id = id;
		}

		return id;
	}

	function preventDefault(e) {
		e.preventDefault();
	}
	
	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}
	
	jQuery(document)
	
	// Mousedown on buttons toggle activate on their targets
	.delegate('a[href^="#"]', 'mousedown tap', function(e) {
		var id, target, elem, data, type;

		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (e.type === 'mousedown' && !isLeftButton(e)) { return; }
		
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.isDefaultPrevented()) { return; }
		
		id = e.currentTarget.hash.substring(1);
		target = document.getElementById(id);

		if (!target) { return; }
		
		// Get the active data that may have been created by a previous
		// activate event.
		data = jQuery.data(target, 'active');
		
		// Decide what type this object is.
		if (data && data.type) {
			elem = data.elem;
			type = data.type;
		}
		else {
			elem = jQuery(target);

			for (type in classes) {
				if (elem.hasClass(type)) { break; }
				else { type = undefined; }
			}
		}
		
		// If it has no type, we have no business trying to activate
		// it on mousedown.
		if (!type) { return; }

		e.preventDefault();

		add(e.currentTarget, 'click tap', preventDefault);

		if (!classes[type]) { return; }

		if ((data && data.state) || (!data && elem.hasClass('active'))) { return; }

		if (!data) {
			jQuery.data(target, 'active', { type: type, elem: elem });
		}
			
		trigger(target, { type: 'activate', relatedTarget: e.currentTarget });
	})

	// Mouseover on links toggle activate on their targets
	.delegate('a[href^="#"], [data-tip]', 'mouseover mouseout tap', function(e) {
		var href, node, elem, data, type;
		
		href = e.currentTarget.getAttribute('data-tip');
		
		if (href && !(/^#/.test(href))) {
			elem = jQuery('<div/>', {
				'class': 'tip',
				text: href
			});
			
			node = elem[0];
			e.currentTarget.setAttribute('data-tip', '#' + identify(node));
			jQuery(document.body).append(elem);
		}
		else {
			if (!href) {
				href = e.currentTarget.hash;
			}

			node = document.getElementById(href.substring(1));
			
			// If there is no node, there's no need to continue. Thanks.
			if (!node) { return; }
			
			elem = jQuery(node);

			// Get the active data that may have been created by a previous
			// activate event.
			data = jQuery.data(node, 'active');
		}
		
		// Decide what type this object is.
		if (data && data.type) {
			type = data.type;
		}
		else {
			for (type in classes) {
				if (elem.hasClass(type)) { break; }
				else { type = undefined; }
			}
		}

		if (type && !data) {
		  jQuery.data(elem[0], 'active', { type: type, elem: elem });
		}

		// If it has not type tip, we have no business trying to activate
		// it on hover.
		if (type !== 'tip') { return; }
		
		// Tap events should make tips show immediately
		if (e.type === 'tap') {
			elem.css(jQuery.prefix('transition')+'Delay', '0ms');
		}
		
		elem.trigger(e.type === 'mouseout' ? 'deactivate' : { type: 'activate', relatedTarget: e.currentTarget });
	});
})(jQuery);