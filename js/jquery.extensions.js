// Extensions to jQuery
//
// Stephen Band
//
// Feature detection, and helper methods for jQuery and jQuery.fn


// Properties of native event objects to copy over to the jQuery
// event object.

// For dragstart

jQuery.event.props.push("dataTransfer");

// For the events touchstart, touchend, touchmove, touchenter,
// touchleave, and touchcancel.

jQuery.event.props.push("timestamp", "radiusX", "radiusY", "rotationAngle", "force", "touches", "targetTouches", "changedTouches");


// Detect whether different types of html5 form elements have native UI implemented
// and store boolean in jQuery.support.inputTypes[type]. For now, types not used in
// webdoc are commented out.
// You may find inspiration at Mike Taylor's site, here:
// http://www.miketaylr.com/code/html5-forms-ui-support.html

(function(jQuery, undefined){
    var types = jQuery.support.inputTypes = {
          //datetime: false,
          //date: false,
          //month: false,
          //week: false,
          time: false,
          //'datetime-local': false,
          number: false,
          range: false
        };
    
    var testValue = '::',
        input, type;
    
    // Loop over types
    for (type in types) {
      // Set the input type, then check to see if it still behaves like a text
      // input, or if the type is still that to which it was set.
      input = document.createElement('input');
      input.setAttribute('type', type);
      input.setAttribute('value', testValue);
      
      types[type] = input.value !== testValue || input.type === type;
    }
    
    // Detect support for the input placeholder attribute.
    jQuery.support.placeholder = 'placeholder' in input;
    
})(jQuery);


jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};


// Detect css3 features and store in jQuery.support.css

(function(jQuery, undefined){
  
  var debug = (window.console && console.log);
  
  var docElem = document.documentElement,
      testElem = jQuery('<div/>').css({
        WebkitBoxSizing: 'border-box',
        MozBoxSizing: 'border-box',
        /* Opera accepts the standard box-sizing */
        boxSizing: 'border-box',
        position: 'absolute',
        top: -200,
        left: 0,
        padding: 20,
        border: '10px solid red',
        width: 100,
        height: 100
      }),
      timer;
  
  jQuery.support.css = {};
  
  //jQuery(document).ready(function(){
    // Test for box-sizing support and figure out whether
    // min-width or min-height fucks it or not.  Store in:
    // jQuery.support.css.borderBox
    // jQuery.support.css.borderBoxMinMax
    document.body.appendChild( testElem[0] );
    
    /* Legacy */
    jQuery.support.css.borderBox = (testElem.outerWidth() === 100 && testElem.outerHeight() === 100);
    
    /* New */
    jQuery.support.css.boxSizing = (testElem.outerWidth() === 100 && testElem.outerHeight() === 100) ? 'border-box' : 'content-box';
    
    testElem.css({
      height: 'auto',
      width: 'auto',
      minWidth: 100,
      minHeight: 100
    });
    
    jQuery.support.css.minWidth = testElem.outerWidth() === 100 ? 'border-box' : 'content-box' ;
    jQuery.support.css.minHeight = testElem.outerHeight() === 100 ? 'border-box' : 'content-box' ;
    
    testElem.remove();
  //});
})(jQuery);

// Stores browser scrollbar width as jQuery.support.scrollbarWidth
// Only available after document ready
// TODO: Not tested, and probably not working in IE. You may find inspiration here:
// http://github.com/brandonaaron/jquery-getscrollbarwidth/blob/master/jquery.getscrollbarwidth.js

(function(jQuery) {
    var scrollbarWidth,
        elem = jQuery('<div/>'),
        testElem = jQuery('<div/>'),
        css = {
            position: 'absolute',
            width: 100,
            height: 100,
            overflow: 'auto'
        },
        cssTest = {
            height: 200
        };
    
    testElem
    .css(cssTest);
    
    elem
    .css(css)
    .append(testElem);
    
    // We can only interrogate the div once the document is ready
    jQuery(document).ready(function(){
      // Stick test into the DOM
      document.body.appendChild( elem[0] );
      
      // Find out how wide the scrollbar is
      scrollbarWidth = 100 - testElem.width();
      
      // Add result to jQuery.support
      jQuery.support.scrollbarWidth = scrollbarWidth;
      
      // Destroy test nodes
      document.body.removeChild( elem[0] );
      elem = testElem = elem[0] = testElem[0] = null;
    });
})(jQuery);


// Stores gap at bottom of textarea as jQuery.support.textareaMarginBottom
// Textareas have a gap at the bottom that is not controllable by CSS, and it's different
// in every browser. This plugin tests for that pseudo-margin.

/*(function(jQuery){
    var test = jQuery('<div style="position: absolute; top: -400px;"><textarea style="margin:0; padding:0; border: none; height: 20px;"></textarea></div>').appendTo('body'),
        textareaGap;
    
    jQuery(function(){
        // Stick test into the DOM
        test.appendTo('body');
        
        // Find out how big the gap is
        textareaGap = test.height() - test.children('textarea').height();
        
        // Add result to jQuery.support
        jQuery.support.textareaMarginBottom = textareaGap;
        
        // Destroy test
        test.remove();
    });
})(jQuery);*/


// Extend jQuery with some helper methods

(function(jQuery, undefined) {
  
  var debug = (window.console && console.log),
      urlKeys = ("absolute protocol authority userInfo user password host port relative path directory file query anchor").split(" ");
  
  jQuery.extend({
    
    // Event delegation helper. Bind to event, passing in
    // {'selector': fn} pairs as data. Finds closest match
    // (caching the result in the clicked element's data),
    // and triggers the associated function(s) with the matched
    // node as scope. Returns the result of the last function.
    // 
    // Eg:
    // .bind('click', jQuery.delegate({'selector': fn}))
    
    delegate: function(list, context){
      return function(e){
        var target = jQuery(e.target),
            data = target.data("closest") || {},
            closest, node, result, selector;
        
        for (selector in list) {
          node = data[selector];
          
          if ( node === undefined ) {
              closest = target.closest( selector, this );
              node = data[selector] = ( closest.length ) ? closest[0] : false ;
              target.data("closest", data);
          }
          
          if ( node ) { 
            if (debug) { console.log('[jQuery.delegate] Matched selector: "' + selector + '"'); }
            e.delegateTarget = node;
            result = list[selector].call( context || node, e );
          }
        }
        
        return result;
      };
    },
    
    // Some helpful regex for parsing hrefs and css urls etc.
    
    regex: {
      integer:    /^-?[0-9]+$/,                                   // integer
      hash:       /^#?$/,                                         // Single hash or empty string
      hashRef:    /^#(\S+)/,                                      // Matches a hash ref, captures all non-space characters following the hash
      slashRef:   /^\//,                                          // Begins with a slash
      urlRef:     /^[a-z]+:\/\//,                                 // Begins with protocol xxx://
      urlParser:  /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      
      image:      /\S+(\.png|\.jpeg|\.jpg|\.gif)$/,               // matches strings with image extensions
      
      cssUrl:     /url\([\'\"]?([\-:_\.\/a-zA-Z0-9]+)[\'\"]?\)/,   // matches url(xxx), url('xxx') or url("xxx") and captures xxx
      cssRotate:  /rotate\(\s?([\.0-9]+)\s?deg\s?\)/,             // matches rotate( xxxdeg ) and captures xxx
      cssValue:   /^(\d+)\s?(px|%|em|ex|pt|in|cm|mm|pt|pc)$/,     // Accepts any valid unit of css measurement, encapsulates the digits [1] and the units [2]
      pxValue:    /^(\d+)\s?(px)$/,                               // Accepts px values, encapsulates the digits [1]
      '%Value':   /^(\d+)\s?(%)$/,                                // Accepts % values, encapsulates the digits [1]
      emValue:    /^(\d+)\s?(em)$/,                               // Accepts em values, encapsulates the digits [1]
      hslColor:   /^(?:hsl\()?\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})%\s?,\s?([0-9]{1,3})%\s?\)?$/,   // hsl(xx, xx%, xx%)
      hexColor:   /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}$)/,          // #xxxxxx
      rgbColor:   /^(?:rgb\()?\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})\s?\)?$/  // rgb(xxx, xxx, xxx)  - not perfect yet, as it allows values greater than 255
    },
    
    // Stores objects against their selectors to help minimise
    // DOM calls. Don't use when DOM nodes change.
    
    store: function( selector ) {
      var store = this.store,
          obj = store[selector];
      
      if ( !obj ) { obj = store[selector] = jQuery(selector); }
      
      return obj;
    },
    
    // Parses url into an object with values. Bits and pieces 
    // borrowed from Steven Levithan here:
    // http://blog.stevenlevithan.com/archives/parseuri
    
    parseURL: function( url ){
      
      var str = decodeURI( url ),
          parsed = jQuery.regex.urlParser.exec( str ),
          obj = {},
          queries = {},
          l = urlKeys.length;
      
      while (l--) {
        obj[ urlKeys[l] ] = parsed[l];
      }
      
      if (obj.query){
        obj.query.replace( /(?:(([^:@]*)(?::([^:@]*))?)?@)?/g, function ( rien, key, value ) {
          if (key) {
            queries[key] = value;
          }
        });
        
        delete obj.query;
        obj.queries = queries;
      }
      
      return obj;
    }
  });
})(jQuery);


// jQuery.cookie
// 
// https://github.com/carhartl/jquery-cookie
// 
// Klaus Hartl - klaus.hartl@stilbuero.de
// 
// Copyright (c) 2006 Klaus Hartl (stilbuero.de)
// Dual licensed under the MIT and GPL licenses:
// http://www.opensource.org/licenses/mit-license.php
// http://www.gnu.org/licenses/gpl.html
//
// Set a cookie:
// 
// jQuery.cookie(name, value, options);
// 
// Get a cookie:
// 
// jQuery.cookie(name);
// 
// Options:
// 
// expires:     Either an integer specifying the expiration date from now on in days or a Date object.
//              If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
//              If set to null or omitted, the cookie will be a session cookie and will not be retained
//              when the the browser exits.
// path:        The value of the path atribute of the cookie (default: path of page that created the cookie).
// domain:      The value of the domain attribute of the cookie (default: domain of page that created the cookie).
// secure:      If true, the secure attribute of the cookie will be set and the cookie transmission will
//              require a secure protocol (like HTTPS).

jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};


// Extend jQuery plugins with some helper plugins

jQuery.fn.extend({
    
    // Attribute helpers
    
    id: function(id) {
        return this.attr("id", id) ;
    },
    
    href: function(href) {
        return this.attr("href", href) ;
    }
});


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
			var link = jQuery(this),
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
	};
	
	
	// Create a drop handler that calls a function from a key:fn
	// map based on the dropped object's mimetype(s).
	//
	// obj     Object   - A key:value map of attribute handler functions
	// context Object   - Context used as this for calling the callback
	// returns Function - The actual event handler
	
	function handleMimetype(obj, context) {
		// Curry handler using this scope
		return function(e){
			
			// This block is just for logging, so we can see some
			// data. IE does not have the property dataTransfer.types
			// so we can't tell what mimetypes are being carried in IE.
			if (debug && e.originalEvent.dataTransfer.types) {

				var types = e.originalEvent.dataTransfer.types,
						l = types.length,
						dataObj;

				var target = jQuery(e.target),
						currentTarget = jQuery(e.currentTarget);

				console.group('[Handler] handleMimeType');

				// Log available mimetypes
				while (l--) {
					dataObj = e.originalEvent.dataTransfer.getData(types[l]);
					ddd(types[l], 'data:', dataObj );
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
	};
	
	// Extend jQuery.event with helpful handler functions
	
	jQuery.event.handleAttribute = handleAttribute;
	jQuery.event.handleMimetype = handleMimetype;
})(jQuery);


// Render {{variables}} in strings or in regexp, like this:
// 
// jQuery.render(template, object)
// 
// where template is a string 'hello {{name}}' or regex
// /^name:\s({{name}})/ and object is a list of values with
// keys that match the template variables { name: 'George' }.

jQuery.render = (function(){
  function replaceStringFn(obj) {
  	return function($0, $1) {
  		// $1 is the template key.
  		return obj[$1];
  	}
  }
  
  function replaceRegexFn(obj) {
  	return function($0, $1, $2) {
  		// $1 is the template key in {{key}}, while $2 exists where
  		// the template tag is followed by a repetition operator.
  		var r = obj[$1];
  		
  		if (!r) { throw("Exception: attempting to build RegExp but obj['"+$1+"'] is undefined."); }
  		
  		// Strip out beginning and end matchers
  		r = r.source.replace(/^\^|\$$/g, '');
  		
  		// Return a non-capturing group when $2 exists, or just the source.
  		return $2 ? ['(?:', r, ')', $2].join('') : r ;
  	}
  }
  
  return function(template, obj) {
  	return (template instanceof RegExp) ?
  		RegExp(
  			template.source.replace(/\{\{(\w+)\}\}(\{\d|\?|\*|\+)?/g, replaceRegexFn(obj)),
  			(template.global ? 'g' : '') +
  			(template.ignoreCase ? 'i' : '') +
  			(template.multiline ? 'm' : '')
  		) :
  		string.replace(/\{\{(\w+)\}\}/g, replaceStringFn);
  };
})();