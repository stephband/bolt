
/** <auto-toggle>

Configure stylesheet path with:

```js
window.customElementStylesheetPath = 'path/to/bolt/elements/';
```

Import `<auto-toggle>` custom element. This also registers the custom 
element and upgrades instances already in the DOM.

```html
<script type="module" src="bolt/elements/auto-toggle.js"></script>

<auto-toggle button="Show a lot more stuff">
   Crunchum ipsum dolor sit coder void, constructor function, sed do while loop 
   python orientation semi colon incident. Duis aute irure indent tabs or spaces 
   velit esse cilium buntum how crunchy duntum. Excepteur tranquilis syntax 
   error memorandum qui officia nostrud operating system alertus. Hyper text 
   linkus operari avec computatrum ad coniungere hominum. Standards code est 
   pulchra on chromium et foxus sed souvent suckum in internet explorum.
   
   <button slot="button" type="button">Show more</button>
</auto-toggle>
```
**/

import element     from '../../dom/modules/element.js';
import events      from '../../dom/modules/events.js';
import create      from '../../dom/modules/create.js';
import Distributor from '../../dom/modules/distributor.js';
import { rem }     from '../../dom/modules/parse-value.js';


const DEBUG  = true;
const assign = Object.assign;
const define = Object.defineProperties;
const $      = Symbol('');

const config = {
    path: window.customElementStylesheetPath || '',
    buttonText: 'Show more'
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
        const button = create('button', { part: "button", type: "button", name: "", children: [
            create('slot', { name: "button" })
        ]});

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
        events('resize', window).each((e) => {
            update(this, shadow, slot, button, style);
        });
    },

    properties: {
        'open-text': {
            /**
            open-text="Show more"
            Text rendered into the toggle button.
            **/

            attribute: function(value) {
                this[$].openText = value || config.openText;
                //this[$].button.textContent = value || config.buttonText;
            }
        },

        'close-text': {
            /**
            close-text="Show less"
            Text rendered into the toggle button.
            **/

            attribute: function(value) {
                this[$].closeText = value || config.closeText;
                //this[$].button.textContent = value || config.buttonText;
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
            .open
            A boolean property describing the state of the `auto-toggle` – `true`
            when the `auto-toggle` is open, `false` when it is not.
            **/

            get: function() {
                const view = this[$];
                return view.open;
            },

            set: function() {
                const view = this[$];
                const { slot, style } = view;
 
                if (view.open) {
                    style.setProperty('max-height', '');
                    view.open = false;
                }
                else {
                    const scrollHeight = slot.scrollHeight;
                    // Add a sneaky safety margin of 30 pixels, no-one will notice
                    style.setProperty('max-height', rem(scrollHeight + 30), 'important');
                    view.open = true;
                }
            }
        }
    }
});
