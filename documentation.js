import { get } from '../fn/module.js';
import { events, matches, select, style } from  '../dom/module.js';

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

