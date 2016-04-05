// jquery.validate.js
//
// 0.9.1
//
// Stephen Band
//
// Parts of this plugin are inspired by jquery.validate.js (Jörn Zaefferer) -
// indeed some regex is borrowed from there.
//
// Options:
//
// errorSelector - Selector for the closest element to a failed field where
//                 errorClass is added. By default this is the input or
//                 textarea field itself.
// errorClass    - Class that is applied to the errorSelector node when the
//                 the field fails validation. Default is 'error'.
// errorNode     - A jQuery object that is cloned and used as a container
//                 for all error messages.
// autocomplete	 - Overides the form's own autocomplete attribute, which is
//                 useful when validating on keyup events.
//
// Rules are depend on a field's attributes. To define a new rule, add an
// attribute to test for:
//
// jQuery.fn.validate.attributes['data-attribute'] = function(value, attributeValue, passFn, failFn) {
//	 // Validation logic
//	 return pass( newValue [optional] ) or fail( errorMessage [optional] )
// }

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = (window.console && window.console.log && window.console.groupCollapsed);

	var options = {
	    	errorClass: "error",
	    	errorNode: jQuery('<label/>', { 'class': 'error_label' }),
	    	errorSelector: "input, textarea"
	    },

	    errorMessages = {
	    	// Types
	    	url: 'That doesn\'t look like a valid URL',
	    	email: 'Enter a valid email',
	    	number: 'That\'s not a number.',

	    	// Attributes
	    	required: 'Required',
	    	minlength: 'At least {{attr}} characters',
	    	maxlength: 'No more than {{attr}} characters',
	    	min: 'Minimum {{attr}}',
	    	max: 'Maximum {{attr}}'
	    },

	    regex = {
	    	url:		/^([a-z][\w\.\-\+]*\:\/\/)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,6}/,
	    	email:		/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
	    	number:		/^(\-?\d*\.?\d+)$/,
	    	color:		/^#([0-9a-fA-F]{6})$/
	    },

	    // html5 input types
	    types = {
	    	url: {
	    		test: function( value ) { return regex.url.test(value); },
	    		autocomplete: function( value ) {
	    			var autovalue = 'http://' + value;
	    			return regex.url.test(autovalue) ? autovalue : undefined ;
	    		}
	    	},
	    	email: {
	    		test: function( value ) { return regex.email.test(value); }
	    	},
	    	number: {
	    		test: function( value ) { return regex.number.test(value); }
	    	},
	    	color: {
	    		test: function( value ) { return regex.color.test(value); }
	    	}
	    	//datetime: {},
	    	//date: {},
	    	//month: {},
	    	//week: {},
	    	//time: {},
	    	//'datetime-local': {},
	    	//range: {},
	    	//tel: {},
	    	//search: {},
	    },

	    attributes = {
	    	type: function( value, type, pass, fail, autocomplete ){
	    		var autovalue;
	    		//console.log( value, type, pass, fail, autocomplete );
	    		return (
	    			(!value || !types[type] || types[type].test(value)) ? pass() :
	    			autocomplete && ( autovalue = types[type].autocomplete(value) ) ? pass(autovalue) :
	    			fail( errorMessages[type] )
	    		);
	    	},

	    	required: function( value, attr, pass, fail ) {
	    		return ( !!value ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.required, {attr: attr}) ) ;
	    	},

	    	minlength: function( value, attr, pass, fail ) {
	    		return ( !value || value.length >= parseInt(attr) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.minlength, {attr: attr}) ) ;
	    	},

	    	maxlength: function( value, attr, pass, fail ) {
	    		var number = parseInt( attr );

	    		// Be careful, if there is no value maxlength is implicitly there
	    		// whether it's in the html or not, and sometimes it's -1
	    		return ( !value || number === -1 || value.length <= number ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.maxlength, {attr: attr}) ) ;
	    	},

	    	min: function( value, attr, pass, fail ) {
	    		return ( !value || parseFloat(attr) <= parseFloat(value) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.min, {attr: attr}) ) ;
	    	},

	    	max: function( value, attr, pass, fail ) {
	    		return ( !value || parseFloat(attr) >= parseFloat(value) ) ?
	    			pass() :
	    			fail( jQuery.render(errorMessages.max, {attr: attr}) ) ;
	    	}
	    	//pattern: function( value, attr, pass, fail ) {
	    	//	return ( !value );
	    	//}
	    };

	function removeError(data, attr) {
		data[attr] = true;
		data.errorNode.remove();
	}

	function removeErrors(node) {
		var field = jQuery(node),
		    data = field.data('validate'),
		    attr;

		for (attr in attributes) {
			if (data && data[attr] === false) {
				removeError(data, attr);
			}
		}
	}

	// Here's the meat and potatoes
	function validateInput(node, options){
		var field = jQuery(node),
		    value = jQuery.trim(field.val()),
		    data = field.data('validate'),
		    // Adding this option as a quick fix for unwanted autocompletion
		    // happening on the change event. In reality, we may have to
		    // rethink autocomplete a bit.
		    autocomplete = (options.autocomplete !== undefined) ? options.autocomplete : field.attr( 'autocomplete' ) === 'on' ,
		    passFlag = true,
		    stopTestFlag = false,
		    attr, attrval, rule, response;

		if (debug) { console.groupCollapsed('[jquery.validate]', node.id, value); }

		for (attr in attributes) {
			// We use getAttribute rather than .attr(), because
			// it returns the original value of the attribute rather
			// than the browser's interpretation.
			attrval = field[0].getAttribute(attr);

			if (attrval) {
				if (debug) { console.log(attr, attrval); }

				attributes[attr](value, attrval, function(autoval){
					// The test has passed
					if (autoval) {
						value = autoval;
						field.val(autoval);
					}

					// Remove the error message
					if (data && data[attr] === false) {
						removeError(data, attr);
					}
				}, function(message){
					// The test has failed

					var response = options.fail && options.fail.call(node, value, message);

					if (debug) { console.warn('FAIL', attr, message, response); }

					// If the fail callback returns a value, override the
					// failure, and put that value in the field.
					if (response) {
						value = response;
						field.val(response);

						// Remove the error message
						if ( data && data[attr] === false ) {
							removeError(data, attr);
						}
					}
					// Otherwise, it's the end of the road for this one
					else {
						if (!data) {
							data = {
								errorNode: options.errorNode
									.clone()
									.attr("for", field.attr("id") || "" )
							};
							field.data('validate', data);
						}

						// If there is an error message on the node, use that.
						message = node.getAttribute('data-error-' + attr) || message;

						data.errorNode.html(message);

						data[attr] = false;

						field
						.before(data.errorNode)
						.closest(options.errorSelector)
						.addClass(options.errorClass);

						passFlag = false;
					}

					stopTestFlag = true;
				}, autocomplete );
			}

			// If we've been told to stop testing,
			// break out of this loop.
			if (stopTestFlag) {
				break;
			}
		}

		if (debug) { console.groupEnd(); }

		if (passFlag) {
			// Remove error class
			field
			.closest( '.' + options.errorClass )
			.removeClass( options.errorClass );

			// Fire callback with input as context and arguments
			// value (string), checked (boolean)
			options.pass && options.pass.call(node, value, field.attr('checked'));

			return true;
		}
	}

	// Call .validate() on each of a form's inputs
	// and textareas, and call pass if everything
	// passed and fail if at least one thing failed
	function validateForm(node, options){
		var failCount = 0;

		jQuery(node)
		.find("input, textarea, select")
		.validate({
			fail: function(value){
				failCount++;
			}
		});

		if (failCount) {
			options.fail && options.fail.call(this);
		}
		else {
			options.pass && options.pass.call(this);
		}
	}

	function validateTrueForm(node){
		jQuery(node)
		.find("input, textarea")
		.each(function() {
			removeErrors(this);
		});
	}

	function validateTrue() {
		var tagName = this.nodeName.toLowerCase();

		if (tagName === 'form') {
			validateTrueForm(this);
			return;
		}

		if (tagName === 'input' || tagName === 'textarea') {
			removeErrors(this);
			return;
		}
	}

	jQuery.fn.validate = function(o){
		if (o === true) {
			return this.each(validateTrue);
		}

		var options = jQuery.extend({}, jQuery.fn.validate.options, o);

		return this.each(function validate() {
			var tagName = this.nodeName.toLowerCase();

			if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
				if (this.disabled) { return; }
				validateInput(this, options);
				return;
			}
			else {
				validateForm(this, options);
				return;
			}
		});
	};

	options.errorMessages = errorMessages;

	jQuery.fn.validate.regex = regex;
	jQuery.fn.validate.options = jQuery.fn.validate.options = options;
	jQuery.fn.validate.attributes = attributes;
});
