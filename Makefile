DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: modules literal slide-show overflow-toggle

# Must format with tabs not spaces
literal:
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable --no-check https://cdn.jsdelivr.net/gh/stephband/literal@main/deno/make-literal.js ./ debug
