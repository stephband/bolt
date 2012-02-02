// template.ui.js

// Run jQuery without aliasing it to $

jQuery.noConflict();


// Add css support classes to html

(function(jQuery, undefined){
	var support = jQuery.support,
			classes = [];
	
	classes.push('min-height_'+support.css.minHeight);
	classes.push('min-width_'+support.css.minWidth);
	
	jQuery(document.documentElement).addClass(classes.join(' '));
})(jQuery);


// Handle dropdowns, popdowns and tabs

(function( jQuery, undefined ){
	var debug = (window.console && window.console.log),
	    classes = {
	    	'.tab': {
	    		activate: activatePane
	    	},
	    	
	    	'.slide': {
	    		activate: activatePane
	    	},
	    	
	    	'.popdown': {
					activate: function(e) {
	    			// Default is prevented indicates that this link has already
	    			// been handled, possibly by an inner pane.
	    			if (e.isDefaultPrevented()) { return; }
					
						var target = e.currentTarget,
						    elem = jQuery(target);
						
						function mousedown(e) {
							// Ignore mousedowns from all but the left button.
							if (!isLeftButton(e)) { return; }
							
							// If event is in it or on it, do nothing.
							if (target === e.target || jQuery.contains(target, e.target)) { return; }
							
							jQuery(target).trigger({type: 'deactivate', relatedTarget: e.target});
	    			}
	    			
	    			function close(e) {
	    				// A prevented default indicates that this link has already
	    				// been handled, possibly by an inner pane.
	    				if (e.isDefaultPrevented()) { return; }
	    				
	    				elem.trigger({type: 'deactivate', relatedTarget: e.target});
	    			}
	    			
	    			function deactivate(e) {
	    				if (target !== e.target) { return; }
	    				
	    				elem.undelegate('a[href="#close"]', 'click', close);
	    				jQuery.event.remove(document, 'mousedown touchstart', mousedown);
	    				jQuery.event.remove(target, 'deactivate', deactivate);
	    			}
	    			
	    			elem.delegate('a[href="#close"]', 'click', close);
	    			jQuery.event.add(document, 'mousedown touchstart', mousedown);
	    			jQuery.event.add(target, 'deactivate', deactivate);
	    		}
	    	},
	    	
	    	'.dropdown': {
	    		activate: function(e) {
	    			var target = e.currentTarget;
	    			
	    			function mousedown(e) {
							// Ignore mousedowns from all but the left button.
							if (!isLeftButton(e)) { return; }
							
							// If event is in it or on it, do nothing.
							if (target === e.target || jQuery.contains(target, e.target)) { return; }
							
							jQuery(target).trigger({type: 'deactivate', relatedTarget: e.target});
	    			}
	    			
	    			function deactivate(e) {
	    				if (target !== e.target) { return; }
	    			  
	    				jQuery.event.remove(document, 'mousedown touchstart', mousedown);
	    				jQuery.event.remove(target, 'click', click);
	    				jQuery.event.remove(target, 'deactivate', deactivate);
	    			}
	    			
	    			jQuery.event.add(document, 'mousedown touchstart', mousedown);
	    			jQuery.event.add(target, 'click', click);
	    			jQuery.event.add(target, 'deactivate', deactivate);
	    		}
	    	},
	    	
	    	'.popup': {
	    		activate: function(e) {
	    			var target = jQuery(e.currentTarget);
	    			
	    			// Only if activate was triggered on the popup
	    			if (e.currentTarget !== e.target) { return; }
	    			
	    			if (debug) { console.log('activating popup'); }
	    			
	    			jQuery(target.html()).popup(target.data("popup"));
	    			
	    			e.preventDefault();
	    		}
	    	}
	    },

	    selector = Object.keys(classes).join(', ');

	function activate(elem) {
		elem.trigger('activate');
	}

	function deactivate(elem) {
		elem.trigger('deactivate');
	}

	function preventDefault(e) {
		e.preventDefault();
	}

	function activatePane(e) {
	  var pane = jQuery(e.target),
	      data = pane.data('activePane'),
		    selector, panes, l;
	  
		function prev(e) {
			// A prevented default indicates that this link has already
			// been handled, possibly by an inner pane.
			if (e.isDefaultPrevented()) { return; }
			
			var i = panes.index(pane) - 1;
			
			if (i < 0) { i = panes.length - 1; }
			
			panes.eq(i).trigger('activate');
			e.preventDefault();
		}
		
		function next(e) {
			// A prevented default indicates that this link has already
			// been handled, possibly by an inner pane.
			if (e.isDefaultPrevented()) { return; }
			
			var i = panes.index(pane) + 1;
			
			if (i >= panes.length) { i = 0; }
			
			panes.eq(i).trigger('activate');
			e.preventDefault();
		}
		
	  function deactivate(e) {
			if (pane[0] !== e.target) { return; }
			
			pane.undelegate('a[href="#prev"]', 'click', prev);
			pane.undelegate('a[href="#next"]', 'click', next);
			jQuery.event.remove(e.target, 'deactivate', deactivate);
		}
	  
	  if (!data) {
	  	selector = pane.data('selector');
	  	
	  	if (selector) {
	  		panes = jQuery(selector);
	  	}
	  	else {
	  		// Choose all sibling panes of the same class
	  		panes = pane.siblings(pane.hasClass('tab') ? '.tab' : '.slide').add(e.target);
	  	}
	  	
	  	// Attach the panes object to each of the panes
	  	l = panes.length;
	  	while (l--) {
	  		jQuery.data(panes[l], 'activePane', { panes: panes });
	  	}
	  }
	  else {
	  	panes = data.panes;
	  }
	  
	  // Deactivate the last active pane AFTER this pane has been activated.
	  // It's important for panes who's style depends on the current active
	  // pane - such as slides, which have .slide.active ~ .slide {...} rules.
	  var t = setTimeout(function() {
	  	t = null;
	  	panes.not(e.target).trigger('deactivate');
	  }, 0);
	  
	  pane.delegate('a[href="#prev"]', 'click', prev);
	  pane.delegate('a[href="#next"]', 'click', next);
	  jQuery.event.add(pane[0], 'deactivate', deactivate);
	}
	
	function activateTip(e) {
		var target = jQuery(e.currentTarget),
		    relatedTarget = jQuery(e.relatedTarget);
		
		target.css(relatedTarget.offset());
		
		jQuery.event.add(document, 'tap', function tap() {
			jQuery.event.remove(document, 'tap', tap);
			target.trigger('deactivate');
		});
	}
	
	function click(e) {
		var target = e.currentTarget;
		
		// If we've clicked on a file input inside it, wait
		// for the input to change. This is a fix for file
		// inputs not firing change events when they're made
		// invisible. Deserves further investigation.
		if (e.target.nodeName.toLowerCase() === 'input' && document.getAttribute('type') === 'file') {
			jQuery.event.add(e.target, 'change', function(e){
				jQuery(target).trigger('deactivate');
			});
			
			return;
		}
		
		jQuery(e.currentTarget).trigger('deactivate');
	}
	
	
	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.type === 'mousedown' && e.which === 1 && !e.ctrlKey && !e.altKey);
	}
	
	
	var loc = window.location.href.replace(/#.*/, '');
	
	jQuery(document)
	
	// Mousedown on buttons toggle activate on their targets
	.delegate('a[href^="#"]', 'mousedown touchstart', function(e) {
		var link, href, elem, data, type, t;
		
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (!isLeftButton(e)) { return; }
		
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.isDefaultPrevented()) { return; }
		
		link = jQuery(e.currentTarget);
		href = link.attr('href');
		
		// IE has a habit of reporting the entire URL even when the link
		// contains just a relative hash ref. Strip the rest of the URL.
		href = href.replace(loc, '');
		
		elem = jQuery(href);
		
		if (elem.length === 0) { return; }
		
		// Get the active data that may have been created by a previous
		// activate event.
		data = jQuery.data(elem[0], 'active');
		
		// Decide what type this object is.
		if (data && data.type) {
			// Check if this type is in classes - if not, we don't want to
			// be activating it on mousedown.
			type = data.type;
		}
		else {
			for (t in classes) {
				if (elem.is(t)) {
					type = t;
					break;
				}
			}
		}
		
		// If it has no type, we have no business trying to activate
		// it on mousedown.
		if (!type) { return; }
		
		e.preventDefault();
		
		link.unbind('click', preventDefault);
		link.bind('click', preventDefault);
		
		if (!classes[type]) { return; }
		
		if ((data && data.state) || (!data && elem.hasClass('active'))) {
			// Element is already active. Do nothing.
		}
		else {
			if (!data) {
				jQuery.data(elem[0], 'active', { type: type, elem: elem });
			}
			
			elem.trigger({ type: 'activate', relatedTarget: e.currentTarget });
		}
	})

	// Mouseover on links toggle activate on their targets
	.delegate('a[href^="#"], [data-tip]', 'mouseover mouseout tap', function(e) {
		var href, node, elem, data, type, t;
		
		href = e.currentTarget.getAttribute('data-tip');
		
		if (href) {
			if (!(/^#/.test(href))) {
				//console.log('This tip does not reference an id. It must be text. Template doesn\'t support this yet. It says:', href);
			}
		}
		else {
			href = e.currentTarget.getAttribute('href');
			
			// IE has a habit of reporting the entire URL even when the link
			// contains just a relative hash ref. Strip the rest of the URL.
			href = href.replace(loc, '');
		}
		
		node = document.getElementById(href.replace(/^#/, ''));
		
		// If there is no node, there's no need to continue. Thanks.
		if (!node) { return; }
		
		elem = jQuery(node);
		
		// Get the active data that may have been created by a previous
		// activate event.
		data = jQuery.data(elem[0], 'active');
		
		type = (data && data.type) || (elem.is('.tip') ? '.tip' : undefined);
		
		// If it has not type tip, we have no business trying to activate
		// it on hover.
		if (type !== '.tip') { return; }
		
		if (!data) {
		  jQuery.data(elem[0], 'active', { type: type, elem: elem });
		}
		
		if (e.type === 'tap') {
			elem.css(jQuery.prefix('transition')+'Delay', '0ms');
		}
		
		elem.trigger(e.type === 'mouseout' ? 'deactivate' : { type: 'activate', relatedTarget: e.currentTarget });
	})
	.delegate('.tip', 'activate', activateTip)
	.delegate('.tab', 'activate', classes['.tab'].activate)
	.delegate('.slide', 'activate', classes['.slide'].activate)
	.delegate('.popup', 'activate', classes['.popup'].activate)
	.delegate('.popdown', 'activate', classes['.popdown'].activate)
	.delegate('.dropdown', 'activate', classes['.dropdown'].activate);
	
	jQuery.isPrimaryButton = isLeftButton;
})(jQuery);


// Define event handlers

(function(jQuery, undefined){

	function prepareDragData(e){
		var elem = jQuery( e.target ),
		    data = elem.data('mimetypes'),
		    mimetype;
	
		if (!data) { return; }
	
		for (mimetype in data){
			ddd('[drag data] mimetype:', mimetype, 'data:', data[mimetype]);
			e.originalEvent.dataTransfer.setData(mimetype, JSON.stringify(data[mimetype]));
		}
	};
	
	function prepareDragFeedback(e){
		var elem = jQuery( e.target ),
		    data = elem.data('feedback'),
		    offset, dragOffset;

		if (data && data.node){
			ddd('[drag feedback] node:', data.node);
			jQuery(document.body).append(data.node);
			e.originalEvent.dataTransfer.setDragImage(data.node, data.width || 32, data.height || 32);
		}
		else {
			offset = elem.offset();
			dragOffset = {
				offsetX: e.pageX - offset.left,
				offsetY: e.pageY - offset.top
			};

			ddd('[drag feedback] offset:', dragOffset);
			e.originalEvent.dataTransfer.setDragImage( e.target, dragOffset.left, dragOffset.top );
			e.originalEvent.dataTransfer.setData( 'webdoc/offset', JSON.stringify(dragOffset) );
		}
	};
	
})(jQuery);