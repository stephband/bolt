
import events   from '../../dom/modules/events.js';
import delegate from '../../dom/modules/delegate.js';
import trigger  from '../../dom/modules/trigger.js';
import { disableScroll, enableScroll } from '../../dom/modules/scroll.js';

// Not true in iPhone iOS.
const fullscreenEnabled = document.fullscreenEnabled
    || document.mozFullscreenEnabled
    || document.webkitFullscreenEnabled
    || document.msFullscreenEnabled ;

function getFullscreenElement() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement ;
}

function enterFullscreen(node) {
    return node.requestFullscreen ? node.requestFullscreen() :
        node.webkitRequestFullscreen ? node.webkitRequestFullscreen() :
        node.mozRequestFullScreen ? node.mozRequestFullScreen() :
        node.msRequestFullscreen ? node.msRequestFullscreen() :
        undefined ;
}

function exitFullscreen() {
    document.exitFullscreen ? document.exitFullscreen() :
    document.webkitExitFullscreen ? document.webkitExitFullscreen() :
    document.mozCancelFullScreen ? document.mozCancelFullScreen() :
    document.msExitFullscreen ? document.msExitFullscreen() :
    undefined ;
}

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
