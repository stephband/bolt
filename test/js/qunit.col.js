jQuery(document).ready(function(){
	var colWraps = jQuery('.col_wrap');
	
	console.log('HELLO');
	
	module('col');
	
	colWraps.each(function() {
		var colWrap = jQuery(this),
				cols = colWrap.children('.col');
		
		test('Test top offsets', cols.length-1, function() {
			var top;
			
			cols.each(function() {
				var col = jQuery(this),
				    offset = col.offset();
				
				if (top !== undefined) {
					equal(top, offset.top, 'Same top offset as the previous col.');
				}
				
				top = offset.top;
			});
		});
	});
});