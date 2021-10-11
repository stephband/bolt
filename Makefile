DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: modules literal

# Must format with tabs not spaces
literal:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable --no-check ../literal/deno/make-literal.js ./ debug

modules:
	rm -r build
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js build elements/overflow-toggle/module.js elements/slide-show/module.js elements/slide-show.css elements/slide-show/module.css elements/overflow-toggle.css elements/overflow-toggle/module.css

slide-show:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js packaged elements/slide-show/module.js elements/slide-show/module.css elements/slide-show.shadow.css

overflow-toggle:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js packaged elements/overflow-toggle.js elements/overflow-toggle.css elements/overflow-toggle.shadow.css
