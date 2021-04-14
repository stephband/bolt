
/** <overflow-toggle>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<overflow-toggle>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="bolt/elements/overflow-toggle.js"></script>

<overflow-toggle show="Show" hide="Hide">
   Crunchum ipsum dolor sit coder void, constructor function, sed do while loop 
   python orientation semi colon incident. Duis aute irure indent tabs or spaces 
   velit esse cilium buntum how crunchy duntum. Excepteur tranquilis syntax 
   error memorandum qui officia nostrud operating system alertus.
</overflow-toggle>
```

An `overflow-toggle` is collapsed by default to it's own `max-height`. A `max-height`
*must* be set for `overflow-toggle` to collapse! When toggled open, that `max-height` 
is overridden to include the whole height of the content, and the state is 
transitioned from closed to open via CSS.
**/

import element     from '../../dom/modules/element.js';
import events      from '../../dom/modules/events.js';
import create      from '../../dom/modules/create.js';
import styles      from '../../dom/modules/styles.js';
import Distributor from '../../dom/modules/distributor.js';
import parseValue, { rem } from '../../dom/modules/parse-value.js';

const $ = Symbol('');

const config = {
    path: window.customElementStylesheetPath || '',
    showText: 'Show more',
    hideText: 'Show less'
};


/* Element */

function update(shadow, button, scrollHeight, maxHeight, state) {
    if (scrollHeight > maxHeight) {
        if (!state) { shadow.appendChild(button); }
        return true;
    }
    
    if (state) { button.remove(); }
    return false;
}

element('overflow-toggle', {
    /*
    Create a DOM of the form:
    <link rel="stylesheet" href="/source/bolt/elements/overflow-toggle.shadow.css" />
    <slot></slot>
    <button></button>
    */

    construct: function(shadow) {
        const link  = create('link', { rel: 'stylesheet', href: config.path + 'overflow-toggle.shadow.css' });
        const style = styles(':host', shadow)[0];
        const slot  = create('slot');

        shadow.appendChild(link);
        shadow.appendChild(slot);

        /**
        ::part(button)
        The toggle button that, when clicked, shows and hides overflowing content.
        **/
        const button = create('button', { part: "button", type: "button", name: "overflow-toggle" });

        const changes = Distributor();
        slot.addEventListener('slotchange', changes);

        button.addEventListener('click', (e) => {
            this.open = !this.open;
        });

        this[$] = { button, changes, element: this, slot, style };
    },

    load: function(shadow) {
        const view = this[$];
        const { button, slot } = view;
        const style = getComputedStyle(this);
        const maxHeight = parseValue(view.maxHeight || style['max-height']);
        
        // maxHeight is cached on view when element is open
        var state = update(shadow, button, slot.scrollHeight, maxHeight, false);
        events('resize', window)
        .each((e) => {
            const maxHeight = parseValue(view.maxHeight || style['max-height']);
            state = update(shadow, button, slot.scrollHeight, maxHeight, state)
        });
    },

    properties: {
        show: {
            /**
            show=""
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
            hide=""
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
            A boolean attribute describing the state of the `overflow-toggle`.
            **/

            attribute: function(value) {
                this.open = value !== null;
            },

            /**
            .open = false
            A boolean property describing the state of the `overflow-toggle` – `true`
            when the `overflow-toggle` is open, `false` when it is not.
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
                    const scrollHeight    = slot.scrollHeight;
                    const computedElement = getComputedStyle(this);
                    const computedButton  = getComputedStyle(button);
                    const px = scrollHeight
                        // plus button height
                        + button.clientHeight 
                        // plus button margins
                        + parseValue(computedButton['margin-top']) 
                        + parseValue(computedButton['margin-bottom'])
                        // plus a sneaky safety margin, no-one will notice
                        + 8 ;

                    // Store maxHeight while element is open
                    view.maxHeight = computedElement['max-height'];
                    style.setProperty('max-height', rem(px), 'important');
                    button.textContent = view.hideText;
                    this.setAttribute('open', '');
                }
                else {
                    view.maxHeight = undefined;
                    style.setProperty('max-height', '');
                    button.textContent = view.showText;
                    this.removeAttribute('open');
                }
            }
        }
    }
});
