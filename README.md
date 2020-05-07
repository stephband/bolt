# Bolt

A library of front end classes. <a href="http://stephen.band/bolt">Bolt</a> sets up a baseline for building flexible interfaces.

* Normalises for usefuleness. Bolt sets the box model to border-box across the board.
* Descriptive base classes define layout techniques (.block, .button, .flex, .grid, .table, &hellips;).
* Text stylesheet and the grid component set up a vertical rhythm.
* Flexible, nestable and responsive horizontal grid component.
* No colour. Themes change between projects while layout techniques generally don't. Bolt focuses on layout techniques.
* Styleguide generated from KSS comments.

## Latest build 2.0.0

* <a href="http://stephen.band/bolt/style.min.css">http://stephen.band/bolt/style.min.css</a> (~125k)
* <a href="http://stephen.band/bolt/style.min.css">http://stephen.band/bolt/style.min.css</a> (~85k)

## Getting started

Clone the repo:

    git clone git@github.com/stephband/bolt.git
    cd bolt/

Install node modules:

    npm install

Compile SASS:

    npm run sass

Build <code>dist/bolt.css</code>:

    npm run build

Build <code>styleguide/</code> from KSS comments found in CSS files:

    npm run styleguide

## Documentation

Currently scant documentation at <a href="http://stephen.band/bolt">stephen.band/bolt/index.html</a>.
