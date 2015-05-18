# Bolt

A library of front end classes.

## Cloning

Bolt has submodules. You're probably going to want to clone it with the recursive flag:

    git clone --recursive git@github.com:stephband/bolt.git


## Principles

Bolt sets up a useful baseline for building interfaces on top of.

* Normalises for usefuleness. Bolt sets the box model to border-box across the board.
* Descriptive classes define layout techniques and interactives.
* Optional typography stylesheets set up a vertical rhythm.
* No floats. Inline-blocks are preferred over floats for horizontal layout, leaving floats to be used what they were desgned for. Floating.
* No colour. Themes change between projects, layout techniques generally don't.
* Clean CSS. IE hacks are included as seperate stylesheets.


## Layout classes

### .wrap

A container that automatically centres itself horizontally. Acts as a position parent.

The main wrap for a site is often called .site_wrap. Because all site_wraps will have the same width, content can be split into multiple site_wraps but still retain the look of being in one 'column'. Splitting content areas like this is great for responsively, because it allows for repositioning of various regions at different viewport sizes.

### .layer

A layer will fill it's position parent. Typically, it is used behind a .dialog to cover the page behind. Layers are absolutely positioned, so they are not in the flow. By default a layer is scrollable, in case the content put inside it is too big for it.

### .block

.block is for layout. There are two ways a block is styled: as a block, for a vertical layout, or as inline-block, for a horizontal layout. Nomally blocks start with vertical layout in a narrow viewport and switch to horizontal when the viewport is wider:

There are techniques for changing the block order of inline-blocks using a combination of left, margin-left, width and margin-right rules. These can appear hairy to the unwary, so f you are going to use these, you must comment your styles to explain what's going on.

### .index

.index resets the default styles of a list such as a &lt;ul&gt;, &lt;ol&gt; or &lt;dl&gt;, enabling them for use as lists or grids of thumbs, button or whatever.

&lt;li&gt;s inside of lists are considered as part of their parents containers, so they are always styled with a child selector that associates them to the index:

    .buttons_index > li {
        margin-bottom: 0.4em;
    }

### .card

A component that describes a profile of a person or object, typically with a thumb, title and description.

### .thumb

A thumb hides it's inner text, displaying only it's background-image. Overflow is hidden and padding-top is used to determine it's height.

### .button

Buttons have centred text with automatic ellipsis.

## Interactive classes

### .dialog

> Include bolt.dialog.js

### .popdown, .dropdown

> Include bolt.dropdown.js

For making menus and whatnot. Popdowns close when clicked outside, whereas dropdowns also close when clicked.

### .slide

> Include bolt.slide.js

A block that slides to reveal it's sibling.

### .tab

> Include bolt.tab.js

A block that fades to reveal it's sibling.

### .tip

> Include bolt.tip.js

A tip is hidden by default, and made visible when hovering over something that references it by id.

## Utility classes

### .clear

The ubiqiutous clearfix class

### .scroll, .x_scroll, .y_scroll

Force scrollbar display

## State classes

State classes should never be styled directly, as they are applied to indicate the state of some other class.

/* State classes:
   
### .loading

State of items requested from a server

### .active

On/off state for .tab, .slide, .dropdown, .dialog-layer, .tip and other interactive classes

### .error

Used in forms to style blocks or inputs when an input has errors.

### .xxx_support

Applied to the <html> element to flag CSS support.




