DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: modules literal slide-show overflow-toggle

# Must format with tabs not spaces
literal:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable --no-check ../literal/deno/make-literal.js ./ debug

modules:
	rm -r build
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js build elements/overflow-toggle/module.js elements/overflow-toggle.css elements/overflow-toggle/module.css

overflow-toggle:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js packaged elements/overflow-toggle.js elements/overflow-toggle.css elements/overflow-toggle.shadow.css
