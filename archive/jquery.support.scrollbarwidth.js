// Stores browser scrollbar width as jQuery.support.scrollbarWidth
// Only available after document ready
// TODO: Not tested, and probably not working in IE. You may find inspiration here:
// http://github.com/brandonaaron/jquery-getscrollbarwidth/blob/master/jquery.getscrollbarwidth.js

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery) {
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
});