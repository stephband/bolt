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
	
	function getRoleClass(node) {
		var classList = node.className.split(/\s+/),
		    l = classList.length,
		    i = -1;

		while (i++ < l) {
			if (classes[classList[i]]) {
				return classList[i];
			}
		}
	}


	jQuery(document)
	
	// Mousedown on buttons toggle activate on their targets
	.on('mousedown tap', 'a[href^="#"]', function(e) {
		var id, target, elem, data, role;

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

		// Decide what role this object is.
		if (data && data.role) {
			elem = data.elem;
			role = data.role;
		}
		else {
			elem = jQuery(target);
			role = elem.data('role') || getRoleClass(target);
		}
		
		// If it has no role, we have no business trying to activate
		// it on mousedown.
		if (!role) { return; }

		e.preventDefault();

		// Prevent the click that follows the mousedown.
		if (e.type === 'mousedown') { add(e.currentTarget, 'click', preventDefault); }

		if (!classes[role]) { return; }

		if ((data && data.state) || (!data && elem.hasClass('active'))) { return; }

		if (!data) {
			jQuery.data(target, 'active', { role: role, elem: elem });
		}
		
		trigger(target, { type: 'activate', relatedTarget: e.currentTarget });
	})

	// Mouseover on tip links toggle activate on their targets
	.on('mouseover mouseout tap', 'a[href^="#"], [data-tip]', function(e) {
		var href, node, elem, data, role;
		
		href = e.currentTarget.getAttribute('data-tip');
		
		if (href && !(/^#/.test(href))) {
			// The data-tip attribute holds text. Create a tip node and
			// stick it in the DOM
			elem = jQuery('<div/>', {
				'class': 'tip',
				'text': href
			});
			node = elem[0];
			role = 'tip';
			e.currentTarget.setAttribute('data-tip', '#' + identify(node));
			document.body.appendChild(node);
		}
		else {
			if (!href) {
				href = e.currentTarget.hash;
			}

			node = document.getElementById(href.substring(1));
			
			// If there is no node, there's no need to continue. Thanks.
			if (!node) { return; }

			// Get the active data that may have been created by a previous
			// activate event.
			data = jQuery.data(node, 'active');

			elem = (data && data.elem) || jQuery(node);
		}
		
		// Decide what role this object is.
		if (!role) {
			if (data && data.role) {
				role = data.role;
			}
			else {
				role = elem.data('role') || getRoleClass(node);
			}
		}

		if (role && !data) {
		  jQuery.data(elem[0], 'active', { role: role, elem: elem });
		}

		// If it has not the role tip, we have no business trying to activate
		// it on hover.
		if (role !== 'tip') { return; }
		
		// Tap events should make tips show immediately
		if (e.type === 'tap') {
			elem.css(jQuery.prefix('transition')+'Delay', '0');
		}
		
		elem.trigger(e.type === 'mouseout' ? 'deactivate' : { type: 'activate', relatedTarget: e.currentTarget });
	});
})(jQuery);