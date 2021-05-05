DEBUG=

# Tell make to allow overwriting existing files
.PHONY: modules

# Imported from node run, must modify
literal:
	node --experimental-json-modules --no-warnings ./literal/index.js ./ debug

modules:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js packaged elements/overflow-toggle.js elements/slide-show.js elements/slide-show.css elements/slide-show.shadow.css elements/overflow-toggle.css elements/overflow-toggle.shadow.css

slide-show:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js packaged elements/slide-show.js elements/slide-show.css elements/slide-show.shadow.css

overflow-toggle:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js packaged elements/overflow-toggle.js elements/overflow-toggle.css elements/overflow-toggle.shadow.css
