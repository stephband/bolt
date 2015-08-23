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

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	
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
			hexColor:  /^(#)?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
			hslColor:  /^(?:(hsl)(\())?\s?(\d{1,3}(?:\.\d+)?)\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?(\))?$/,
			rgbColor:  /^(?:(rgb)(\())?\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?(\d{1,3})\s?(\))?$/,
			hslaColor: /^(?:(hsla)(\())?\s?(\d{1,3}(?:\.\d+)?)\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?(\d{1,3}(?:\.\d+)?)%\s?,\s?([01](?:\.\d+)?)\s?(\))?$/,
			rgbaColor: /^(?:(rgba)(\())?\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?(\d{1,3})\s?,\s?([01](?:\.\d+)?)\s?(\))?$/,
			cssValue:  /^(\-?\d+(?:\.\d+)?)(px|%|em|ex|pt|in|cm|mm|pt|pc)?$/,
			cssAngle:  /^(\-?\d+(?:\.\d+)?)(deg)?$/,
			imgFile:   /(?:\.png|\.gif|\.jpeg|\.jpg)$/,
			'float':   /^(\-?\d+(?:\.\d+)?)$/
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
	
	jQuery.fn.validate.attributes['data-type'] = function( value, type, pass, fail, autocomplete ){
		if (debug) { console.log('data-type: '+type); }
		return !value ? pass() : dataTypes[type]( value, pass, fail, autocomplete ) ;
	};
});