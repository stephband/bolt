DEBUG=

# Tell make to allow overwriting existing files
.PHONY: modules

modules:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js hello elements/overflow-toggle.js elements/slide-show.js

slide-show:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js hello elements/slide-show.js elements/slide-show.css elements/slide-show.shadow.js

overflow-toggle:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js hello elements/overflow-toggle.js elements/overflow-toggle.css elements/overflow-toggle.shadow.css
