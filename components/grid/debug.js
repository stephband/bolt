(function(window) {
	"use strict";

	var html = ''
	+ '<input type="checkbox" id="grid-debug-input" />'
	+ '<label class="debug-switch switch" for="grid-debug-input">Grid</label>';

	var grid = ''
	+ '<div class="debug-grid-block grid-block block" id="grid-debug-block">'
	+   '<div class="block grid-1/6"></div>'
	+   '<div class="block grid-1/6"></div>'
	+   '<div class="block grid-1/6"></div>'
	+   '<div class="block grid-1/6"></div>'
	+   '<div class="block grid-1/6"></div>'
	+   '<div class="block grid-1/6"></div>'
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
		var block    = document.getElementById('grid-debug-block');

		if (!block) {
			block = fragmentFromString(grid);
			document.body.appendChild(block);
		}

		var fragment = fragmentFromString(html);
		block.before(fragment);
	});
})(this);
