// Extend jQuery with some helper methods

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined) {
  jQuery.extend({
    // Some helpful regex for parsing hrefs and css urls etc.
    regex: {
      integer:    /^-?[0-9]+$/,                                   // integer
      hash:       /^#?$/,                                         // Single hash or empty string
      hashRef:    /^#(\S+)/,                                      // Matches a hash ref, captures all non-space characters following the hash
      slashRef:   /^\//,                                          // Begins with a slash
      urlRef:     /^[a-z]+:\/\//,                                 // Begins with protocol xxx://
      urlParser:  /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      
      image:      /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/,               // matches strings with image extensions
      
      cssUrl:     /url\([\'\"]?([\-:_\.\/a-zA-Z0-9]+)[\'\"]?\)/,   // matches url(xxx), url('xxx') or url("xxx") and captures xxx
      cssRotate:  /rotate\(\s?([\.0-9]+)\s?deg\s?\)/,             // matches rotate( xxxdeg ) and captures xxx
      cssValue:   /^(\d+)\s?(px|%|em|ex|pt|in|cm|mm|pt|pc)$/,     // Accepts any valid unit of css measurement, encapsulates the digits [1] and the units [2]
      pxValue:    /^(\d+)\s?(px)$/,                               // Accepts px values, encapsulates the digits [1]
      '%Value':   /^(\d+)\s?(%)$/,                                // Accepts % values, encapsulates the digits [1]
      emValue:    /^(\d+)\s?(em)$/,                               // Accepts em values, encapsulates the digits [1]
      hslColor:   /^(?:hsl\()?\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})%\s?,\s?([0-9]{1,3})%\s?\)?$/,   // hsl(xx, xx%, xx%)
      hexColor:   /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}$)/,          // #xxxxxx
      rgbColor:   /^(?:rgb\()?\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})\s?,\s?([0-9]{1,3})\s?\)?$/  // rgb(xxx, xxx, xxx)  - not perfect yet, as it allows values greater than 255
    }
  });
});