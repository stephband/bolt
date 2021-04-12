
/** <auto-toggle>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<auto-toggle>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="bolt/elements/auto-toggle.js"></script>

<auto-toggle show="Show" hide="Hide">
   Crunchum ipsum dolor sit coder void, constructor function, sed do while loop 
   python orientation semi colon incident. Duis aute irure indent tabs or spaces 
   velit esse cilium buntum how crunchy duntum. Excepteur tranquilis syntax 
   error memorandum qui officia nostrud operating system alertus.
</auto-toggle>
```

An `auto-toggle` is collapsed by default to it's own `max-height`. A `max-height`
*must* be set for `auto-toggle` to collapse! When toggled open, that `max-height` 
is overridden to include the whole height of the content, and the state is 
transitioned from closed to open via CSS.
**/

import element     from '../../dom/modules/element.js';
import events      from '../../dom/modules/events.js';
import create      from '../../dom/modules/create.js';
import Distributor from '../../dom/modules/distributor.js';
import { rem }     from '../../dom/modules/parse-value.js';

const $ = Symbol('');

const config = {
    path: window.customElementStylesheetPath || '',
    showText: 'Show more',
    hideText: 'Show less'
};


/* Element */

function update(element, shadow, slot, button, style) {
    const scrollHeight = slot.scrollHeight;
    const maxHeight    = style['max-height'];

    if (scrollHeight > maxHeight) {
        shadow.appendChild(button);
    }
    else {
        button.remove();
    }
}

element('auto-toggle', {
    /*
    Create a DOM of the form:
    <link rel="stylesheet" href="/source/bolt/elements/auto-toggle.shadow.css" />
    <slot></slot>
    <button></button>
    */

    construct: function(shadow) {
        const link   = create('link', { rel: 'stylesheet', href: config.path + 'auto-toggle.shadow.css' });
        const css    = create('style', ':host {}');
        const slot   = create('slot');

        /**
        ::part(button)
        The toggle button that, when clicked, shows and hides overflowing content.
        **/
        const button = create('button', { part: "button", type: "button", name: "" });

        shadow.appendChild(link);
        shadow.appendChild(css);
        shadow.appendChild(slot);
        shadow.appendChild(button);

        // Must come after css is appended        
        const style = css.sheet.cssRules[0].style;

        const changes = Distributor();
        slot.addEventListener('slotchange', changes);

        button.addEventListener('click', (e) => {
            this.open = !this.open;
        });

        this[$] = { button, changes, element: this, slot, style };
    },

    load: function(shadow) {
        const { button, slot } = this[$];
        const style = getComputedStyle(this);

        events('resize', window)
        .each((e) => update(this, shadow, slot, button, style));
    },

    properties: {
        show: {
            /**
            show="Show more"
            Text rendered into the toggle button.
            **/

            attribute: function(value) {
                const view = this[$];
                view.showText = value || config.showText;
                if (view.open) { return; }
                view.button.textContent = value || config.showText ;
            }
        },

        hide: {
            /**
            hide="Show less"
            Text rendered into the toggle button.
            **/

            attribute: function(value) {
                const view = this[$];
                view.hideText = value || config.hideText;
                if (!view.open) { return; }
                view.button.textContent = value || config.hideText ;
            }
        },

        open: {
            /**
            open=""
            A boolean attribute describing the state of the `auto-toggle`.
            **/

            attribute: function(value) {
                this.open = value !== null;
            },

            /**
            .open = false
            A boolean property describing the state of the `auto-toggle` – `true`
            when the `auto-toggle` is open, `false` when it is not.
            **/

            get: function() {
                const view = this[$];
                return view.open;
            },

            set: function(value) {
                const view = this[$];
                const { button, slot, style } = view;
 
                 // If toggle has not changed do nothing
                if (!!value === view.open) {
                    return;
                }
 
                if (value) {
                    const scrollHeight = slot.scrollHeight;
                    // Add a sneaky safety margin of 30 pixels, no-one will notice
                    style.setProperty('max-height', rem(scrollHeight + 30), 'important');
                    button.textContent = view.hideText;
                    view.open = true;
                }
                else {
                    style.setProperty('max-height', '');
                    button.textContent = view.showText;
                    view.open = false;
                }
            }
        }
    }
});
