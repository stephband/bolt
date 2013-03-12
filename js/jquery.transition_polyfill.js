/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, undef:true, curly:true, browser:true, devel:true, jquery:true, indent:4, maxerr:50, smarttabs:true */

// jQuery.addTransitionClass(classes, callback)
// 
// 2.0_dev

(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', './jquery.prefix', './jquery.support.transition'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
  var debug = false, //(window.debug === undefined ? (window.console && window.console.log) : window.debug),
      
      doc = jQuery(document),
      
      support = jQuery.support,
      
      // Properties that could potentially have a value of 'auto' or 'inherit',
      // and thus need a bit of babysitting.
      autoProps = {
        height: true,
        width: true,
        marginLeft: true,
        marginRight: true
      // I'm commenting these out because they're rarely used, and 'left'
      // is causing a problem for slide activation. And things are starting
      // to feel sluggish.
      //  top: true,
      //  bottom: true,
      //  left: true,
      //  right: true,
      //  fontSize: true
      },
      
      transProps = {
        transition: true,
        transitionProperty: true,
        transitionDuration: true,
        transitionDelay: true,
        transitionTimingFunction: true
      },
      
      propertyBlacklist = {
        // Hmm. jQuery doesn't seem to like animating these. Investigate.
        borderWidth: true,
        borderBottomWidth: true
      },
      
      propProps = ('color, fontSize, fontWeight, letterSpacing, lineHeight, textIndent, textShadow, verticalAlign, wordSpacing, backgroundColor, backgroundPosition, backgroundImage, borderColor, borderSpacing, ' +
                   'borderWidth, clip, crop, height, minHeight, maxHeight, marginTop, marginLeft, marginRight, marginBottom, opacity, outlineWidth, outlineOffset, outlineColor, ' +
                   'paddingTop, paddingRight, paddingBottom, paddingLeft, width, maxWidth, minWidth, bottom, top, left, right, visibility, zIndex, zoom'),
      
      // Splits strings of the form "prop, duration, timingFn[, delay]"
      rtransition = /([a-z\-]+)\s+(\d+[ms]+)\s+([a-z\-]+(?:\(\s*(?:\d+\s*,\s*)*\d+\s*\))?)(?:\s+(\d+[ms]+))?\s*/g,
      rtimingfunction = /([a-z\-]+(?:\([\d\.,\s]+\))?)/g,
      
      // Timing function definitions from the CSS specification
      easing = {
        'linear': [0, 0, 1, 1],
        'ease': [0.25, 0.1, 0.25, 1],
        'ease-in': [0.42, 0, 1, 1],
        'ease-out': [0, 0, 0.58, 1],
        'ease-in-out': [0.42, 0, 0.58, 1]
      };
  
  
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
    function sampleCurveY(t) { return ((ay*t+by)*t+cy)*t; };
    function sampleCurveDerivativeX(t) { return (3.0*ax*t+2.0*bx)*t+cx; };

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
      	t2=(t1-t0)*.5+t0;
      }
      
      return t2; // Failure.
    };

    function solve(x,epsilon) {
    	return sampleCurveY(solveCurveX(x, epsilon));
    };

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
  
  function parseTransition(node) {
    var prop = jQuery.prefix('transition'),
        properties = jQuery.css(node, prop + 'Property'),
        durations, delays;
    
    // Opera has a nasty habit of reporting empty strings for its
    // transition styles, even if the CSS is bona-fide. There's not
    // a great deal we can do about that.
    if (!properties || properties === 'none') { return; }
    
    if (properties === 'all') {
      // Shortcut outta here when the transition set on everything
      // yet has no duration.
      if ((parseFloat(durations = jQuery.css(node, prop + 'Duration')) + parseFloat(delays = jQuery.css(node, prop + 'Delay'))) === 0) {
        return;
      }
      else {
        properties = propProps;
      }
    }
    
    return parseTransitionCSS(
      properties,
      durations || jQuery.css(node, prop + 'Duration'),
      jQuery.css(node, prop + 'TimingFunction'),
      delays || jQuery.css(node, prop + 'Delay')
    );
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
        obj, obj2, props, time;
    
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
      console.log(
        getStyle(node, 'transition-property') + ' ' + properties,
        getStyle(node, 'transition-duration') + ' ' + durations,
        getStyle(node, 'transition-timing-function') + ' ' + timingFns,
        getStyle(node, 'transition-delay') + ' ' + delays
      );
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
  
  function parseStyle(node, style) {
    var obj = {},
        l = style.length,
        prop;
    
    while (l--) {
      prop = style[l];
      if (autoProps[prop] || transProps[prop]) {
        obj[prop] = style[prop];
      }
    }
    
    return obj;
  }
  
  function removeTransition(node, data) {
    var style = (data && data.styleCSS),
        prop, jolt;
    
    node.style[jQuery.prefix('transition')] = 'none';
    
    for (prop in data.autos) {
      node.style[prop] = style && data.styleCSS[prop] || '';
    }
    
    // Force a reflow
    jolt = node.clientWidth;
    
    node.style[jQuery.prefix('transition')] = style && data.styleCSS[jQuery.prefix('transition')] || '';
    
    clearTimeout(data.timer);
    data.timer = null;
    
    jQuery.removeData(node, 'transition');
    jQuery.event.remove(node, support.transitionEnd, transitionend);
    if (debug) { console.log('[transition] Transition ended target:', node.id + '.' + node.className.split(/\s+/).join('.')); }
    
    // Call the transition end callback
    data.fn && data.fn.apply(node);
  }
  
  function transitionend (e) {
    var node = e.currentTarget,
        data = e.data;
    
    if (e.target !== node) { return; }
    
    if (debug) { console.log('[transition] transitionend:', e.propertyName); }
    
    // Remove property from transition data and decrement length
    delete data.properties[e.propertyName];
    data.length--;
    
    // When the last property has finished transitioning...
    if (!data.length) {
      removeTransition(node, data);
    }
  }
  
  function mergeData(node, newData, curData) {
    var newProps = newData.properties,
        curProps = curData.properties,
        prop;
    
    clearTimeout(curData.timer);
    curData.timer = null;
    
    // Delete properties from curProps that don't exist in newProps,
    // removing any auto properties from the style attribute.
    for (prop in curProps) {
      if (!newProps[prop]) {
        if (autoProps[prop]) {
          jQuery.style(node, prop, curData.styleCSS[prop] || '');
        }
        delete curProps[prop];
      }
    }
    
    // Add new properties to curProps
    jQuery.extend(curProps, newProps);
    
    // Maintain data
    curData.length = newData.length;
    
    if (newData.end > curData.end) {
      curData.end = newData.end;
    }
    
    return curData;
  }
  
  function makeMethod(add, remove) {
    return function(classes, fn) {
      var node = this[0],
          elem = jQuery(node),
          autos = {},
          currentData = jQuery.data(node, 'transition'),
          prop, l, data, width, style, endCSS, currentCSS, jolt, value;
      
      if (currentData) {
        if (debug) { console.log('[transition] Transition in progress.'); }
        
        // There is a transition taking place already. This means we have
        // to tread carefully. Start by measuring all currently transitioning
        // properties before we even think about adding any classes.
        currentCSS = {};
        
        for (prop in autoProps) {
          currentCSS[prop] = jQuery.css(node, prop) ;
        }
      }
      
      // Add classes
      add.call(elem, classes);
      
      // test for transition declaration
      data = parseTransition(node);
      
      // If a transition does not exist, get outta here
      if (!data) {
        if (debug) { console.log('[transition] No transition for classes:', classes); }
        
        if (currentData) { removeTransition(node, currentData); }
        fn && fn.apply(node);
        return this;
      }
      
      if (debug) { console.log('[transition] Transition start target:', node.id + '.' + node.className.split(/\s+/).join('.'), 'properties:', Object.keys(data.properties).join(' ')); }
      
      if (currentData) {
        // merge data with currentData
        data = mergeData(node, data, currentData);
      }
      else {
        style = node.style;
        
        // Store data
        jQuery.data(node, 'transition', data);
        
        // Store the style attribute
        data.styleCSS = (style.length && parseStyle(node, style));
      }
      
      // Test for auto properties
      for (prop in data.properties) {
        if (autoProps[prop]) { autos[prop] = true; }
      }
      
      data.autos = autos;
      data.fn = fn;
      
      endCSS = {};
      
      // Set class 'notransition'
      jQuery.style(node, jQuery.prefix('transition'), 'none');
      
      // Measure properties for end CSS values
      for (prop in autos) {
        // If we are interrupting a transition, set the style
        // back to the original style before measuring.
        if (currentData) {
          node.style[prop] = data.styleCSS && data.styleCSS[prop] || '';
        }
        
        endCSS[prop] = jQuery.css(node, prop);
      }
      
      // Remove classes
      remove.call(elem, classes);
      
      jolt = node.clientWidth;
      
      // Measure properties for start CSS values and if they are identical
      // to measured end values, delete these properties, as they will not
      // transition, else if they are auto properties set them directly on
      // the node.
      for (prop in autos) {
        value = currentCSS && currentCSS[prop] || jQuery.css(node, prop);
              
        jQuery.style(node, prop, value);
        
        if (value === endCSS[prop]) {
          data.length--;
          delete data.properties[prop];
        }
      }
      
      // Force reflow
      jolt = node.clientWidth;
    
      // Remove class 'notransition'
      jQuery.style(node, jQuery.prefix('transition'), data.styleCSS && data.styleCSS[jQuery.prefix('transition')] || '');
      
      // set end CSS values
      for (prop in endCSS) {
        jQuery.style(node, prop, endCSS[prop]);
      }
      
      // Add classes
      add.call(elem, classes);
      
      // Set a safety removal in case transitionend does not get called,
      // which could happen if non-auto values don't change, which we don't
      // test for.
      data.timer = setTimeout(function() {
        if (debug) { console.log('[transition] TIMEOUT! It\'s not the end of the world.'); }
        
        removeTransition(node, data);
      }, data.end + 40);
      
      // Bind transition end
      jQuery.event.add(node, support.transitionEnd, transitionend, data);
      
      // Return this back to the chain
      return this;
    };
  }
  
  
  var handleProp = {
    visibility: function(node, prop, css, options, trans) {
      var fn;
      
      if (jQuery(node).css(prop) === 'hidden') {
        fn = options.complete;
        
        // Keep the node visible until the end of the transition.
        jQuery(node).css({ visibility: 'visible' });
        
        // Duck tape options.complete to remove visibility rule.
        options.complete = function() {
          jQuery(node).css({ visibility: '' });
          fn && fn.apply(this);
        };
      }
    },
    
    _default: function(node, prop, css, options, trans) {
      css[prop] = parseInt(jQuery(node).css(prop));
      options.specialEasing[prop] = trans.timingFn;
    }
  };
  
  
  function makeFallback(doClass, undoClass) {
    return function(classes, fn) {
      var node = this[0],
          elem = this,
          obj, css, style, options, prop, properties;
      
      doClass.call(this, classes);
      
      if (jQuery.support.transition === false && (obj = parseTransitionIE(node))) {
        // Right on! We may not have transition support, but we can read
        // the CSS! I think we can fall back to jQuery, don't you?
        
        jQuery.support.transitionEnd = 'jqueryTransitionEnd';
        
        css = {};
        style = this.attr('style');
        properties = obj.properties;
        options = {
          queue: true,
          specialEasing: {},
          complete: function() {
            // Remove the transition class and reset the style attribute
            // to it's pre-animated state. In an ideal world, the elem will
            // remain the same because we have just animated to it.
            //elem.removeClass(transitionClass);
            
            if (style) { elem.attr('style', style); }
            else { elem.removeAttr('style'); }
            
            elem.trigger({type: 'jqueryTransitionEnd', propertyName: ''});
            
            fn && fn.apply(this);
          },
          // For now, we don't support delay or multiple durations
          duration: obj.end
        };
        
        for (prop in properties) {
          if (propertyBlacklist[prop]) { continue; }
          (handleProp[prop] || handleProp._default)(node, prop, css, options, properties[prop]);
        }
        
        undoClass.call(this, classes);
        
        if ('opacity' in properties) {
          // IE7 needs to be spanked hard to force opacity animations to work.
          elem.css({ 'filter': 'alpha(opacity='+(elem.css('opacity')*100)+')' });
        }
        
        elem.animate(css, options);
        doClass.call(elem, classes);
      }
      else {
        fn && fn.apply(elem);
        return elem;
      }
    };
  }
  
  var addClass = jQuery.fn._addClass = jQuery.fn.addClass,
      removeClass = jQuery.fn._removeClass = jQuery.fn.removeClass;
  
  if (jQuery.support.transitionEnd) {
    // Include propertyName in event properties copied to jQuery
    // event object.
    if (jQuery.event.props.indexOf("propertyName") < 0) {
      jQuery.event.props.push("propertyName");
    }
    
    jQuery.fn.addTransitionClass = makeMethod(addClass, removeClass);
    jQuery.fn.removeTransitionClass = makeMethod(removeClass, addClass);
  }
  else {
    jQuery.fn.addTransitionClass = makeFallback(addClass, removeClass);
    jQuery.fn.removeTransitionClass = makeFallback(removeClass, addClass);
  }
});