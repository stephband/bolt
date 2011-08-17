/**
 * Note that this script is intended to be included at the *end* of the document, before </body>
 */ 
(function (window, document) {
if ('open' in document.createElement('details')) return; 


 
// made global by myself to be reused elsewhere
var addEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false);
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          addEvent(el[i], type, fn);
        }
      }
    };
  }
})();
  
 
/** details support - typically in it's own script */
// find the first /real/ node
function firstNode(source) {
  var node = null;
  if (source.firstChild.nodeName != "#text") {
    return source.firstChild; 
  } else {
    source = source.firstChild;
    do {
      source = source.nextSibling;
    } while (source && source.nodeName == '#text');
 
    return source || null;
  }
}
 
function isSummary(el) {
  var nn = el.nodeName.toUpperCase();
  if (nn == 'DETAILS') {
    return false;
  } else if (nn == 'SUMMARY') {
    return true;
  } else {
    return isSummary(el.parentNode);
  }
}
 
function toggleDetails(event) {
  // more sigh - need to check the clicked object
  var keypress = event.type == 'keypress',
      target = event.target || event.srcElement;
  if (keypress || isSummary(target)) {
    if (keypress) {
      // if it's a keypress, make sure it was enter or space
      keypress = event.which || event.keyCode;
      if (keypress == 32 || keypress == 13) {
        // all's good, go ahead and toggle
      } else {
        return;
      }
    }
 
    var open = this.getAttribute('open');
    if (open === null) {
      this.setAttribute('open', 'open');
    } else {
      this.removeAttribute('open');
    }
    
    // this.className = open ? 'open' : ''; // Lame
    // trigger reflow (required in IE - sometimes in Safari too)
    setTimeout(function () {
      document.body.className = document.body.className;
    }, 13);
    
    if (keypress) {
      event.preventDefault && event.preventDefault();
      return false;
    }
  }
}
 
function addStyle() {
  var style = document.createElement('style'),
      head = document.getElementsByTagName('head')[0],
      key = style.innerText === undefined ? 'textContent' : 'innerText';
      
  var rules = ['details[open] summary:before {content: "\u25BC";} details summary:before {content: "\u25B6";} details{display: block;}','details > *{display: none;}','details.open > *{display: block;}','details[open] > *{display: block;}','details > summary:first-child{display: block;cursor: pointer;}','details[open]{display: block;}'];
      i = rules.length;
  
  style[key] = rules.join("\n");
  head.insertBefore(style, head.firstChild);
}



 
var details = document.getElementsByTagName('details'), 
    wrapper,
    i = details.length, 
    j,
    first = null, 
    label = document.createElement('summary');
 
label.appendChild(document.createTextNode('Details'));
 
while (i--) {
  first = firstNode(details[i]);
 
  if (first != null && first.nodeName.toUpperCase() == 'SUMMARY') {
    // we've found that there's a details label already
    console.log("we've found that there's a details label already");
    
  } else {
	  console.log("we've found that there's NO details label already");
    // first = label.cloneNode(true); // cloned nodes weren't picking up styles in IE - random
    first = document.createElement('summary');
    first.appendChild(document.createTextNode('Details'));
    if (details[i].firstChild) {
      details[i].insertBefore(first, details[i].firstChild);
    } else {
      details[i].appendChild(first);
    }
  }
  
  // TODO: ADD DISCLOSURE WIDGET
  
  var widget = document.createElement("span");
  widget.className = "widget";
  var widget_fill = document.createTextNode("\240");
  widget.appendChild(widget_fill);

 
  // this feels *really* nasty, but we can't target details :text in css :(
  j = details[i].childNodes.length;
  while (j--) {
	  console.log("details[i].childNodes[j].nodeName = " + details[i].childNodes[j].nodeName);
	  console.log("details[i].childNodes[j].nodeValue = " + details[i].childNodes[j].nodeValue);
    if (details[i].childNodes[j].nodeName === '#text' && (details[i].childNodes[j].nodeValue||'').replace(/\s/g, '').length) {
		console.log("creating element text");
      wrapper = document.createElement('text');
      wrapper.appendChild(details[i].childNodes[j]);
      details[i].insertBefore(wrapper, details[i].childNodes[j]);
    }
    
    if(details[i].childNodes[j].nodeName === 'SUMMARY'){
		
		summary_child_count = details[i].childNodes[j].childNodes.length;
		
		if(summary_child_count === 1){
			var inserted_widget = details[i].childNodes[j].insertBefore(widget, details[i].childNodes[j].childNodes[0]);
		}
		
	}
    
  }
  
  first.legend = true;
  first.tabIndex = 0;
}
 
// trigger details in case this being used on it's own
// document.createElement('details'); // Useless in FF . ????
addEvent(details, 'click', toggleDetails);
addEvent(details, 'keypress', toggleDetails);
addStyle();

 
})(window, document);
