jQuery(document).ready(function(){
	var colWraps = jQuery('.col_wrap');
	
	module('col');
	
	colWraps.each(function() {
		var colWrap = jQuery(this),
				cols = colWrap.children('.col'),
				top = colWrap.offset().top,
				left;
		
		test(cols.length+' cols: test top offsets', cols.length, function() {
			cols.each(function() {
				var col = jQuery(this),
				    offset = col.offset();
				
				ok(top === offset.top, '.col has the same top offset as the previous col.');
				top = offset.top;
			});
		});
		
		test(cols.length+' cols: test left offsets', cols.length-1, function() {
			cols.each(function() {
				var col = jQuery(this),
				    offset = col.offset();
				
				if (left !== undefined) {
					ok(offset.left > left, '.col is to the left of the previous .col.');
				}
				left = offset.left;
			});
		});
	});
});