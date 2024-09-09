
import events   from 'dom/events.js';
import delegate from 'dom/delegate.js';
import trigger  from 'dom/trigger.js';
import { disableScroll, enableScroll } from 'dom/scroll.js';
import { fullscreenEnabled, getFullscreenElement, enterFullscreen, exitFullscreen } from 'dom/fullscreen.js';

if (fullscreenEnabled) {
    // This should really be accessible to CSS via an @supports query or some
    // such, but it is not, or not in a way that works. Add a supports class.
    document.documentElement.classList.add('fullscreen-support');

    events('click', document).each(delegate({
        '[name="fullscreen"]': function(button) {
            if (!button.value) {
                exitFullscreen();
                return;
            }

            const fullscreenCurrent = getFullscreenElement();
            const element = document.getElementById(button.value.replace(/^#/, ''));

            if (window.DEBUG && !element) {
                throw new Error('Element id="' + button.value.replace(/^#/, '') + '" not found');
            }

            // Make button act as toggle: close the fullscreen
            if (fullscreenCurrent === element) {
                exitFullscreen();
                return;
            }

            if (fullscreenCurrent) {
                exitFullscreen();
            }

            enterFullscreen(element);
        }
    }));
}
else {
    events('click', document).each(delegate({
        '[name="fullscreen"]': function fullscreen(button) {
            const prev = document.querySelector('.fullscreen');

            if (prev) {
                prev.classList.remove('fullscreen');
                document.boltFullscreenElement = undefined;
                trigger('fullscreenchange', prev);
            }

            if (!button.value) {
                enableScroll();
                trigger('resize', window);
                return;
            }

            const element = document.getElementById(button.value.replace(/^#/, ''));
            element.classList.add('fullscreen');
            disableScroll();
            document.boltFullscreenElement = element;
            // Send an event hook fullscreenchange event
            trigger('fullscreenchange', element);
            trigger('resize', window);
        }
    }));
}
