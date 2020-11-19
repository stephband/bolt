
import '../modules/device.js';
import '../modules/toggleable.js';
import '../modules/popable.js';
import '../modules/locateable.js';
import { get, overload } from '../../fn/module.js';
import { events, matches, select, trigger } from  '../../dom/module.js';

events('input change', document)
.map(get('target'))
.filter(matches('.doc-var-input'))
.each(function(input) {
    document.documentElement.style.setProperty(input.name, input.value);
});

setTimeout(function() {
    select('.doc-var-input', document)
    .forEach(function (input) {
        var value = getComputedStyle(document.documentElement)
            .getPropertyValue(input.name);

        input.value = typeof value === 'string' ? value.trim() : value ;
    });
}, 5000);

// Delegate clicks on buttons to their named actions
events('click', document)
.filter(e => !e.defaultPrevented)
.map(e => (e.target.closest('button[name]') || undefined))
.each(overload(get('name'), {
    'activate-toggle-blocks': function(button) {
        const selector = button.value;
        select(selector, document)
        .forEach(function(node) {
            select('[toggleable]', node)
            .forEach(trigger('dom-activate'));
        })
    },

    default: function(button) {
        console.log('No click handler for button name="' + button.name + '"');
    }
}));