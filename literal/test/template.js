
import Literal from '../modules/literal.js';
import create from '../../../dom/modules/create.js';

const string = "<p>Phil scored ${ phil }, bob scored ${ get('objects').each('Goody ${ get(\\`cong\\`).each(\\'Cong ${f} \\') } ') }.</p>";

const t = window.performance.now();
const render = Literal('data', string);
console.log(((window.performance.now() - t) / 1000).toFixed(3));

render({
    phil: 4,
    bob: [3,4,5,6,7,8,9],

    objects: [{
        n: 6,
        cong: [{f:0},{f:1},{f:2}]
    }, {
        n: 7,
        cong: [{f:4},{f:5},{f:6}]
    }, {
        n: 8,
        cong: [{f:7},{f:8},{f:9}]
    }],

    path: 'ARSE',
    get: 'PIN~G'
})
.then((html) => (console.log(((window.performance.now() - t) / 1000).toFixed(3)), html))
.then((html) => document.body.append(create('fragment', html)))
.then(() => console.log(((window.performance.now() - t) / 1000).toFixed(3)));
