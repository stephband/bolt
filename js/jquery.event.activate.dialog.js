// jquery.event.activate
// 
// Provides activate and deactivate events for controlling
// on/off state of dropdowns, tabs, popups or whatever else
// can be enabled by adding the class 'active'.

(function(jQuery, undefined){
	jQuery.event.special.activate.classes.dialog_layer = {
		activate: function() {
			//console.log('ACTIVATE DIALOG');
		},
		
		deactivate: function() {
			//console.log('DEACTIVATE DIALOG');
		}
	}
})(jQuery);