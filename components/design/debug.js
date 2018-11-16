
var store = window.localStorage;

var html = ''
+ '<input type="checkbox" id="design-debug-input" />'
+ '<label class="design-debug-switch debug-switch switch" for="design-debug-input">Design</label>'
+ '<div class="design-debug-layer debug-layer layer" id="design-debug-layer"></div>'
+ '<div class="design-debug-block debug-block" id="design-debug-block">'
+   '<input type="text"     id="design-path-input" placeholder="URL" />'
+   '<input type="number"   id="design-width-input" placeholder="Width (px)" />'
+   '<input type="range"    id="design-opacity-input" min="0" max="1" step="0.01" title="Opacity" />'
+   '<input type="checkbox" id="design-overlay-input" title="Render over page content" /> overlay'
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

	var layer        = document.getElementById('design-debug-layer');
	var pathInput    = document.getElementById('design-path-input');
	var opacityInput = document.getElementById('design-opacity-input');
	var widthInput   = document.getElementById('design-width-input');
	var overlayInput = document.getElementById('design-overlay-input');

	function update(path, width, opacity, overlay) {
		layer.style.backgroundImage = "url('" + path + "')";
		if (width) { layer.style.backgroundSize  = width + "px auto"; }
		layer.style.opacity         = "" + opacity;
		layer.style.zIndex          = overlay ? '100000' : '-1' ;
	}

	function change(e) {
		var path    = pathInput.value;

		if (!path) {
			update('', '', 0.5, false);
			store.removeItem(window.location.href + '');
			return;
		}

		var width   = widthInput.value && parseInt(widthInput.value, 10);
		var opacity = opacityInput.value;
		var overlay = !!overlayInput.checked;

		update(path, width, opacity, overlay);
		store.setItem(window.location.href + '', JSON.stringify({
			path: path,
			width: width,
			opacity: opacity,
			overlay: overlay
		}));
	}

	pathInput.addEventListener('change', change);
	widthInput.addEventListener('input', change);
	opacityInput.addEventListener('input', change);
	overlayInput.addEventListener('change', change);

	var data = store.getItem(window.location.href);

	if (data) {
		data = JSON.parse(data);
		pathInput.value      = data.path;
		widthInput.value     = data.width;
		opacityInput.value   = data.opacity;
		overlayInput.checked = !!data.overlay;
		update(data.path, data.width, data.opacity, !!data.overlay);
	}
});
