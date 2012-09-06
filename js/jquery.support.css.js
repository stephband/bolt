// Detect css3 features and store in jQuery.support.css

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
  
  var debug = (window.console && console.log);
  
  var testElem = jQuery('<div/>').css({
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
      });
  
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
});