jQuery(document).ready(function(){
	module('Trigger by location');
	
	test('Activate elem with id of location.hash', 3, function() {
		jQuery('#test1').trigger('activate');
		
		ok( jQuery('a[href="#test1"]').hasClass('active'), 'First link has class .active');
		ok( jQuery('a[href="#test1"]').hasClass('active'), 'Second link has class .active');
		ok( jQuery('#test1').hasClass('active'), 'div has class .active' );
	});
	
	module('Trigger by event');
	
	test('Trigger activate', 6, function() {
		jQuery('#test2').trigger('activate');
		
		ok( jQuery('a[href="#test2"]').hasClass('active'), 'First link has class .active');
		ok( jQuery('a[href="#test2"]').hasClass('active'), 'Second link has class .active');
		ok( jQuery('#test2').hasClass('active'), 'div has class .active' );

		jQuery('#test2').trigger('deactivate');
		
		ok( !jQuery('a[href="#test2"]').hasClass('active'), 'First link does not have class .active');
		ok( !jQuery('a[href="#test2"]').hasClass('active'), 'Second link does not have class .active');
		ok( !jQuery('#test2').hasClass('active'), 'div does not have class .active' );
	});
	
	module('Trigger by click');
	
	test('Click on link', 4, function() {
		jQuery('a[href="#test2"]').eq(0).trigger('click');
		
		ok( jQuery('a[href="#test2"]').hasClass('active'), 'Link has class .active');
		ok( jQuery('#test2').hasClass('active'), 'div has class .active' );

		jQuery('a[href="#test2"]').eq(0).trigger('click');
		
		ok( !jQuery('a[href="#test2"]').hasClass('active'), 'Link has lost class .active');
		ok( !jQuery('#test2').hasClass('active'), 'div has lost class .active' );
	});
	
	module('Activate parents');
	
	test('Activate outer tabs first', 6, function() {
		var order = ['test2', 'test3'],
				i = 0;
		
		jQuery(document).bind('activate', function(e) {
			equals(e.target.id, order[i++], 'Activate event on '+e.target.id);
		});
		
		jQuery('#test3').trigger('activate');
		
		ok( jQuery('a[href="#test2"]').hasClass('active'), 'Link to outer tab has class .active');
		ok( jQuery('#test2').hasClass('active'), 'outer tab has class .active' );
		ok( jQuery('a[href="#test3"]').hasClass('active'), 'Link to inner tab has class .active');
		ok( jQuery('#test3').hasClass('active'), 'inner tab has class .active' );
	});
});