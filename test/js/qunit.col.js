jQuery(document).ready(function(){
	var colWraps = jQuery('.col_wrap');
	
	module('col');
	
	colWraps.each(function() {
		var colWrap = jQuery(this),
				cols = colWrap.children('.col'),
				top = colWrap.offset().top;
		
		test('Test top offsets', cols.length, function() {
			cols.each(function() {
				var col = jQuery(this),
				    offset = col.offset();
				
				equal(top, offset.top, 'Same top offset as the previous col.');
				top = offset.top;
			});
		});
	});
});