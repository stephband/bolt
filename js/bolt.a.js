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
	var doc = jQuery(document),
	    docElem = jQuery(document.documentElement),
	    
	    add = jQuery.event.add,
	    remove = jQuery.event.remove,
	    trigger = function(node, type, data) {
	        jQuery.event.trigger(type, data, node);
	    },
	    
	    rImage = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/,
	    
	    targets = {
	    	dialog: function(e) {
	    		var ref = e.currentTarget.getAttribute('data-href') || e.currentTarget.hash,
	    		    id = ref.substring(1),
	    		    node;
	    		
	    		if (!id) { return loadResource(e); }
	    		
	    		node = document.getElementById(id);
	    		
	    		if (!node) { return; }
	    		
	    		e.preventDefault();
	    		
	    		// If the node is html hidden inside a text/html script tag,
	    		// extract the html.
	    		if (node.getAttribute('type') === 'text/html') {
	    			node = jQuery(node).html();
	    		}
	    		
	    		jQuery(node).dialog('lightbox');
	    	}
	    };
	
	function loadResource(e) {
		var link = e.currentTarget,
		    path = link.pathname,
		    node, elem, dialog;
		
		if (rImage.test(path)) {
			e.preventDefault();
			
			node = new Image();
			elem = jQuery(node);
			
			elem.dialog('lightbox');
			
			dialog = elem.parent();
			dialog.addLoadingIcon();
			
			elem.on('load', function() {
				dialog.removeLoadingIcon();
			});
			
			node.src = link.href;
		}
	}
	
	function preventDefault(e) {
		remove(e.currentTarget, 'click', preventDefault);
		e.preventDefault();
	}
	
	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			add(e.currentTarget, 'click', preventDefault);
		}
	}
	
	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or
		// primary) mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}
	
	function isIgnorable(e) {
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.isDefaultPrevented()) { return true; }

		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (e.type === 'mousedown' && !isLeftButton(e)) { return true; }
		
		// Ignore key presses other than the enter key
		if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
	}
	
	function isExternalLink(e) {
		var location = window.location,
		    link = e.currentTarget;
		
		if (location.origin !== link.origin) { return true; }
		if (location.pathname !== link.pathname) { return true; }
	}
	
	function activateHash(e) {
		var id, node, elem, data, clas;
		
		if (isIgnorable(e)) { return; }
		
		if (isExternalLink(e)) { return; }
		
		id = e.currentTarget.hash.substring(1);
		node = document.getElementById(id);
		
		// This link does not point to an id in the DOM. No action required.
		if (!node) { return; }

		// Get the bolt data that may have been created by a previous
		// activate event.
		data = jQuery.data(node);

		// Decide what class this object is.
		if (data.bolt && data.bolt['class']) {
			// It does no harm to cache data.elem here while we have it.
			// It's used later by the activate event.
			elem = data.bolt.elem;
			clas = data.bolt['class'];
		}
		else {
			elem = jQuery(node);
			clas = bolt.classify(node);
			
			// It does no harm to cache elem here while we have it. It's
			// used later by the activate event.
			data.elem = elem;
		}

		// If it has no bolt registered class, we have no business trying
		// to activate it on mousedown.
		if (!clas) { return; }

		// Attach bolt's data to the target
		if (!data.bolt) {
			data.bolt = {
				'elem': elem,
				'class': clas 
			};
		}

		e.preventDefault();
		
		if (e.type === 'mousedown') {
			preventClick(e);
		}

		if (!bolt.has(clas, 'activate')) { return; }

		if (data.active === undefined ?
				elem.hasClass('active') :
				data.active ) {
			return;
		}

		trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
	}
	
	
	// Run jQuery without aliasing it to $
	jQuery.noConflict();
	
	
	doc
	
	// Remove loading classes from document element
	.ready(function() {
		docElem.removeClass('notransition loading');
	})
	
	// Select boxes that act as navigation
	.on('change', '.nav_select', function(e) {
		var value = e.currentTarget.value;
		window.location = value;
	})
	
	// Mousedown on buttons toggle activate on their targets
	.on('mousedown tap keydown', 'a[target]', function(e) {
		var target = e.currentTarget.target;
		
		if (isIgnorable(e)) { return; }
		
		// If the target is not listed, ignore
		if (!targets[target]) { return; }
		
		if (e.type === 'mousedown') { preventClick(e); }
		
		return targets[target](e);
	})
	
	// Clicks on close buttons deactivate the thing they are inside
	.on('click tap', '.close_thumb, .close_button, .cancel_button', function(e) {
		var elem = jQuery(e.currentTarget).closest('.popdown, .dialog_layer');
		
		if (!elem.length) { return; }
		
		elem.trigger({
			type: 'deactivate',
			relatedTarget: e.currentTarget
		});
		
		e.preventDefault();
	})

	// Mousedown on buttons toggle activate on their targets
	.on('mousedown tap keydown', 'a[href]', activateHash)

	// Mouseover on tip links toggle activate on their targets
	.on('mouseover mouseout tap focusin focusout', 'a[href^="#"], [data-tip]', function(e) {
		var href, node, elem, data, clas, tag;
		
		tag = e.target.tagName.toLowerCase();
		
		// Input fields should only show tips when focused
		if (tag === 'input' && (e.type === 'mouseover' || e.type === 'mouseout' || e.type === 'tap')) {
			return;
		}
		
		href = e.currentTarget.getAttribute('data-tip');
		
		if (href && !(/^#/.test(href))) {
			// The data-tip attribute holds text. Create a tip node and
			// stick it in the DOM
			elem = jQuery('<div/>', {
				'class': 'tip',
				'text': href
			});
			node = elem[0];
			clas = 'tip';
			e.currentTarget.setAttribute('data-tip', '#' + bolt.identify(node));
			document.body.appendChild(node);
		}
		else {
			if (!href) {
				href = e.currentTarget.hash;
			}

			node = document.getElementById(href.substring(1));

			// If there is no node, there's no need to continue. Thanks.
			if (!node) { return; }

			// Get the bolt data that may have been created by a previous
			// activate event.
			data = jQuery.data(node, 'bolt');

			elem = (data && data.elem) || jQuery(node);
		}

		// Decide what class this object is.
		if (!clas) {
			clas = data && data['class'] ?
				data['class'] :
				bolt.classify(node) ;
		}

		if (clas && !data) {
		  jQuery.data(elem[0], 'bolt', { 'class': clas, elem: elem });
		}

		// If it has not the class 'tip', we have no business trying to
		// activate it on hover.
		if (clas !== 'tip' && clas !== 'top_tip') { return; }

		// Tap events should make tips show immediately
		if (e.type === 'tap') {
			elem.css(jQuery.prefix('transition')+'Delay', '0');
		}
		
		elem.trigger(e.type === 'mouseout' || e.type === 'focusout' ?
			{ type: 'deactivate' } :
			{ type: 'activate', relatedTarget: e.currentTarget }) ;
	});
});