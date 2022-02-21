
import merge         from '../../fn/stream/merge.js';
import { mutations } from '../../dom/modules/mutations.js';
import { select }    from '../../dom/modules/select.js';

merge([{}], mutations('text', document.body))
.each((mutation) => {
    /* Select empty typographic elements and add a warning class */
    select('p, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, em, blockquote, strong', document.body)
    .filter((element) => /^\s*$/.test(element.textContent))
    .forEach((element) => element.classList.add('empty-warning'));
});
