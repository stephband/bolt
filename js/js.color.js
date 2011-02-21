// Color.js
// 
// 0.2
// 
// Stephen Band
// 
// Constucts a color object for converting colors between hex,
// rgb, hsl, rgba and hsla values.

(function( namespace, undefined ){
	
	// Parse strings looking for color tuples [255,255,255]
	function parseColor( color ) {
		var result;
		
		// Look for rgb(num,num,num) or rgba(num,num,num,num)
		if (result = /rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([01](?:\.[0-9]+)?)?\s*)?\)/.exec(color)) {
			return {
				r: parseInt(result[1],10)/255,
				g: parseInt(result[2],10)/255,
				b: parseInt(result[3],10)/255,
				a: result[4] === undefined ? 1 : parseFloat(result[4])
			};
		}
		
		// Look for rgb(num%,num%,num%) or rgba(num%,num%,num%,num)
		if (result = /rgba?\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*(?:,\s*([01](?:\.[0-9]+)?)?\s*)?\)/.exec(color)) {
			return {
				r: parseFloat(result[1])*0.01,
				g: parseFloat(result[2])*0.01,
				b: parseFloat(result[3])*0.01,
				a: result[4] === undefined ? 1 : parseFloat(result[4])
			};
		}
		
		// Look for hsl(num,num%,num%) or hsla(num,num%,num%,num)
		if (result = /hsla?\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*(?:,\s*([01](?:\.[0-9]+)?)?\s*)?\)/.exec(color)) {
			return {
				h: parseFloat(result[1])/360,
				s: parseFloat(result[2])*0.01,
				l: parseFloat(result[3])*0.01,
				a: result[4] === undefined ? 1 : parseFloat(result[4])
			};
		}
		
		// Look for #a0b1c2
		if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color) ) {
			return {
				r: parseInt(result[1],16),
				g: parseInt(result[2],16),
				b: parseInt(result[3],16),
				a: 1
			};
		}
		
		// Look for #fff
		if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)) {
			return {
				r: parseInt(result[1]+result[1],16),
				g: parseInt(result[2]+result[2],16),
				b: parseInt(result[3]+result[3],16),
				a: 1
			};
		}
		
		if ( color === 'transparent' ) {
			return { r: 0, g: 0, b: 0, h: 0, s: 0, l: 0, a: 0 };
		}
	}
	
	function toActual( value ){
		return parseInt(value * 255, 10);
	}
	
	function toPercentage( value ){
		return value * 100;
	}
	
	function toHex( value ){
		var result = toActual( value ).toString( 16 );
		return result.length === 1 ? '0' + result : result ;
	}
	
	// HSL to RGB functions purloined from here:
	// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
	
	function hueToVal(p, q, t){
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		
		return (
			t < 1/6 ? p + (q - p) * 6 * t :
			t < 1/2 ? q :
			t < 2/3 ? p + (q - p) * (2/3 - t) * 6 :
			p
		);
	}
	
	function calcRgb( obj ){
		var q, p, h;
		
		if(obj.s === 0){
			obj.r = obj.g = obj.b = obj.l;
		}
		else {
				q = obj.l < 0.5 ? obj.l * (1 + obj.s) : obj.l + obj.s - obj.l * obj.s;
				p = 2 * obj.l - q;
				
				obj.r = hueToVal(p, q, obj.h + 1/3);
				obj.g = hueToVal(p, q, obj.h);
				obj.b = hueToVal(p, q, obj.h - 1/3);
		}
		
		return obj;
	}
	
	function Color( value ){
		var obj = typeof value === 'string' ? parseColor(value) : value,
				key;
		
		for (key in obj) {
			this[key] = obj[key];
		}
	}
	
	Color.prototype = {
		
		rgbString: function(){
			if ( this.r === undefined || this.g === undefined || this.b === undefined ) {
				calcRgb( this );
			}
			return ['rgb(', toActual(this.r), ',', toActual(this.g), ',', toActual(this.b), ')'].join('');
		},
		
		rgbaString: function(){
			if ( this.r === undefined || this.g === undefined || this.b === undefined ) {
				calcRgb( this );
			}
			return ['rgb(', toActual(this.r), ',', toActual(this.g), ',', toActual(this.b), ',', this.a, ')'].join('');
		},
		
//		hslString: function(){
//			if ( this.h === undefined || this.s === undefined || this.l === undefined ) {
//				calcHsl( this );
//			}
//		},
//		
//		hslaString: function(){
//			if ( this.h === undefined || this.s === undefined || this.l === undefined ) {
//				calcHsl( this );
//			}
//		},
		
		hexString: function(){
			if ( this.r === undefined || this.g === undefined || this.b === undefined ) {
				calcRgb( this );
			}
			return ['#', toHex(this.r), toHex(this.g), toHex(this.b)].join('');
		}
	};
	
	namespace.Color = Color;
})( window );