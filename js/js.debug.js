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
		styles: function() {
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
			
			var classNames = Object.keys(classes).sort(function(a, b) {
				var baseA = /(?:([^_]+)_)?(?:([^_]+)_)?(?:([^_]+)_)?([^_]+)$/.exec(a),
						baseB = /(?:([^_]+)_)?(?:([^_]+)_)?(?:([^_]+)_)?([^_]+)$/.exec(b);
				
				// Time to get recursive
				
				if (baseA[4] === baseB[4]) {
					if (baseA[3] === baseB[3]) {
						if (baseA[2] === baseB[2]) {
							if (baseA[1] === baseB[1]) {
								
							}
							else if (([baseA[1], baseB[1]]).sort()[0] === baseA[1]) { return -1; }
							else { return 1; }
						}
						else if (([baseA[2], baseB[2]]).sort()[0] === baseA[2]) { return -1; }
						else { return 1; }
					}
					else if (([baseA[3], baseB[3]]).sort()[0] === baseA[3]) { return -1; }
					else { return 1; }
				}
				else if (([baseA[4], baseB[4]]).sort()[0] === baseA[4]) { return -1; }
				else { return 1; }
				
				return 0;
			}),
			l = classNames.length;
			
			var logElem = jQuery('<dl/>', {'class': 'css_log log'});
			
			while (l--) {
				logElem.append((function(classNames, l, classes){
					var className = classNames[l],
							rules = classes[className],
							html = '<dt>'+className+'</dt>',
							m = rules.length,
							rule, files = {};
					
					while (m--) {
						rule = rules[m];
						file = /([^\/\?]+)(?:\?.*)?$/.exec(rule.parentStyleSheet.href)[1];
						files[file] = files[file] ? files[file] + 1 : 1 ;
					}
					
					for (file in files) {
						html += '<dd>'+file+' ('+files[file]+')</dd>';
					}
					
					return html;
				})(classNames, l, classes));
			}
			
			logElem.appendTo('body');
		}
	};
})(window);