DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: modules literal

# Must format with tabs not spaces
literal:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable ../literal/generate.js ./ debug

modules:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ../fn/deno/make-modules.js build elements/overflow-toggle.js elements/slide-show.js elements/slide-show.css elements/slide-show.shadow.css elements/overflow-toggle.css elements/overflow-toggle.shadow.css

slide-show:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js packaged elements/slide-show.js elements/slide-show.css elements/slide-show.shadow.css

overflow-toggle:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./deno/modules.js packaged elements/overflow-toggle.js elements/overflow-toggle.css elements/overflow-toggle.shadow.css
