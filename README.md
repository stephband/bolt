# Bolt

A library of front end classes.

## Cloning

Bolt has submodules. You're probably going to want to clone it with the recursive flag:

    git clone --recursive git@github.com:stephband/bolt.git


## Principles

* Styles are defined in short, readable and extensible classes.
* The border-box model keeps us sane.
* Context is used for positioning.
* Inline-blocks are preferred over floats for horizontal layout.


## Classes

### .wrap

A container that automatically centres itself horizontally. Acts as a position parent.

The main wrap for a site is often called .site_wrap. Because all site_wraps will have the same width, content can be split into multiple site_wraps but still retain the look of being in one 'column'. Splitting content areas like this is great for responsively, because it allows for repositioning of various regions at different viewport sizes.


### .layer

A layer will fill it's position parent. Typically, it is used behind a .dialog to cover the page behind. Layers are absolutely positioned, so they are not in the flow. By default a layer is scrollable, in case the content put inside it is too big for it.


### .block

.block is for layout. There are two principle ways a block can be styled: as a block, for a vertical layout, or as inline-block, for a horizontal layout. Nomally blocks start with vertical layout in a narrow viewport and switch to horizontal when the viewport is wider:

There are techniques for changing the block order of inline-blocks using a combination of left, margin-left, width and margin-right rules. These can appear hairy to the unwary, so f you are going to use these, you must comment your styles to explain what's going on.


### .index

.index resets the default styles of a list such as a &lt;ul&gt;, &lt;ol&gt; or &lt;dl&gt;, enabling there use for things like lists of buttons, lists of thumbnails.

&lt;li&gt;s inside of lists are considered as part of their parents containers, so they are always styled with a child selector that associates them to the index:

.buttons_index > li {
	margin-bottom: 0.4em;
}


### .dialog


### .slide

A block that slides to reveal it's sibling.


### .tab

A block that fades to reveal it's sibling.


### .card

A component that describes a profile of a person or object, typically with a thumb, title and description.


### .thumb

A thumb hides it's inner text, displaying only it's background-image. Overflow is hidden and padding-top is used to determine it's height.


### .button

Buttons have centred text with automatic ellipsis.


### .tip

A tip is hidden by default, and made visible when hovering over something that references it by id. Requires bolt.tip.js.