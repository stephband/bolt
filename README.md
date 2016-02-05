# Bolt

A library of front end classes. <a href="http://stephen.band/bolt">Bolt</a> sets up a baseline for building interfaces.

* Normalises for usefuleness. Bolt sets the box model to border-box across the board.
* Descriptive base classes define layout techniques (.block, .button, &hellips;) and interactive actions (.slide, .tab, &hellips;).
* Text stylesheets set up a vertical rhythm.
* Flexible, nestable and responsive horizontal grid.
* No colour. Themes change between projects, layout techniques generally don't.
* Styleguide generated from KSS comments.

## Getting started

Clone the repo:

    git clone git@github.com/stephband/bolt.git
    cd bolt/

Install node modules:

    npm install

Build <code>docs/</code>:

    gulp kss

Build <code>package</code> from <code>css/</code> and <code>js/</code>:

    gulp

## Documentation

Read the documentation at <a href="http://stephen.band/bolt">stephen.band/bolt/</a>.
