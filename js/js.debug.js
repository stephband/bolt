// This file should be the first javascript included
// on the page.

// Store properties of the window object and check
// against them later to see what we have left lying
// around in the global namespace.

(function(window){
	var obj = {},
			key;
	
	if (!window.console && console.log) { return; }
	
	for (key in window) {
		if (window.hasOwnProperty(key)) {
			obj[key] = true;
		}
	}
	
	var ruleTypes = {
	    	// CSS rules
	    	1: function(rule, fn) {
	    		var selectors = rule.selectorText.split(/\s,\s/),
	    				l = selectors.length,
	    				selector;
	    		
	    		while (l--) {
	    			selector = selectors[l];
	    			selector.replace(/\.([^\s\>\+\~\.\{\,]+)/g, fn);
	    		}
	    	},
	    	// Media queries
	    	4: function(rule, fn) {
	    		
	    	},
	    	// FontFace rules
	    	5: function(rule, fn) {
	    		
	    	}
	    },
	    classes = {};
	
	window.debug = {
		globals: function() {
			for (key in window) {
				if (window.hasOwnProperty(key) && !obj[key]) {
					console.log(key);
				}
			}
		},
		classes: function() {
			var stylesheets = document.styleSheets,
			    l = stylesheets.length,
			    stylesheet, rules, m, rule;
			
			while (l--) {
				stylesheet = stylesheets[l];
				rules = stylesheet.cssRules;
				
				if (!rules) {
					console.log('rules is not defined in stylesheet:', stylesheet);
					continue;
				}
				
				m = rules.length;
				
				while (m--) {
					rule = rules[m];
					
					if (!ruleTypes[rule.type]) {
						console.log('Unknown rule type:', rule.type, rule);
						continue;
					}
					
					ruleTypes[rule.type](rule, function($0, $1) {
						if (classes[$1]) {
							classes[$1].push(rule);
						}
						else {
							classes[$1] = [rule];
						}
					});
				}
			}
			
			function sortClass(a, b, za, zb) {
				var baseA = /^(?:([\w\-]+)_)?([^_\:\[]+)(.*)$/.exec(a),
				    baseB = /^(?:([\w\-]+)_)?([^_\:\[]+)(.*)$/.exec(b),
				    xa = za || baseA[3],
				    xb = zb || baseB[3];
				
				if (baseA[2] === baseB[2]) {
					if (baseA[1] && baseB[1]) {
						return sortClass(baseA[1], baseB[1], xa, xb);
					}
					else if (!baseA[1] && !baseB[1]) {
						if (xa) {
							if (xb) {
								if (xa.length > xb.length) {
									return 1;
								}
								else {
									return -1;
								}
							}
							else {
								return 1;
							}
						}
						else if (xb) {
							return -1;
						}
					}
					else if (baseA[1]) {
						return 1;
					}
					else {
						return -1;
					}
				}
				else if (([baseA[2], baseB[2]]).sort()[0] === baseA[2]) {
					return -1;
				}
				else {
					return 1;
				}
				return 0;
			}
			
			// --------- log ---------
			
			var classNames = Object.keys(classes).sort(sortClass);
			
			l = classNames.length;
			
			var logElem = jQuery('<dl/>', {'class': 'css_log log'});
			
			jQuery('head').append('<style>'+
				'.log:after {visibility: hidden; display: block; font-size: 0; content: " "; clear: both; height: 0;}' +
				'.log dt {float:left; clear:both; width: 38%; text-align: right; margin: 0;} ' +
				'.log dd {float:right; clear:right; width: 60%; margin: 0;} ' +
				'.log .unfound {opacity: 0.6;} ' +
			'</style>');
			
			while (l--) {
				logElem.prepend((function(classNames, l, classes){
					var className = classNames[l],
							rules = classes[className],
							found = jQuery('.'+/^([^\:]+)/.exec(className)[1]),
							html = '<dt'+(!found.length ? ' class="unfound"' : '')+'>'+className+'</dt>',
							m = rules.length,
							rule, files = {};
					
					while (m--) {
						rule = rules[m];
						file = /([^\/\?]+)(?:\?.*)?$/.exec(rule.parentStyleSheet.href)[1];
						files[file] = files[file] ? files[file] + 1 : 1 ;
					}
					
					for (file in files) {
						html += '<dd'+(!found.length ? ' class="unfound"' : '')+'>'+file+' ('+files[file]+')</dd>';
					}
					
					return html;
				})(classNames, l, classes));
			}
			
			jQuery('<hr style="clear:both;"/>').appendTo('body');
			jQuery('<h1 style="width: 38%; text-align: right;">Classes</h1>').appendTo('body');
			logElem.appendTo('body');
			jQuery('<div style="clear:both;"/>').appendTo('body');
		},
		
		logEvents: function(e) {
			console.log(e.type, e);
		}
	};
})(window);