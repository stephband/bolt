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
	"use strict";

	var debug = window.console && console.log;

	var doc = jQuery(document),
	    docElem = jQuery(document.documentElement),
	    
	    add = jQuery.event.add,
	    remove = jQuery.event.remove,
	    trigger = function(node, type, data) {
	        jQuery.event.trigger(type, data, node);
	    },
	    
	    rImage = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/,
	    rYouTube = /youtube\.com/,

	    nodeCache = {},

	    targets = {
	    	dialog: function(e) {
	    		var href = e.currentTarget.getAttribute('data-href') || e.currentTarget.hash || e.currentTarget.href;
	    		var id = href.substring(1);
	    		var node, parts, item;

	    		if (!id) { return loadResource(e, href); }

	    		if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
	    			id = parts[1];
	    		}

	    		node = nodeCache[id] || document.getElementById(id);

	    		if (!node) { return loadResource(e, href); }

	    		e.preventDefault();

	    		// If the node is html hidden inside a text/html script tag,
	    		// extract the html.
	    		if (node.getAttribute && node.getAttribute('type') === 'text/html') {
	    			// TODO: jQuery 1.9.1 and 2.0.0b2 are failing because html
	    			// needs to be whitespace trimmed.
	    			node = jQuery(node).html();
	    		}

	    		// If it's a template...
	    		if (node.tagName && node.tagName.toLowerCase() === 'template') {
	    			// If it is not inert (like in IE), remove it from the DOM to
	    			// stop ids in it clashing with ids in the rendered result.
	    			if (!node.content) { jQuery(node).remove(); }
	    			node = nodeCache[id] = jQuery(node).html();
	    		}

	    		jQuery(node).dialog('lightbox');
	    		
	    		if (parts) {
	    			item = jQuery('#' + parts[2]);

	    			item
	    			.addClass('notransition')
	    			.trigger('activate')
	    			.width();

	    			item
	    			.removeClass('notransition');
	    		}
	    	}
	    };
	
	function loadResource(e, href) {
		var link = e.currentTarget,
		    path = link.pathname,
		    node, elem, dialog;
		
		if (rImage.test(link.pathname)) {
			e.preventDefault();
			
			node = new Image();
			elem = jQuery(node);

			elem.dialog('lightbox');
			
			dialog = elem.parent();
			
			if (dialog.addLoadingIcon) {
				dialog.addLoadingIcon();
				
				elem.on('load', function() {
					dialog.removeLoadingIcon();
				});
			}

			node.src = href;

			return;
		}

		if (rYouTube.test(link.hostname)) {
			e.preventDefault();
			
			// We don't need a loading indicator because youtube comes with
			// it's own.
			elem = jQuery('<iframe class="youtube_iframe" width="560" height="315" src="' + href + '" frameborder="0" allowfullscreen></iframe>');
			node = elem[0];

			elem.dialog('lightbox');

			return;
		}
	}
	
	function prefixSlash(str) {
		return (/^\//.test(str) ? '' : '/') + str ;
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

		// IE does not give us a .hostname for links to xxx.xxx.xxx.xxx URLs.
		if (!link.hostname) { return false; }

		// IE gives us the port on link.host, even where it is not specified.
		// Use link.hostname.
		if (location.hostname !== link.hostname) { return true; }
		
		// IE gives us link.pathname without a leading slash, so add
		// one before comparing.
		if (location.pathname !== prefixSlash(link.pathname)) { return true; }
	}
	
	function boltData(node) {
		// Get the bolt data that may have been created by a previous
		// activate event.
		var data = jQuery.data(node);
		var elem, clas;

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

		return data;
	}

	function activate(e, node, data) {
		e.preventDefault();

		if (e.type === 'mousedown') {
			preventClick(e);
		}

		if (!bolt.has(data.bolt['class'], 'activate')) { return; }

		if (data.active === undefined ?
				data.bolt.elem.hasClass('active') :
				data.active ) {
			return;
		}
	
		trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
	}

	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			add(e.currentTarget, 'click', preventDefault);
		}
	}

	function close(e) {
		var activeTarget = e.data;

		// A prevented default means this link has already been handled.
		if (e.isDefaultPrevented()) { return; }
	
		if (e.type === 'mousedown' && !isLeftButton(e)) { return; }
		
		trigger(activeTarget, {type: 'deactivate', relatedTarget: e.target});
		e.preventDefault();
		preventClick(e);
	}

	function activateHref(e, fn) {
		var id, node, name, data, elem, clas;

		if (isIgnorable(e)) { return; }

		id = e.currentTarget.getAttribute('data-href').substring(1);
		node = document.getElementById(id);
		
		// This link does not point to an id in the DOM. No action required.
		if (!node) { return; }

		data = boltData(node);

		if (!data) { return; }
		
		//if (!bolt.has(clas, 'activate')) { return; }

		fn(node, data);
	}

	function activateHash(e, fn) {
		var id, node, data;

		if (isIgnorable(e)) { return; }

		if (isExternalLink(e)) { return; }

		id = e.currentTarget.hash.substring(1);
		node = document.getElementById(id);

		// This link does not point to an id in the DOM. No action required.
		if (!node) { return; }

		data = boltData(node);

		if (!data) { return; }

		fn(e, node, data);
	}

	function activateTarget(e) {
		var target = e.currentTarget.target;

		if (isIgnorable(e)) { return; }

		// If the target is not listed, ignore
		if (!targets[target]) { return; }
		
		if (e.type === 'mousedown') { preventClick(e); }
		
		return targets[target](e);
	}

	function changeHref(e) {
		activateHref(e, function(node, data) {
			if (e.target.checked) {
				trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
			}
			else {
				trigger(node, { type: 'deactivate', relatedTarget: e.currentTarget });
			}	
		});
	}

	function mousedownHref(e) {
		// We have change handlers to listen to inputs
		if (e.target.tagName.toLowerCase() === 'input') { return; }

		activateHref(e, function(node, data) {
			e.preventDefault();
			
			if (e.type === 'mousedown') {
				preventClick(e);
			}
	
			//if (!bolt.has(clas, 'activate')) { return; }
	
			if (data.active === undefined ?
					data.bolt.elem.hasClass('active') :
					data.active ) {
				return;
			}
	
			trigger(node, { type: 'activate', relatedTarget: e.currentTarget });
		});
	}

	function mousedownHash(e) {
		activateHash(e, activate);
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
	
	// Clicks on close buttons deactivate the thing they are inside
	.on('click tap', '.close-thumb, .close_button, .cancel_button', function(e) {
		var elem = jQuery(e.currentTarget).closest('.popdown, .dialog-layer');
		
		if (!elem.length) { return; }
		
		elem.trigger({
			type: 'deactivate',
			relatedTarget: e.currentTarget
		});
		
		e.preventDefault();
	})

	// Mousedown on buttons toggle activate on their targets
	.on('mousedown tap keydown', 'a[target]', activateTarget)

	// Changing input[data-href] controls target
	.on('change valuechange', '[data-href]', changeHref)

	// Mousedown on buttons toggle activate on their hrefs
	.on('mousedown tap keydown', '[data-href]', mousedownHref)

	// Mousedown on buttons toggle activate on their hash
	.on('mousedown tap keydown', 'a[href]', mousedownHash)

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