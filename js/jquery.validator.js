// jquery.validator.js
// 
// 0.9
// 
// Stephen Band
// 
// Parts of this plugin are inspired by jquery.validate.js (Jörn Zaefferer) -
// indeed some regex is borrowed from there.
//
// Options:
// 
// errorSelector - Selector for the closest element to a failed field where
//								 errorClass is added. By default this is the input or
//								 textarea field itself.
// errorClass		 - Class that is applied to the field (or it's closest
//								 errorSelector) when it fails validation. Default is 'error'.
// errorNode		 - A jQuery object that is cloned and used as a container
//								 for all error messages.
// autocomplete	 - Overides the form's own autocomplete attribute, which is
//								 useful when validating on keyup events.
//
// Rules are depend on a field's attributes. To define a new rule, add an
// attribute to test for:
//
// jQuery.fn.validator.attributes['data-attribute'] = function(value, attributeValue, passFn, failFn) {
//	 // Validation logic
//	 // return pass( newValue [optional] ) or fail( errorMessage [optional] )
// }

(function(jQuery, undefined){
	var options = {
				errorClass: "error",
				errorNode: jQuery('<label/>', { 'class': 'error_message' }),
				errorSelector: "input, textarea"
			},
			
			debug = (window.console && window.console.log),
			
			// Regex
			regex = {
				//url:			/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
				url:			/^(http\:\/\/)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,6}/,
				email:		/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
				number:		/^(\d+\.?\d+?)$/,
				color:		/^#([0-9a-fA-F]{6})$/
			},
			
			// html5 input types
			types = {
				// type url reports type text in FF3.6
				url: {
					test: function( value ) { return regex.url.test(value); },
					autocomplete: function( value ) {
						var autovalue = 'http://' + value;
						return regex.url.test(autovalue) ? autovalue : undefined ;
					},
					error: 'This doesn\'t look like a valid url to me'
				},
				email: {
					test: function( value ) { return regex.email.test(value); },
					error: 'Enter a valid email'
				},
				number: {
					test: function( value ) { return regex.number.test(value); },
					error: 'That\'s not a number.'
				},
				color: {
					test: function( value ) { return regex.number.test(value); }
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
						fail( types[type].error )
					);
				},
				
				required: function( value, attr, pass, fail ) {
					return ( !!value ) ?
						pass() :
						fail( 'Required' ) ;
				},
				
				minlength: function( value, attr, pass, fail ) {
					return ( !value || value.length >= parseInt(attr) ) ?
						pass() :
						fail( 'At least ' + attr + ' characters' ) ;
				},
				
				maxlength: function( value, attr, pass, fail ) {
					var number = parseInt( attr );
					
					// Be careful, if there is no value maxlength is implicitly there
					// whether it's in the html or not, and sometimes it's -1
					return ( !value || number === -1 || value.length <= number ) ?
						pass() :
						fail( 'No more than ' + attr + ' characters' );
				},
				
				min: function( value, attr, pass, fail ) {
					return ( !value || parseFloat(attr) <= parseFloat(value) ) ?
						pass() :
						fail( 'Minimum ' + attr ) ;
				},
				
				max: function( value, attr, pass, fail ) {
					return ( !value || parseFloat(attr) >= parseFloat(value) ) ?
						pass() :
						fail( 'Maximum ' + attr ) ;
				}
				//pattern: function( value, attr, pass, fail ) {
				//	return ( !value );
				//}
			};
	
	// Here's the meat and potatoes
	function handle(node, options){
		var field = jQuery(node),
				value = jQuery.trim( field.val() ),
				data = field.data('validate'),
				// Adding this option as a quick fix for unwanted autocompletion
				// happening on the change event. In reality, we may have to
				// rethink autocomplete a bit.
				autocomplete = (options.autocomplete !== undefined) ? options.autocomplete : field.attr( 'autocomplete' ) === 'on' ,
				passFlag = true,
				stopTestFlag = false,
				attr, attrval, rule, response;
		
		for (attr in attributes) {
		  // We use getAttribute rather than .attr(), because
		  // it returns the original value of the attribute rather
		  // than the browser's interpretation.
			attrval = field[0].getAttribute( attr );
			
			if ( attrval ) {
				attributes[attr]( value, attrval, function( autoval ){
					// The test has passed
					
					if ( autoval ) {
						value = autoval;
						field.val(autoval);
					}
					
					// Remove the error message
					if ( data && data[attr] === false ) {
						data[attr] = true;
						data.errorNode.remove();
					}
					
				}, function( message ){
					// The test has failed
					
					var response = options.fail && options.fail.call(node, value, message);
					
					// If the fail callback returns a value, override the
					// failure, and put that value in the field.
					if ( response ) {
						
						value = response;
						field.val(response);
						
						// Remove the error message
						if ( data && data[attr] === false ) {
							data[attr] = true;
							data.errorNode.remove();
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
						
						data.errorNode.html( message );
						
						data[attr] = false;
						
						field
						.before( data.errorNode )
						.closest( options.errorSelector )
						.addClass( options.errorClass );
						
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
		
		if (passFlag) {
			// Remove error class
			field
			.closest( '.' + options.errorClass )
			.removeClass( options.errorClass );
			
			// Fire callback with input as context and arguments
			// value(string), checked(boolean)
			options.pass && options.pass.call( node, value, field.attr('checked') );
			
			return true;
		}
	}
	
	jQuery.fn.validator = function(options){
		var o = jQuery.extend({}, jQuery.fn.validator.options, options);
		
		return this
		.bind('submit', { options: o }, function(e){
			var form = jQuery(this),
					data = form.data('validator'),
					rule, validator, fields;
			
			if (!data) {
				data = { attempt: 0 };
				form.data('validator', data);
			}
			
			fields = form
			.find( 'input, textarea' )
			.each( function(i){
				if ( !handle(this, o) ) { e.preventDefault(); }
			});
			
			if (debug) { console.log('submit'); }
			
			// Dont go on to delegate events when it has already been done
			// or when there's no fields to validate
			if ( data.attempt++ || fields.length === 0 ) { return; }
				
			form
			.delegate( 'input, textarea', 'change', function(){
				if (debug) { console.log('change'); }
				handle(this, o);
			});
			
			if (debug) { console.log('change events delegated'); }
		});
	};
	
	// Call .validate() on each of a forms inputs
	// and textareas, and call pass if everything
	// passed and fail if at least one thing failed
	function handleForm( node, options ){
		var failCount = 0;
		
		jQuery(node)
		.find("input, textarea")
		.validate({
			pass: function( value ){
				if (debug) { console.log( value + ' - PASS' ); }
			},
			fail: function( value ){
				if (debug) { console.log( value + ' - FAIL' ); }
				failCount++;
			}
		});
		
		if (failCount && options.fail) {
			options.fail.call(this);
		}
		else if (options.pass) {
			options.pass.call(this);
		}
	}
	
	jQuery.fn.validate = function(o){
		var options = jQuery.extend({}, jQuery.fn.validator.options, o);
		
		return this.each(function(i){
			var tagName = this.nodeName.toLowerCase();
			
			if (tagName === 'form') {
				handleForm(this, options);
			}
			else if (tagName === 'input' || tagName === 'textarea') {
				handle(this, options);
			}
		});
	};
	
	jQuery.fn.validator.regex = regex;
	jQuery.fn.validator.options = options;
	jQuery.fn.validator.attributes = attributes;
	
})(jQuery);



// Extend validation with support for extra, non-standard
// types, via the attribute data-type="xxx", eg:
//
// <input data-type="cssvalue" />
//
// Possible values:
//
// cssvalue
// csscolor
// cssangle
// imageurl
// email (workaround for rails)

(function(jQuery, undefined){
	
	var debug = (window.console && window.console.log);
	
	var cssColors = {
				transparent: true,
				// CSS3 color names
				aliceblue: true,
				antiquewhite: true,
				aqua: true,
				aquamarine: true,
				azure: true,
				beige: true,
				bisque: true,
				black: true,
				blanchedalmond: true,
				blue: true,
				blueviolet: true,
				brown: true,
				burlywood: true,
				cadetblue: true,
				chartreuse: true,
				chocolate: true,
				coral: true,
				cornflowerblue: true,
				cornsilk: true,
				crimson: true,
				cyan: true,
				darkblue: true,
				darkcyan: true,
				darkgoldenrod: true,
				darkgray: true,
				darkgreen: true,
				darkgrey: true,
				darkkhaki: true,
				darkmagenta: true,
				darkolivegreen: true,
				darkorange: true,
				darkorchid: true,
				darkred: true,
				darksalmon: true,
				darkseagreen: true,
				darkslateblue: true,
				darkslategray: true,
				darkslategrey: true,
				darkturquoise: true,
				darkviolet: true,
				deeppink: true,
				deepskyblue: true,
				dimgray: true,
				dimgrey: true,
				dodgerblue: true,
				firebrick: true,
				floralwhite: true,
				forestgreen: true,
				fuchsia: true,
				gainsboro: true,
				ghostwhite: true,
				gold: true,
				goldenrod: true,
				gray: true,
				green: true,
				greenyellow: true,
				grey: true,
				honeydew: true,
				hotpink: true,
				indianred: true,
				indigo: true,
				ivory: true,
				khaki: true,
				lavender: true,
				lavenderblush: true,
				lawngreen: true,
				lemonchiffon: true,
				lightblue: true,
				lightcoral: true,
				lightcyan: true,
				lightgoldenrodyellow: true,
				lightgray: true,
				lightgreen: true,
				lightgrey: true,
				lightpink: true,
				lightsalmon: true,
				lightseagreen: true,
				lightskyblue: true,
				lightslategray: true,
				lightslategrey: true,
				lightsteelblue: true,
				lightyellow: true,
				lime: true,
				limegreen: true,
				linen: true,
				magenta: true,
				maroon: true,
				mediumaquamarine: true,
				mediumblue: true,
				mediumorchid: true,
				mediumpurple: true,
				mediumseagreen: true,
				mediumslateblue: true,
				mediumspringgreen: true,
				mediumturquoise: true,
				mediumvioletred: true,
				midnightblue: true,
				mintcream: true,
				mistyrose: true,
				moccasin: true,
				navajowhite: true,
				navy: true,
				oldlace: true,
				olive: true,
				olivedrab: true,
				orange: true,
				orangered: true,
				orchid: true,
				palegoldenrod: true,
				palegreen: true,
				paleturquoise: true,
				palevioletred: true,
				papayawhip: true,
				peachpuff: true,
				peru: true,
				pink: true,
				plum: true,
				powderblue: true,
				purple: true,
				red: true,
				rosybrown: true,
				royalblue: true,
				saddlebrown: true,
				salmon: true,
				sandybrown: true,
				seagreen: true,
				seashell: true,
				sienna: true,
				silver: true,
				skyblue: true,
				slateblue: true,
				slategray: true,
				slategrey: true,
				snow: true,
				springgreen: true,
				steelblue: true,
				tan: true,
				teal: true,
				thistle: true,
				tomato: true,
				turquoise: true,
				violet: true,
				wheat: true,
				white: true,
				whitesmoke: true,
				yellow: true,
				yellowgreen: true
			},
			
			regex = {
				hexColor:		    /^(#)?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
				hslColor:		    /^(?:(hsl)(\())?\s?(\d{1,3}(?:\.\d+)?)\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?(\))?$/,
				rgbColor:		    /^(?:(rgb)(\())?\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?(\d{1,3})\s?(\))?$/,
				hslaColor:	    /^(?:(hsla)(\())?\s?(\d{1,3}(?:\.\d+)?)\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?([01](?:\.\d+)?)\s?(\))?$/,
				rgbaColor:	    /^(?:(rgba)(\())?\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?([01](?:\.\d+)?)\s?(\))?$/,
				cssValue:		    /^(\-?\d+(?:\.\d+)?)(px|%|em|ex|pt|in|cm|mm|pt|pc)?$/,
				cssAngle:		    /^(\-?\d+(?:\.\d+)?)(deg)?$/,
				imgFile:		    /(?:\.png|\.gif|\.jpeg|\.jpg)$/,
				'float':		    /^(\-?\d+(?:\.\d+)?)$/
			},
			
			// Data types
			dataTypes = {
				
				cssvalue: function( value, pass, fail, autocomplete ) {
					var test = regex.cssValue.exec(value);
					
					return test ?
								 test[2] || test[1] === '0' ? pass() : 
								 autocomplete ? pass(test[0]+'px') :
									 fail('How about some units, like <i>%</i>, <i>px</i> or <i>em</i>?') :
									 fail('Not a valid CSS value') ;
				},
				
				cssmultivalues: function( value, pass, fail, autocomplete ) {
				  var intIndexOfMatch = value.indexOf("  ");

          while (intIndexOfMatch !== -1){
            value = value.replace( "  ", " " );
            intIndexOfMatch = value.indexOf( "  " );
          }
          
					var parts = value.split(" "),
					   test, i;
          
					for (i = 0; i < parts.length;i++) {
            test = regex.cssValue.exec(parts[i]);
            if (!test) {
              return fail('Not a valid CSS value');
            }
					}
					return pass();
				},

				csscolor: function( value, pass, fail, autocomplete ) {
					var test = cssColors[value];
					
					if ( test ) {
						return pass();
					}
					
					test = regex.hexColor.exec( value );
					
					if ( test ) {
						return test[1] ? pass() :
									 autocomplete ? pass( '#'+test[2] ) :
									 fail('I\'d understand <i>#'+test[2]+'</i> better') ;
					}
					
					test	= regex.hslColor.exec( value );
					
					if ( test ) {
						return test[1] && test[2] && test[6] ? pass() :
									 autocomplete ? pass( 'hsl( '+test[3]+', '+test[4]+'%, '+test[5]+'% )' ) :
									 fail('Perhaps you\'re trying to enter <i>hsl( '+test[3]+', '+test[4]+'%, '+test[5]+'% )</i>?') ;
					}
					
					test = regex.rgbColor.exec( value );
					
					if ( test ) {
						return test[1] && test[2] && test[6] ? pass() :
									 autocomplete ? pass( 'rgb( '+test[3]+', '+test[4]+', '+test[5]+' )' ) :
									 fail('Do you want <i>rgb( '+test[3]+', '+test[4]+', '+test[5]+' )</i>?') ;
					}
					
					test	= regex.hslaColor.exec( value );
					
					if ( test ) {
						return test[1] && test[2] && test[7] ? pass() :
									 autocomplete ? pass( 'hsla( '+test[3]+', '+test[4]+'%, '+test[5]+'%, '+test[6]+' )' ) :
									 fail('Are you looking for <i>hsla( '+test[3]+', '+test[4]+'%, '+test[5]+'%, '+test[6]+' )</i>?') ;
					}
					
					test	= regex.rgbaColor.exec( value );
					
					if ( test ) {
						return test[1] && test[2] && test[7] ? pass() :
									 autocomplete ? pass( 'rgba( '+test[3]+', '+test[4]+', '+test[5]+', '+test[6]+' )' ) :
									 fail('Do you mean <i>rgba( '+test[3]+', '+test[4]+', '+test[5]+', '+test[6]+' )</i>?') ;
					}
					
					return fail('Not a valid CSS color') ;
				},
				
				cssangle: function( value, pass, fail, autocomplete ){
					var test = regex.cssAngle.exec( value );
					
					if (test) {
						return test[2] ? pass() :
									 autocomplete ? pass( test[1] + 'deg' ) :
									 fail('Do you mean <i>'+test[1]+'deg</i>?') ;
					}
					
					return fail('That\'s not a CSS angle I recognise');
				},
				
				imagefile: function( value, pass, fail ) {
					return regex.imgFile.test( value ) ?
								 pass() :
								 fail('Must be a <i>.png</i>, <i>.jpg</i>, <i>.jpeg</i>, or <i>.gif</i> file') ;
				},
				
				// Rails doesn't do html5 forms yet. Using email as a data-type is a workaround.
				email: function( value, pass, fail ) {
					return jQuery.fn.validator.regex.email.test(value) ?
								 pass() :
								 fail('Not a valid email address') ;
				},
				
				json: function( value, pass, fail ) {
					var obj;
					
					try {
						obj = JSON.parse( value );
						pass( obj );
					}
					catch (error) {
						fail('That doesn\'t validate as JSON.');
						if (debug) { console.log( '[validator] Fail error:', error ); }
					}
				}
			};
	
	jQuery.fn.validator.attributes['data-type'] = function( value, type, pass, fail, autocomplete ){
		if (debug) { console.log('data-type: '+type); }
		return !value ? pass() : dataTypes[type]( value, pass, fail, autocomplete ) ;
	};

})(jQuery);