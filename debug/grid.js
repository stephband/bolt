(function(window) {
	"use strict";

	var html = ''
	+ '<input type="checkbox" id="grid-debug-input" />'
	+ '<label class="debug-switch switch" for="grid-debug-input">Grid</label>'
	+ '<div class="debug-grid-block grid-block block" id="grid-debug-block">'
	+   '<div class="block grid-1/4 @1-grid-1/4"></div>'
	+   '<div class="block grid-1/4 @1-grid-1/4"></div>'
	+   '<div class="block grid-1/4 @1-grid-1/4"></div>'
	+   '<div class="block grid-1/4 @1-grid-1/4"></div>'
	+ '</div>';

	var ready = new Promise(function(accept, reject) {
		function handle() {
			document.removeEventListener('DOMContentLoaded', handle);
			window.removeEventListener('load', handle);
			accept(document);
		}

		document.addEventListener('DOMContentLoaded', handle);
		window.addEventListener('load', handle);
	});

	function fragmentFromString(html) {
		var template = document.createElement('template');
		template.innerHTML = html;
		return template.content;
	}

	ready.then(function(document) {
		var fragment = fragmentFromString(html);
		document.body.appendChild(fragment);
	});
})(this);
