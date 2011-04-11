// Extensions to jQuery
//
// Stephen Band
//
// Feature detection, and helper methods for jQuery and jQuery.fn

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
        height: 100,
      }),
      timer;
  
  jQuery.support.css = {};
  
  jQuery(document).ready(function(){
    // Test for box-sizing support and figure out whether
    // min-width or min-height fucks it or not.  Store in:
    // jQuery.support.css.borderBox
    // jQuery.support.css.borderBoxMinMax
    document.body.appendChild( testElem[0] );
    
    jQuery.support.css.borderBox = ( testElem.outerWidth() === 100 && testElem.outerHeight() === 100 );
    
    testElem.css({
      minWidth: 100,
      minHeight: 100
    });
    
    jQuery.support.css.borderBoxMinMax = ( testElem.outerWidth() === 100 && testElem.outerHeight() === 100 );
    
    testElem.remove();
  });
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
    },
    
    // Translates text to html and vice versa. Used when taking input
    // from a textarea and putting it in a dom node as html.
    
    textToHTML: function( text ){
      var dtc = /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi,
          regexLink = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi,
          html = text.replace( /\&/g, '&amp;' ).replace(/<3/g,"♥").replace( /</g, '&lt;' ).replace(dtc,'<a href="$1" target="_blank">$1</a>').replace( /\n/g, '<br/>' );
      
      return html;
    },
    
    HTMLToText: function( html ){
      var text = html.replace( /<br\/>/g, '\n' ).replace( /\&amp\;/g, '&' ).replace( /\&lt\;/g, '<' );
      return text;
    }
    
  });
})(jQuery);

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



// Some degugging help. jQuery methods that can be
// used in the console to easily show bound events
// and the like.

(function(jQuery, undefined){
  
  var action = {
    'events': function(){
      // Log data('events') of this and all parent nodes,
      // starting from the inside going out.
      var collection = this.add( this.parents() ),
          l = collection.length, node, elem, key;
      
      while (l--) {
        elem = collection.eq(l);
        node = elem[0];
        
        if ( elem.data('events') ){
          console.log( collection.length-l, node );
          console.log( elem.data('events') );
          for ( key in elem.data('events') ){
            console.log(key, '('+elem.data('events')[key].length+')');
          }
        }
      }
      
      elem = jQuery(document);
      node = document;
      
      if ( elem.data('events') ){
        console.log( collection.length-l, node );
        console.log( elem.data('events') );
        for ( key in elem.data('events') ){
          console.log(key, '('+elem.data('events')[key].length+')' );
        }
      }
    }
  };
  
  function logNode( node ){
    return node.tagName ?
        node.tagName.toLowerCase() +
        (node.id ? ' #'+node.id : '') +
        (node.className && typeof node.className === 'string' ? ' .' + jQuery.trim( node.className ).split(' ').join(' .') : '') :
      node === window ?
        'window' :
      node === document ?
        'document' :
        'impossible';
  }
  
  jQuery.fn.debug = function(str){
    console.log('[Debug '+this.length+' element' + ( this.length > 1 ? 's' : '' ) + ']');
    action[str].call(this);
    return;
  };
  
})(jQuery);


// TODO: Review the useful bits of the following...

///**
// * eventHandler provide function to handle events
// * @namespace
// */
//WebDoc.eventHandler = {
//  /**
//   * This function is a helper to define multiple event handler with a kind of configuration file (the handleConfig parameter)
//   * Add event handler based on handlerConfig parameter. You can add as many event handler you want.
//   * @param handlerConfig. Definition of event handlers. config has the following structure
//   * <pre class="code">
//   *   {
//   *     'selector to bind on': {
//   *       'event type': function,                 // direct bind
//   *       'event_type': {                         // delegation
//   *         'selector to delegate on': function
//   *       }
//   *     }
//   *   }
//   * </pre>
//   */
//  add: function(handlerConfig){
//    var selector, elem, events, event, handler, deleSelector, deleHandler;
//
//    // Loop through handlers and bind them to their selectors
//    for ( selector in handlerConfig ){
//      elem = jQuery( selector === 'document' ? document : selector );
//      events = handlerConfig[selector];
//
//      for ( event in events ){
//        handler = events[event];
//
//        // Either bind the handler...
//        if ( typeof handler === 'function' ){
//          elem.bind( event, events[event] );
//        }
//        // ...or delegate the list of handlers
//        else {
//          for ( deleSelector in handler ){
//            deleHandler = handler[deleSelector];
//            elem.delegate( deleSelector, event, deleHandler );
//          }
//        }
//      }
//    }
//  },
//
//  /**
//   * function that can be used for dragstart event. This function automatically fills the clipboard based on
//   * data-mimetypes attribute.
//   * @param e the dragstart event object
//   */
//  prepareDragData: function(e){
//    var elem = jQuery( e.target ),
//        data = elem.data('mimetypes'),
//        mimetype;
//
//    if ( !data ) { return; }
//
//    for (mimetype in data){
//      ddd('[drag data] mimetype:', mimetype, 'data:', data[mimetype]);
//      e.originalEvent.dataTransfer.setData( mimetype, JSON.stringify( data[mimetype] ) );
//    }
//
//    //look if it's a system app, and store the app name in data app_name
//    if(elem.attr('href') === '#insert-system-app'){
//      e.originalEvent.dataTransfer.setData( 'app-name', JSON.stringify( elem.data('app-name') ) );
//    }
//  },
//
//  /**
//   * function that automatically set drag feedback based on data-feedback attribute.
//   * @param e the dragstart event object
//   */
//  prepareDragFeedback: function(e){
//    var elem = jQuery( e.target ),
//      data = elem.data('feedback'),
//      offset, dragOffset;
//
//    if ( data && data.node ){
//      ddd('[drag feedback] node:', data.node);
//      jQuery( document.body ).append( data.node );
//      e.originalEvent.dataTransfer.setDragImage( data.node, data.width || 32, data.height || 32 );
//    }
//    else {
//      offset = elem.offset();
//      dragOffset = {
//        offsetX: e.pageX - offset.left,
//        offsetY: e.pageY - offset.top
//      };
//
//      ddd('[drag feedback] offset:', dragOffset);
//      e.originalEvent.dataTransfer.setDragImage( e.target, dragOffset.left, dragOffset.top );
//      e.originalEvent.dataTransfer.setData( 'webdoc/offset', JSON.stringify(dragOffset) );
//    }
//  },
//
//  /**
//   * Create a handle function that handle an attribute of the target that trigger the event
//   * @param attr {String} attribute to check
//   * @param obj {Object} A Hash that map value to check in the attribute and function to execute.
//   * @param context {Object} context object that will be used for calling the callback
//   * @return {Function} a function that will handle event based on attribute.
//   */
//  handleAttribute: function( attr, obj, context ){
//    // Curry link handler using this scope
//    return function(e){
//      var link = jQuery(this),
//          match = link.attr( attr );
//
//      // If the attribute matches an obj key
//      if ( match && obj[match] ) {
//        ddd( '[Handler] ' + attr + '="' + match + '"' );
//
//        // Don't do anything browsery
//        e.preventDefault();
//
//        // Call it with link as scope
//        return obj[match].call( context || this, e );
//      }
//    };
//  },
//  
////  /**
////   * Create a handler function that handles the data of the current target.
////   * @param obj {Object} A hash that map value to check in the attribute and function to execute.
////   * @param context {Object} context object that will be used for calling the callback
////   * @return {Function} a function that will handle event based on attribute.
////   */
////  handleData: function( obj, context ){
////    // Curry handler using this scope
////    return function(e){
////      var currentTarget = jQuery(this),
////          data = currentTarget.data(),
////          key, result;
////      
////      if (!data) { return; }
////      
////      for (key in data) {
////        if ( obj[key] ){
////          console.log( '[handleData]', key, data[key] );
////          
////          // Don't do anything browsery
////          e.preventDefault();
////          
////          // Call it with link as scope
////          result = obj[key].call( context || this, e );
////        }
////      }
////      
////      // Return the last matched function's return value
////      // or undefined.
////      return result;
////    };
////  },
//
//  /**
//   * Create a handle function that can manage drop event
//   * @param obj {Object} A hash that map mimetype to an action to perform on drop of this mimetype
//   * @param context {Object context to use when calling the callback}
//   * TODO move this outside the common framework
//   */
//  handleMimeType: function( obj, context ){
//    // Curry handler using this scope
//    return function(e, item_uuid){
//      
//      WebDoc.application.boardController.unselectAll();
//      // This block is just for logging, so we can see some
//      // data. IE does not have the property dataTransfer.types
//      // so we can't tell what mimetypes are being carried in IE.
//      if (window.console && console.log && e.originalEvent.dataTransfer.types) {
//
//        var types = e.originalEvent.dataTransfer.types,
//            l = types.length,
//            dataObj;
//
//        var target = jQuery(e.target),
//            currentTarget = jQuery(e.currentTarget),
//            viewAtPoint = WebDoc.application.boardController.getViewAtPoint(e).view;
//
//
//        ggg('[Handler] handleMimeType');
//
//        // Log available mimetypes
//        while (l--) {
//          dataObj = e.originalEvent.dataTransfer.getData(types[l]);
//          ddd(types[l], 'data:', dataObj );
//        }
//      }
//      if(!item_uuid && viewAtPoint && viewAtPoint.getWidgetApiObject && viewAtPoint.getWidgetApiObject()){
//        item_uuid = viewAtPoint.getWidgetApiObject().uuid;
//      }
//      if(viewAtPoint && viewAtPoint.getWidgetApiObject && viewAtPoint.getWidgetApiObject()){
//        ddd('find children target');
//        if(item_uuid && WebDoc.handlers._dropListeners[item_uuid]){
//          var currentNode = jQuery(viewAtPoint.itemDomNode).contents();
//          var position = { left: viewAtPoint.item.getLeft(), top: viewAtPoint.item.getTop() };
//          for ( element_id in WebDoc.handlers._dropListeners[item_uuid] ){
//            var element = jQuery(currentNode).find('#'+element_id),
//                pos = WebDoc.application.boardController.mapToPageCoordinate(e);
//            if(pos.top < (position.top + element.position().top +  jQuery(element).outerHeight()) && pos.top > (position.top + element.position().top)){
//              if(pos.left < (position.left + element.position().left + jQuery(element).outerWidth()) && pos.left > (position.left + element.position().left)){
//                target = element;
//                break;
//              }
//            }
//          }
//        }
//      }else{
//        target = currentTarget;
//      }
//      var type_for_app;
//      var list_types_to_parse = ['application/x-moz-file-promise-url', 'text/uri-list', 'text/plain',  'application/x-moz-file-promise-url', 'text/x-moz-url' ]
//      for ( type in obj ){
//        if ( e.originalEvent.dataTransfer.getData(type) || (type === 'Files' && e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) ) {
//          ggg( 'Matched mimetype: ' + type );
//
//          // Call it with this as scope. If it returns false we want
//          // to continue trying other mimetypes, otherwise return.
//          //
//          type_for_app = type;
//          if(list_types_to_parse.indexOf(type)> -1){
//            var data = e.originalEvent.dataTransfer.getData(type);
//            type_for_app = WebDoc.DragAndDropController.getFileType(data);
//          }
//
//          if(item_uuid && WebDoc.handlers._dropListeners[item_uuid] &&  WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()] && (WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()][type_for_app] || WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()]['*'])){
//            if('Files' == type){
//              files = e.originalEvent.dataTransfer.files;
//              if( files.length > 5 ) {
//                WebDoc.notificationController.notify("Too many images selected. You may only move 5 images at a time.", WebDoc.NotificationController.WARNING, 0);
//              }else{
//                var uploadOptions =  { maxSize: WebDoc.ajaxUploadManager.MAX_SIZE, allowedTypes: WebDoc.ajaxUploadManager.TYPES_IMAGE };
//                for (var i = 0; i < files.length; i++){
//                  WebDoc.ajaxUploadManager.upload('/images', 'image[attachment]', files[i], uploadOptions, null, function(data) {
//                    var data =  {type: 'image', mimetype: 'image', url: data.image.properties.default_url };
//                    if (!(WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()][type] && WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()][type](data) !== false)){
//                      if (WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()]['*']) WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()]['*'](data);
//                    }
//                  }.bind(this) );
//                }
//              }
//            }else{
//              var data = e.originalEvent.dataTransfer.getData(type);
//              try{ data = JSON.parse(data);}catch(e){};
//              //if (jQuery.regex.image.test(data)){
//              //  data = { url: data };
//              //}
//              if(list_types_to_parse.indexOf(type)> -1){
//                type = WebDoc.DragAndDropController.getFileType(data);
//                data = { url: data };
//              }
//              jQuery.extend(data, {mimetype: type});
//              if (!(WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()][type] && WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()][type](data) !== false)){
//                if (WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()]['*']) WebDoc.handlers._dropListeners[item_uuid][jQuery(target).id()]['*'](data);
//              }
//            }
//            // Don't do anything browsery
//            e.preventDefault();
//            ggge();
//            break;
//          } else {
//            //
//            if ( obj[type].call( context || this, e ) !== false ) {
//
//              // Don't do anything browsery
//              e.preventDefault();
//              ggge();
//              break;
//            }
//
//            ggge();
//          }
//        }
//      }
//
//      // To end the group created at the begining of this function
//      if ( window.console && console.log && e.originalEvent.dataTransfer.types ) {
//        ggge();
//      }
//    };
//  }
//
//};

