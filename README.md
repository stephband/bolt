# Bolt

This repository contains source code and documentation for Bolt:

<a href="https:/stephen.band/bolt">stephen.band/bolt</a>

<!--
## Set up

To develop this project you must first have <a href="https://git-scm.com/">git</a> and <a href="https://nodejs.org">Node.js</a> (>15.1, to support ES6 imports) installed.
You also need two other dependency repos as well as the bolt repo.

```
git clone git@github.com:stephband/fn.git
git clone git@github.com:stephband/dom.git
git clone git@github.com:stephband/bolt.git
cd bolt
```

Clones the `fn`, `dom` and `bolt` repositories to your local file system, and `cd`s into the `bolt` directory.

```
npm install
```

Installs `package.json` dependencies into `node_modules/`.

## Development

```
npm run build
```

Runs all build processes (see below for individual processes) to generate packaged CSS and JS, and servable HTML files. 

```
npm run watch
```

Watches for changes to `*.html.bolt` files and builds them to `*.html` files.

```
npm run serve
```

Starts a local server at [localhost](http://127.0.0.1:8080).

## More commands

Published files are built from JS inside `modules/` and `components/`, CSS inside `css/` and `components/`, and also JS modules and styles found inside the git submodules `bolt/`, `fn/` and `dom/`. Published files are packaged, they have no dependencies.

```
npm run build-module
```

Builds JS module from `module.js` to `module.rolled.js`.

```
npm run build-sass
```

Builds CSS from SASS files. Very little SASS is used in this project, just enough to generate a responsive grid system. If you change the grid you should regenerate the CSS: normally you will not need to run this command.

```
npm run build-css
```

Builds and minifies CSS from `module.css` to `bolt.css` and `bolt.min.css`.

```
npm run build-html
```

Builds documentation from `*.html.bold` to `*.html` files.
-->
