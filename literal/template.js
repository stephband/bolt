
import cache   from '../../fn/modules/cache.js';
import Literal, { register } from './modules/literal-browser.js';

function empty() {
    return '';
}

const Template = cache(function Template(id) {
    const element  = document.getElementById(id);

    if (!element) {
        console.error('<template id="' + id + '"> not found in document');
        return empty;
    }

    const params   = Object.keys(element.dataset).join(', ') || 'data';
    const template = element.innerHTML;
    return Literal(params, template, '#' + id);
});

register('include', function include(url, data) {
    if (!/^#/.test(url)) {
        throw new Error('Only #hashrefs currently supported as include() urls ("' + url + '")');
    }

    const id     = url.replace(/^#/, '');
    const render = Template(id);
    return render(data);
});

export default Template;
