// jquery.transitionclass.ie.js
//
// Fallback support for transitions for Internet Exploder.

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.support.transition'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined) {
	var debug = false,

			properties = [
				//'font-size',
				//'line-height',
				//'text-indent',
				//'vertical-align',
				//'word-spacing',
				//'background-color',
				//'background-position',
				//'border-color',
				//'border-spacing',
				//'border-bottom-width,
				'height',
				'min-height',
				'max-height',
				'margin-top',
				'margin-left',
				'margin-right',
				'margin-bottom',
				'opacity',
				//'outline-width',
				//'outline-offset',
				//'outline-color',
				'padding-top',
				'padding-right',
				'padding-bottom',
				'padding-left',
				'width',
				'max-width',
				'min-width',
				'bottom',
				'top',
				'left',
				'right',
				'visibility',
				//'transform',
				//'ms-transform'
				//'z-index',
				'zoom'
			],

			// Timing function definitions from the CSS specification
			easing = {
				'linear': [0, 0, 1, 1],
				'ease': [0.25, 0.1, 0.25, 1],
				'ease-in': [0.42, 0, 1, 1],
				'ease-out': [0, 0, 0.58, 1],
				'ease-in-out': [0.42, 0, 0.58, 1]
			},

			// Splits strings of the form "prop, duration, timingFn[, delay]"
			rtransition = /([a-z\-]+)\s+(\d+[ms]+)\s+([a-z\-]+(?:\(\s*(?:\d+\s*,\s*)*\d+\s*\))?)(?:\s+(\d+[ms]+))?\s*/g,
			rtimingfunction = /([a-z\-]+(?:\([\d\.,\s]+\))?)/g,

			// Construct an object of handlers for each CSS property we
			// are going to take care of.
			handlers = (function(properties, obj) {
				var handlers = {},
				    l = properties.length;

				while (l--) {
					handlers[properties[l]] = obj[properties[l]] || obj._default;
				}

				return handlers;
			})(properties, {
				visibility: function(node, endCss, midCss, options, trans, prop) {
					var fn;
					
					if (getStyle(node, 'visibility') === 'hidden') {
						// Keep the node visible until the end of the transition.
						midCss.visibility = 'visible';
						
						if (!endCss.visibility) {
							fn = options.complete;

							// Duct tape options.complete to remove visibility rule.
							options.complete = function() {
								jQuery(node).css({ visibility: '' });
								if (fn) fn.apply(this);
							};
						}
					}
				},

				zoom: function(node, endCss, midCss, options, trans) {
					var endZoom = jQuery.css(node, 'zoom');

					midCss.zoom = 1;
					// OMG, zoom is set as a ratio, but reported as a percentage in IE9,
					// a px dimension in IE8 (WTF?)...
					if (/px$/.test(endZoom)) {
						endCss.zoom = parseInt(endZoom, 10)/857;
					}
					else if (/%$/.test(endZoom)) {
						endCss.zoom = parseFloat(endZoom)/100;
					}

					options.specialEasing['zoom'] = trans.timingFn;
				},

				transform: function(node, endCss, midCss, options, trans, prop) {
					var text = getStyle(node, '-ms-transform'),
					    scale = /(\d+\.\d+)/.exec(text);

					// Crude, ugly, will break
					if (scale) {
						scale = parseFloat(scale[1]);
					}

					endCss.zoom = scale;
					endCss.left = (1 - scale) * 272;
					endCss.top  = (1 - scale) * 180;

					midCss.zoom = 1;
					midCss.left = 0;
					midCss.top  = 0;
				},

				_default: function(node, endCss, midCss, options, trans, prop) {
					endCss[prop] = parseInt(jQuery.css(node, prop), 10);
					options.specialEasing[prop] = trans.timingFn;
				}
			});


	// Cubic bezier timing function translated from webkit source by Christian Effenberger
	// http://www.netzgesta.de/dev/cubic-bezier-timing-function.html
	function makeBezier(p1x, p1y, p2x, p2y) {
		// Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
		var cx = 3.0 * p1x,
				bx = 3.0 * (p2x - p1x) - cx,
				ax = 1.0 - cx - bx,
				cy = 3.0 * p1y,
				by = 3.0 * (p2y - p1y) - cy,
				ay = 1.0 - cy - by;

		// The epsilon value to pass given that the animation is going to run over |dur| ms. The longer the
		// animation, the more precision is needed in the timing function result to avoid ugly discontinuities.
		function solveEpsilon(duration) { return 1/(0.2 * duration); }

		function fabs(n) { return n >= 0 ? n : 0 - n ; }

		// `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
		function sampleCurveX(t) { return ((ax*t+bx)*t+cx)*t; }
		function sampleCurveY(t) { return ((ay*t+by)*t+cy)*t; }
		function sampleCurveDerivativeX(t) { return (3.0*ax*t+2.0*bx)*t+cx; }

		// Given an x value, find a parametric value it came from.
		function solveCurveX(x,epsilon) {
			var t0,t1,t2,x2,d2,i;
			
			// First try a few iterations of Newton's method -- normally very fast.
			for(t2=x, i=0; i<8; i++) {
				x2=sampleCurveX(t2)-x;
				if(fabs(x2) < epsilon) { return t2; }
				d2=sampleCurveDerivativeX(t2);
				if(fabs(d2) < 1e-6) { break; }
				t2=t2-x2/d2;
			}
			
			// Fall back to the bisection method for reliability.
			t0=0.0;
			t1=1.0;
			t2=x;
			if(t2<t0) { return t0; }
			if(t2>t1) { return t1; }
			
			while(t0<t1) {
				x2=sampleCurveX(t2);
				if(fabs(x2-x)<epsilon) { return t2; }
				if(x>x2) { t0=t2; }
				else { t1=t2; }
				t2=(t1-t0)*0.5+t0;
			}
			
			return t2; // Failure.
		}

		function solve(x,epsilon) {
			return sampleCurveY(solveCurveX(x, epsilon));
		}

		return function(t, time, start, end, duration) {
			return solve(t, solveEpsilon(duration));
		};
	}
	
	function addEasing(str) {
		var fn = jQuery.easing[str],
				name, coords, l;
		
		// Return the cached function if it exists.
		if (fn) { return fn; }
		
		// Get the standard easing function if it's defined.
		if (easing[str]) {
			name = str;
			coords = easing[str];
			str = 'cubic-bezier(' + coords.join(', ') + ')';
		}
		
		// Else assume this is a cubic-bezier. It must be.
		else {
			coords = str.match(/\d*\.?\d+/g);
			l = coords.length; // Should be 4
			
			while (l--) {
				coords[l] = parseFloat(coords[l]);
			}
		}
		
		fn = makeBezier.apply(this, coords);
		
		jQuery.easing[str] = fn;
		if (name) { jQuery.easing[name] = fn; }
		
		return fn;
	}
	
	function parseTransitionCSS(prop, dur, timing, delay) {
		var obj = {},
				properties = {},
				end = 0,
				l, parsed, idur, itiming, idelay;

		prop = prop.split(/,\s*/);
		dur = dur.split(/,\s*/);
		timing = timing.match(rtimingfunction);
		delay = delay.split(/,\s*/);

		l = prop.length;

		// Careful, because after splitting values into arrays we can
		// still end up with arrays contining an empty string [""].
		if (l === 1 && !prop[0]) {
			return;
		}

		while (l--) {
			idur = dur[l] || dur[dur.length-1];
			itiming = timing[l] || timing[timing.length-1];
			idelay = delay[l] || delay[delay.length-1];
			
			parsed = {
				duration: Math.round(parseFloat(idur) * (/ms$/.test(idur) ? 1 : 1000 )),
				delay: Math.round(parseFloat(idelay) * (/ms$/.test(idelay) ? 1 : 1000 )) || 0,
				timingFn: itiming
			};
			
			properties[prop[l]] = parsed;
			
			end = Math.max(end, parsed.duration + parsed.delay);
		}
		
		obj.end = end;
		obj.length = prop.length;
		obj.properties = properties;
		
		return end === 0 ? undefined : obj;
	}

	function getStyle(node, prop) {
		return window.getComputedStyle ?
			// For IE9
			getComputedStyle(node, null)[prop] :
			// For IE6, IE7, IE8
			node.currentStyle[prop];
	}
	
	function parseTransitionIE(node) {
		var str = getStyle(node, 'transition'),
				properties, durations, timingFns, delays,
				prop, obj;
		
		if (str) {
			properties = '';
			durations = '';
			timingFns = '';
			delays = '';

			str.replace(rtransition, function($0, prop, dur, fn, del) {
				properties += (',' + prop);
				durations += (',' + dur);
				timingFns += (',' + fn);
				delays += (',' + (del || 0));
			});
		}

		if (debug) {
			console.log([
				getStyle(node, 'transition-property') + '|' + properties,
				getStyle(node, 'transition-duration') + '|' + durations,
				getStyle(node, 'transition-timing-function') + '|' + timingFns,
				getStyle(node, 'transition-delay') + '|' + delays
			].join(' '));
		}
		
		obj = parseTransitionCSS(
			(getStyle(node, 'transition-property') || properties || ''),
			(getStyle(node, 'transition-duration') || durations || ''),
			(getStyle(node, 'transition-timing-function') || timingFns || ''),
			(getStyle(node, 'transition-delay') || delays || '')
		);

		if (obj) {
			for (prop in obj.properties) {
				// Add easing to jQuery's repertoire
				addEasing(obj.properties[prop].timingFn);
			}
		}

		return obj;
	}

	function animateTransition(node, elem, style1, classes1, obj, callback) {
		var style2   = elem.attr('style'),
		    classes2 = elem.attr('class'),
		    endCss = {},
		    midCss = {},
		    options = {
		      // The easiest way to stop two transitions colliding.
		      queue: true,
		      specialEasing: {},
		      complete: function() {
		        // Set the style attribute to it's post-transition state. In an
		        // ideal world, the elem will remain the same because we have
		        // just animated to this state.
		        if (style2) elem.attr('style', style2);
		        else elem.removeAttr('style');

		        elem.trigger({
		          type: jQuery.support.transitionEnd,
		          propertyName: ''
		        });

		        if (callback) callback.apply(this);
		      },
		      // For now, we don't support delay or multiple durations. Maybe
		      // one day.
		      duration: obj.end
		    },
		    properties = obj.properties,
		    property;

		for (property in properties) {
			if (handlers[property]) {
				handlers[property](node, endCss, midCss, options, properties[property], property);
			}
		}

		if (style1 !== style2) {
			if (style1) elem.attr('style', style1);
			else elem.removeAttr('style');
		}

		if (classes1 !== classes2) {
			if (classes1) elem.attr('class', classes1);
			else elem.removeAttr('class');
		}

		elem.css(midCss);

//		if ('opacity' in properties) {
//			// IE7 needs to be spanked hard to force opacity animations to work.
//			elem.css({ 'filter': 'alpha(opacity='+(elem.css('opacity')*100)+')' });
//		}

		elem.animate(endCss, options);

		if (classes1 !== classes2) {
			if (classes2) elem.attr('class', classes2);
			else elem.removeAttr('class');
		}
	}

	// The meat and potatoes

	jQuery.support.transitionEnd = 'jqueryTransitionEnd';

	jQuery.fn.transition = function(fn, callback) {
		var node = this[0],
		    elem = this,
		    style, classes, obj;

		style = elem.attr('style');
		classes = elem.attr('class');

		fn.apply(this);

		obj = parseTransitionIE(node);

		if (!obj) {
			// No transition definition found. Call the callback
			// immediately and skidaddle.
			if (callback) callback.apply(this);
			return this;
		}

		animateTransition(node, elem, style, classes, obj, callback);

		return this;
	};

	jQuery.fn.addTransitionClass = function(classes, callback) {
		return this.transition(function() {
			this.addClass(classes);
		}, callback);
	};

	jQuery.fn.removeTransitionClass = function(classes, callback) {
		return this.transition(function() {
			this.removeClass(classes);
		}, callback);
	};
});