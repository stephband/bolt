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