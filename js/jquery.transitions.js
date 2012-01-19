// indexOf for IE

if (!Array.indexOf) {
  Array.prototype.indexOf = function (obj, start) {
    for (var i = (start || 0); i < this.length; i++) {
      if (this[i] === obj) {
        return i;
      }
    }
    return -1;
  };
}


// jQuery.prefix(property)
// 
// Returns prefixed CSS property, or unprefixed property, as
// supported by the browser. 

(function(jQuery, undefined){
  var prefixes = ['Khtml','O','Moz','Webkit','ms'],
      elem = document.createElement('div'),
      cache = {};
  
  function testPrefix(prop) {
    var upper, prefixProp, l;
    
    if (prop in elem.style) { return prop; }
    
    upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    l = prefixes.length;
    
    while (l--) {
      prefixProp = prefixes[l] + upper;
      
      if (prefixProp in elem.style) {
        return prefixProp;
      }
    }
    
    return false;
  }
  
  function prefix(prop){
    return cache[prop] || (cache[prop] = testPrefix(prop));
  }
  
  prefix.cache = cache;
  jQuery.prefix = prefix;
})(jQuery);


// jQuery.addEasing(string)
// 
// Interprets and adds easing functions to jQuery.easing
// according to the CSS spec for transition timing functions. 

(function(jQuery, undefined){
  
  // Timing function definitions from the CSS specification
  
  var easing = {
        'linear': [0, 0, 1, 1],
        'ease': [0.25, 0.1, 0.25, 1],
        'ease-in': [0.42, 0, 1, 1],
        'ease-out': [0, 0, 0.58, 1],
        'ease-in-out': [0.42, 0, 0.58, 1]
      };
  
  // Cubic bezier function purloined from
  // blogs.msdn.com/b/eternalcoding/archive/2011/12/06/css3-transitions.aspx  
  
  function makeBezier(x1, y1, x2, y2) {
    return function (t) {
      // Extract X (which is equal to time here)
      var f0 = 1 - 3 * x2 + 3 * x1,
          f1 = 3 * x2 - 6 * x1,
          f2 = 3 * x1,
          refinedT = t,
          i, refinedT2, refinedT3, x, slope;
      
      for (i = 0; i < 5; i++) {
        refinedT2 = refinedT * refinedT;
        refinedT3 = refinedT2 * refinedT;
        
        x = f0 * refinedT3 + f1 * refinedT2 + f2 * refinedT;
        slope = 1.0 / (3.0 * f0 * refinedT2 + 2.0 * f1 * refinedT + f2);
        refinedT -= (x - t) * slope;
        refinedT = Math.min(1, Math.max(0, refinedT));
      }
     
      return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 +
        3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 +
        Math.pow(refinedT, 3);
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
  
  jQuery.addEasing = addEasing;
})(jQuery);


// Infer transitionend event from CSS transition prefix and add
// it's name as jQuery.support.cssTransitionEnd.

(function( jQuery, undefined ){
	var end = {
	    	KhtmlTransition: false,
	    	OTransition: 'oTransitionEnd',
	    	MozTransition: 'transitionend',
	    	WebkitTransition: 'webkitTransitionEnd',
	    	msTransition: 'MSTransitionEnd',
	    	transition: 'transitionend'
	    },
	    
	    prefixed = jQuery.prefix('transition');
	
	jQuery.support.cssTransition = prefixed || false;
	jQuery.support.cssTransitionEnd = (prefixed && end[prefixed]);
})( jQuery );


//// ARRRRGH TEST FAILS ON THE IPHONE!!
//
//
//// Feature test for transitionend event and add it's name as
//// jQuery.support.cssTransitionEnd.
//
//(function(jQuery, undefined){
//  var debug = (window.console && window.console.log);
//  
//  var doc = jQuery(document),
//      
//      testElem = jQuery('<div/>').css({
//        // position: 'absolute' makes IE8 jump into Compatibility
//        // Mode. God knows why. Use position: 'relative'.
//        position: 'relative',
//        top: -200,
//        left: -9999,
//        width: 100,
//        height: 100,
//        WebkitTransition: 'top 0.01s linear',
//        MozTransition: 'top 0.01s linear',
//        msTransition: 'top 0.01ms linear',
//        OTransition: 'top 0.01s linear',
//        transition: 'top 0.01s linear'
//      }),
//      
//      timer;
//  
//  function removeTest() {
//    clearTimeout(timer);
//    timer = null;
//    testElem.remove();
//  }
//  
//  function transitionEnd(e) {
//    if (debug) { console.log('[jquery.transitions] Transition feature detect: PASS'); }
//    
//    // Get rid of the test element
//    removeTest();
//    
//    // Store flags in jQuery.support
//    jQuery.support.cssTransition = true;
//    jQuery.support.cssTransitionEnd = e.type;
//    
//    // Stop listening for transitionend
//    doc.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', transitionEnd);
//  }
//  
//  doc
//  .bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', transitionEnd)
//  .ready(function(){
//    var wait = setTimeout(function() {
//      clearTimeout(wait);
//      wait = null;
//      
//      // Put the test element in the body
//      testElem.appendTo('body');
//      
//      // Force the browser to reflow.
//      testElem.width();
//      
//      // Apply CSS to trigger a transition
//      testElem.css({ top: -300 });
//      
//      // Set a timeout for the transition test to finish, and if it does not,
//      // get rid of the test element. Opera requires a much greater delay
//      // than the time the transition should take, worryingly.
//      timer = setTimeout(function(){
//        removeTest();
//        
//        if (debug) { console.log('[jquery.transitions] Transition feature detect: FAIL'); }
//        
//        // Store flags in jQuery.support
//        jQuery.support.cssTransition = false;
//        jQuery.support.cssTransitionEnd = false;
//      }, 600);
//    }, 1);
//  });
//})(jQuery);



// jQuery.addTransitionClass(classes, callback)
// 
// 2.0_dev

(function(jQuery, undefined){
  var debug = (window.debug === undefined ? (window.console && window.console.log) : window.debug),
      
      doc = jQuery(document),
      
      support = jQuery.support,
      
      // Properties that could potentially have a value of 'auto'
      // or 'inherit', and need a bit of babysitting.
      
      autoProps = {
        height: true,
        width: true,
        marginLeft: true,
        marginRight: true,
        top: true,
        bottom: true,
        left: true,
        right: true,
        fontSize: true
      },
      
      transProps = {
        transition: true,
        transitionProperty: true,
        transitionDuration: true,
        transitionDelay: true,
        transitionTimingFunction: true
      },
      
      propertyBlacklist = {
        // Hmm. jQuery doesn't seem to like animating these.
        // Investigate.
        borderWidth: true,
        borderBottomWidth: true,
        visibility: true,
        opacity: true,
        top: true
      },
      
      propProps = ('color, fontSize, fontWeight, letterSpacing, lineHeight, textIndent, textShadow, verticalAlign, wordSpacing, backgroundColor, backgroundPosition, backgroundImage, borderColor, borderSpacing, ' +
                   'borderWidth, clip, crop, height, minHeight, maxHeight, marginTop, marginLeft, marginRight, marginBottom, opacity, outlineWidth, outlineOffset, outlineColor, ' +
                   'paddingTop, paddingRight, paddingBottom, paddingLeft, width, maxWidth, minWidth, bottom, top, left, right, visibility, zIndex, zoom'),
      
      // Splits strings of the form "prop, duration, easing[, delay]"
      rtransition = /([a-z\-]+)\s+(\d+[ms]+)\s+([a-z\-]+(?:\(\s*(?:\d+\s*,\s*)*\d+\s*\))?)(?:\s+(\d+[ms]+))?\s*/g,
      rtransitionclass = /(?:^|\s+)transition(?:$|\s+)/;
  
  
  function parseTransitionCSS(prop, time, ease, delay) {
    var obj = {},
        properties = {},
        end = 0,
        l, parsed;

    prop = prop.split(/,\s*/);
    time = time.split(/,\s*/);
    ease = ease.match(/([a-z\-]+(?:\([\d\.,\s]+\))?)/g);
    delay = delay.split(/,\s*/);
    
    l = prop.length;

    while (l--) {
    	// Check for empty string
      if (!prop[l]) {
      	prop.length--;
      	continue;
      }
      
      // TODO: This bit could be dodgy if we end up passing empty
      // strings into these properties. Test!
      
      parsed = {
        duration: Math.round( parseFloat(time[l] || time[time.length-1])  * (/ms$/.test(time[l] || time[time.length-1]) ? 1 : 1000 ) ),
        delay: Math.round( parseFloat(delay[l] || delay[delay.length-1]) * (/ms$/.test(delay[l] || delay[delay.length-1]) ? 1 : 1000 ) ),
        easing: ease[l] || ease[ease.length-1]
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
    
    // Opera has a nasty habit of reporting empty strings for
    // its transition styles, even if the CSS is bona-fide. There's
    // not a great deal we can do about that.
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
  
  function parseTransitionStr(str) {
    var propArr = [],
        durArr = [],
        fnArr = [],
        delArr = [],
        max, arr, l, m, val;
    
    str.replace(rtransition, function($0, prop, dur, fn, del) {
      propArr.push(jQuery.camelCase(prop));
      durArr.push(dur);
      fnArr.push(fn);
      delArr.push(del || 0);
    });
    
    max = Math.max(propArr.length, durArr.length, fnArr.length, delArr.length);
    
    arr = [propArr, durArr, fnArr, delArr];
    l = arr.length;
    
    while (l--) {
    	if (arr[l].length < max) {
    		// Fill her up with the last value
    		m = arr[l].length - 1;
    		val = arr[l][m];
    		
    		while (++m < max) {
    			arr[m] = val;
    		}
    	}
    }
    
    //jQuery.each(propArr, function(prop) {
    //	return jQuery.camelCase(prop);
    //});
    
    return parseTransitionCSS(
    	propArr.join(', '),
    	durArr.join(', '),
    	fnArr.join(', '),
    	delArr.join(', ')
    );
  }
  
  function parseTransitionIE(node) {
    if (!node.currentStyle) { return; }
    
    var prop = 'transition',
        str = (
        	// For IE6, IE7, IE8
        	node.currentStyle[prop] ||
        	// For IE9
        	(window.getComputedStyle && getComputedStyle(node, null)[prop])
        ),
        obj, obj2, props, time;
    
    if (str) {
    	obj = parseTransitionStr(str);
    }
    
    obj2 = parseTransitionCSS(
      node.currentStyle[prop + '-property'] || '',
      node.currentStyle[prop + '-duration'] || '',
      node.currentStyle[prop + '-timing-function'] || '',
      node.currentStyle[prop + '-delay'] || ''
    );
    
		if (obj && obj2) {
			// Deep extend
			jQuery.extend(true, obj, obj2);
			
			// Recalculate length and time
			props = obj.properties;
			obj.length = 0;
			obj.end = 0;
			
			for (prop in props) {
				time = props[prop].duration + props[prop].delay;
				if(time > obj.end) { obj.end = time; }
				obj.length++;
			}
		}
		else if (obj2) {
			obj = obj2;
		}
		
		if (obj) {
			for (prop in obj.properties) {
				// Add easing to jQuery's repertoire
				jQuery.addEasing(obj.properties[prop].easing);
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
    jQuery.event.remove(node, support.cssTransitionEnd, transitionend);
    node.className = node.className.replace(rtransitionclass, ' ');
    if (debug) { console.log('[jquery.transitions] Transition removed.', node, data); }
  }
  
  function transitionend (e) {
    var node = e.currentTarget,
        data = e.data;
    
    if (e.target !== node) { return; }
    
    if (debug) { console.log('[jquery.transitions] transitionend:', e.propertyName); }
    
    // Remove property from transition data and decrement length
    delete data.properties[e.propertyName];
    data.length--;
    
    if (!data.length) { removeTransition(node, data); }
    
    data.fn && data.fn.apply(node);
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
        if (debug) { console.log('Transition already happening.'); }
        
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
        if (debug) { console.log('[jquery.transitions] No transition for classes:', classes); }
        
        if (currentData) { removeTransition(node, currentData); }
        fn && fn.apply(node);
        return this;
      }
      
      if (debug) { console.log('[jquery.transitions] classes:', classes, '| properties:', Object.keys(data.properties)); }
      
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
        
        // Add class transition
        add.call(elem, 'transition');
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
        if (debug) { console.log('[jquery.transitions] TIMEOUT! It\'s not the end of the world.'); }
        
        removeTransition(node, data);
        
        fn && fn.apply(node);
      }, data.end + 40);
      
      // Bind transition end
      jQuery.event.add(node, support.cssTransitionEnd, transitionend, data);
      
      // Return this back to the chain
      return this;
    };
  }
  
  
  
  function makeFallback(add) {
    var doClass = add ? jQuery.fn.addClass : jQuery.fn.removeClass,
        undoClass = add ? jQuery.fn.removeClass : jQuery.fn.addClass;
    
    return function(classes, fn) {
      var node = this[0],
          elem = this,
          obj, css, style, options, prop;
      
      doClass.call(this, classes);
      
      if (jQuery.support.cssTransition === false && (obj = parseTransitionIE(node))) {
        // Right on! We may not have transition support, but we can read
        // the CSS! I think we can fall back to jQuery, don't you?
        //alert([obj.length, Object.keys(obj.properties).join(' '), obj.end].join(' | '));
        
        css = {};
        style = this.attr('style');
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
            
            fn && fn.apply(this);
          }
        };
        
        for (prop in obj.properties) {
        	if (propertyBlacklist[prop]) { continue; }
        	css[prop] = parseInt(jQuery(node).css(prop));
        	options.specialEasing[prop] = obj.properties[prop].easing;
        }
        
        // For now, we don't support delay or multiple durations
        options.duration = obj.end;
        
        undoClass.call(this, classes);
        this.animate(css, options);
        doClass.call(this, classes);
      }
      else {
        fn && fn.apply(this);
        return this;
      }
    };
  }
  
  // Include propertyName in event properties copied to jQuery
  // event object.
  if (jQuery.event.props.indexOf("propertyName") < 0) {
    jQuery.event.props.push("propertyName");
  }
  
  jQuery.fn.addTransitionClass = makeFallback(true);
  jQuery.fn.removeTransitionClass = makeFallback(false);
  
//  doc.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function rewrite() {
if (jQuery.support.cssTransitionEnd) {
    var addClass = jQuery.fn._addClass = jQuery.fn.addClass,
        removeClass = jQuery.fn._removeClass = jQuery.fn.removeClass;
    
    if (debug) { console.log('Rewriting methods.'); }
    
//    doc.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', rewrite);
    
    /*jQuery.fn.addClass =*/ jQuery.fn.addTransitionClass = makeMethod(addClass, removeClass);
    /*jQuery.fn.removeClass =*/ jQuery.fn.removeTransitionClass = makeMethod(removeClass, addClass);
}
//  });
})(jQuery);