jQuery(document).ready(function(){
	module('Activate by location.hash');
	
	test('Activate by location.hash', 3, function() {
		// We want to test the reaction to location.hash, so reload
		// the page with a testable hash.
		if (!window.location.hash || window.location.hash !== '#test1') {
		  window.location.hash = '#test1';
		  window.location.reload();
		}
		
		ok( jQuery('a[href="#test1"]').eq(0).hasClass('active'), 'First link has class .active');
		ok( jQuery('a[href="#test1"]').eq(1).hasClass('active'), 'Second link has class .active');
		ok( jQuery('#test1').hasClass('active'), 'div has class .active' );
	});
	
	module('Activate by event');
	
	test('Activate by event', 3, function() {
		jQuery('#test2').trigger('activate');
		
		ok( jQuery('a[href="#test2"]').eq(0).hasClass('active'), 'First link has class .active');
		ok( jQuery('a[href="#test2"]').eq(1).hasClass('active'), 'Second link has class .active');
		ok( jQuery('#test2').hasClass('active'), 'div has class .active' );
	});
	
	test('Deactivate by event', 3, function() {
		jQuery('#test2').trigger('deactivate');
		
		ok( !jQuery('a[href="#test2"]').eq(0).hasClass('active'), 'First link does not have class .active');
		ok( !jQuery('a[href="#test2"]').eq(1).hasClass('active'), 'Second link does not have class .active');
		ok( !jQuery('#test2').hasClass('active'), 'div does not have class .active' );
	});
	
	module('Activate by mousedown');
	
	test('Untyped should not activate', 3, function() {
		jQuery('a[href="#test2"]').eq(0).trigger('click');
		
		ok( !jQuery('a[href="#test2"]').eq(0).hasClass('active'), 'First link has class .active');
		ok( !jQuery('a[href="#test2"]').eq(1).hasClass('active'), 'Second link has class .active');
		ok( !jQuery('#test2').hasClass('active'), 'div has class .active' );
	});
	
	test('Dropdowns should deactivate on button click', 3, function() {
		jQuery('#test3').trigger('activate');
		
		jQuery('a[href="#test3"]').eq(0)
		.trigger('mousedown')
		.trigger('mouseup')
		.trigger('click');
		
		ok( !jQuery('a[href="#test3"]').eq(0).hasClass('active'), 'Link has lost class .active');
		ok( !jQuery('a[href="#test3"]').eq(1).hasClass('active'), 'Link has lost class .active');
		ok( !jQuery('#test3').hasClass('active'), 'div has lost class .active' );
	});
	
	test('Dropdowns deactivate on mousedown outside', 3, function() {
		jQuery('#test3').trigger('activate');
		
		jQuery(document.body)
		.trigger('mousedown')
		.trigger('mouseup')
		.trigger('click');
		
		ok( !jQuery('a[href="#test3"]').eq(0).hasClass('active'), 'First link has lost class .active');
		ok( !jQuery('a[href="#test3"]').eq(1).hasClass('active'), 'Second link has lost class .active');
		ok( !jQuery('#test3').hasClass('active'), 'div has lost class .active' );
	});
	
	test('Tabs should not deactivate', 3, function() {
		jQuery('#test4').trigger('activate');
		
		jQuery('a[href="#test4"]').eq(0)
		.trigger('mousedown')
		.trigger('mouseup')
		.trigger('click');
		
		ok( jQuery('a[href="#test4"]').eq(0).hasClass('active'), 'First Link still has class .active');
		ok( jQuery('a[href="#test4"]').eq(1).hasClass('active'), 'Second Link still has class .active');
		ok( jQuery('#test4').hasClass('active'), '.tab still has class .active' );
	});
	
//	module('Activate parents');
//	
//	test('Activate outer tabs first', 6, function() {
//		var order = ['test2', 'test3'],
//				i = 0;
//		
//		jQuery(document).bind('activate', function(e) {
//			equals(e.target.id, order[i++], 'Activate event on '+e.target.id);
//		});
//		
//		jQuery('#test3').trigger('activate');
//		
//		ok( jQuery('a[href="#test2"]').hasClass('active'), 'Link to outer tab has class .active');
//		ok( jQuery('#test2').hasClass('active'), 'outer tab has class .active' );
//		ok( jQuery('a[href="#test3"]').hasClass('active'), 'Link to inner tab has class .active');
//		ok( jQuery('#test3').hasClass('active'), 'inner tab has class .active' );
//	});
});