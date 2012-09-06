// jQuery.prefix(property)
// 
// Returns prefixed CSS property, or unprefixed property, as
// supported by the browser.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
  var prefixes = ['Khtml','O','Moz','Webkit','ms'],
      elem = document.createElement('div'),
      cache = {};
  
  function testPrefix(prop) {
    var upper, prefixProp, l;
    
    if (prop in elem.style) { return prop; }
    
    upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    l = prefixes.length;
    
    while (l--) {
      prefixProp = prefixes[l] + upper;
      
      if (prefixProp in elem.style) {
        return prefixProp;
      }
    }
    
    return false;
  }
  
  function prefix(prop){
    return cache[prop] || (cache[prop] = testPrefix(prop));
  }
  
  jQuery.prefix = prefix;
});