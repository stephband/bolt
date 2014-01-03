// jquery.selectify
//
// Stephen Band
//
// Turns lists of links into select boxes with change bindings that
// will redirect the browser as the original links would have. 

(function( jQuery, undefined ){
	var doc = jQuery(document);
	
	jQuery.fn.selectify = function( options ){
		var select = jQuery('<select/>'),
		    populated = false,
		    selected = false,
		    option = jQuery('<option/>');

		//select.html(
		//	option.html((options && options.message) || 'Choisir une categorie')
		//);
		
		this.children().each(function(i){
			var item = jQuery(this).children('a').eq(0),
			    current = item.is(options && options.currentSelector || '.on'),
			    option = jQuery('<option/>');
			
			select.append(
				option
				.text( item.text() )
				.attr('value', item.attr('href') )
			);
			
			if (current) {
				selected = true;
				option.attr('selected', 'selected');
			}
			
			populated = true;
		});
		
		doc
		.off('change.selectify')
		.on('change.selectify', 'select', function(e){
			if (e.currentTarget !== select[0]) { return; }
			var target = jQuery(e.target);
			window.location = target.val();
		});
		
		return populated ? select : jQuery([]) ;
	};
})( jQuery );