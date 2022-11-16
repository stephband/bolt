/**
fullscreenable

Links refering to [fullscreenable] elements put those elements into
fullscreen mode when clicked.

Fullscreen capability is not reliably queried in CSS (through @supports or
other means), so this script also adds the class `fullscreen-support` to the
document root in navigators where support is detected, for styling of UI that
depends on fullscreen support.
**/

import { fullscreenEnabled, fullscreenElement, enterFullscreen, exitFullscreen } from '../../dom/modules/fullscreen.js';
import { behaviours } from '../events/dom-activate.js';

if (fullscreenEnabled) {
    // This should really be accessible to CSS via an @supports query or some
    // such, but it is not, or not in a way that works. Add a supports class.
    document.documentElement.classList.add('fullscreen-support');

    behaviours['data-fullscreenable'] = (e) => {
        var fullscreenNode = fullscreenElement();

        if (fullscreenNode) {
            exitFullscreen();

            if (node === fullscreenNode) {
                // Flag as handled
                return true;
            }
        }
        else {
            enterFullscreen(node);
        }

        // Flag as handled
        return true;
    });
}
