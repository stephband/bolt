const $privates = Symbol('privates');

function privates(object) {
    return object[$privates]
        || Object.defineProperty(object, $privates, { value: {} })[$privates] ;
}

/**
cache(fn)
Returns a function that caches the output values of `fn(input)`
against input values in a map, such that for each input value
`fn` is only ever called once.
*/

function cache(fn) {
    var map = new Map();

    return function cache(object) {

        if (map.has(object)) {
            return map.get(object);
        }

        var value = fn(object);
        map.set(object, value);
        return value;
    };
}

/**
curry(fn [, muteable, arity])
Returns a function that wraps `fn` and makes it partially applicable.
*/
const A     = Array.prototype;

function applyFn(fn, args) {
    return typeof fn === 'function' ? fn.apply(null, args) : fn ;
}

function curry(fn, muteable, arity) {
    arity = arity || fn.length;

    var memo = arity === 1 ?
        // Don't cache if `muteable` flag is true
        muteable ? fn : cache(fn) :

        // It's ok to always cache intermediate memos, though
        cache(function(object) {
            return curry(function() {
                var args = [object];
                args.push.apply(args, arguments);
                return fn.apply(null, args);
            }, muteable, arity - 1) ;
        }) ;

    return function partial(object) {
        return arguments.length === 0 ?
            partial :
        arguments.length === 1 ?
            memo(object) :
        arguments.length === arity ?
            fn.apply(null, arguments) :
        arguments.length > arity ?
            applyFn(fn.apply(null, A.splice.call(arguments, 0, arity)), arguments) :
        applyFn(memo(object), A.slice.call(arguments, 1)) ;
    };
}

function clamp(min, max, n) {
    return n > max ? max : n < min ? min : n;
}

curry(clamp);

/**
overload(fn, map)

Returns a function that calls a function at the property of `object` that
matches the result of calling `fn` with all arguments.</p>

```
var fn = overload(toType, {
    string: function a(name, n) {...},
    number: function b(n, m) {...}
});

fn('pie', 4); // Returns a('pie', 4)
fn(1, 2);     // Returns b(1, 2)
```
*/


function overload(fn, map) {
    return function overload() {
        const key     = fn.apply(null, arguments);
        const handler = (map[key] || map.default);

        if (!handler) {
            throw new Error('overload() no handler for "' + key + '"');
        }

        return handler.apply(this, arguments);
    };
}

/**
id(value)
Returns `value`.
*/

function id(value) { return value; }

/**
toType(object)
Returns `typeof object`.
*/

function toType(object) {
    return typeof object;
}

/**
noop()
Returns undefined.
*/

function noop() {}

/**
assign(node, properties)

Assigns each property of `properties` to `node`, as a property where that
property exists in `node`, otherwise as an attribute.

If `properties` has a property `'children'` it must be an array of nodes;
they are appended to 'node'.

The property `'html'` is aliased to `'innerHTML'`. The property `'text'` 
is aliased to `'textContent'`. The property `'tag'` is treated as an alias 
of `'tagName'` (which is ignored, as `node.tagName` is read-only). The 
property `'is'` is also ignored.
*/

const assignProperty = overload(id, {
	// Ignore read-only properties or attributes
	is: noop,
	tag: noop,

	html: function(name, node, content) {
		node.innerHTML = content;
	},

	text: function(name, node, content) {
		node.textContent = content;
	},

	children: function(name, node, content) {
		// Empty the node and append children
		node.innerHTML = '';
		content.forEach((child) => { node.appendChild(child); });
	},

	// SVG points property must be set as string attribute - SVG elements
	// have a read-only API exposed at .points
	points: setAttribute,
    cx:     setAttribute,
    cy:     setAttribute,
    r:      setAttribute,
    preserveAspectRatio: setAttribute,
    viewBox: setAttribute,

	default: function(name, node, content) {
		if (name in node) {
			node[name] = content;
		}
		else {
			node.setAttribute(name, content);
		}
	}
});

function setAttribute(name, node, content) {
	node.setAttribute(name, content);
}

function assign(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		assignProperty(names[n], node, attributes[names[n]]);
	}

	return node;
}

var assign$1 = curry(assign, true);

const svgNamespace = 'http://www.w3.org/2000/svg';
const div = document.createElement('div');


// Constructors

function constructHTML(tag, html) {
    var node = document.createElement(tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

function constructSVG(tag, html) {
    var node = document.createElementNS(svgNamespace, tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

const construct = overload(id, {
    comment: function(tag, text) {
        return document.createComment(text || '');
    },

    fragment: function(tag, html) {
        var fragment = document.createDocumentFragment();

        if (html) {
            div.innerHTML = html;
            const nodes = div.childNodes;
            while (nodes[0]) {
                fragment.appendChild(nodes[0]);
            }
        }

        return fragment;
    },

    text: function (tag, text) {
        return document.createTextNode(text || '');
    },

    circle:   constructSVG,
    ellipse:  constructSVG,
    g:        constructSVG,
    glyph:    constructSVG,
    image:    constructSVG,
    line:     constructSVG,
    rect:     constructSVG,
    use:      constructSVG,
    path:     constructSVG,
    pattern:  constructSVG,
    polygon:  constructSVG,
    polyline: constructSVG,
    svg:      constructSVG,
    default:  constructHTML
});




/**
create(tag, content)

Constructs and returns a new DOM node.

- If `tag` is `"text"` a text node is created.
- If `tag` is `"fragment"` a fragment is created.
- If `tag` is `"comment"` a comment is created.
- If `tag` is any other string the element `<tag></tag>` is created.
- Where `tag` is an object, it must have a `"tag"` or `"tagName"` property.
A node is created according to the above rules for tag strings, and other
properties of the object are assigned with dom's `assign(node, object)` function.

If `content` is a string it is set as text content on a text or comment node,
or as inner HTML on an element or fragment. It may also be an object of
properties which are assigned with dom's `assign(node, properties)` function.
*/

function toTypes() {
    return Array.prototype.map.call(arguments, toType).join(' ');
}

function validateTag(tag) {
    if (typeof tag !== 'string') {
        throw new Error('create(object, content) object must have string property .tag or .tagName');
    }
}

var create = overload(toTypes, {
    'string': construct,

    'string string': construct,

    'string object': function(tag, content) {
        return assign$1(construct(tag, ''), content);
    },

    'object string': function(properties, text) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        // Warning: text is set before properties, but text should override
        // html or innerHTML property, ie, be set after.
        return assign$1(construct(tag, text), properties);
    },

    'object object': function(properties, content) {
        const tag = properties.tag || properties.tagName;
        validateTag(tag);
        return assign$1(assign$1(construct(tag, ''), properties), content);
    },

    default: function() {
        throw new Error('create(tag, content) does not accept argument types "' + Array.prototype.map.call(arguments, toType).join(' ') + '"');
    }
});

var mimetypes = {
    xml: 'application/xml',
    html: 'text/html',
    svg: 'image/svg+xml'
};

function parse(type, string) {
    if (!string) { return; }

    var mimetype = mimetypes[type.toLowerCase()];
    var xml;

    // Cludged from jQuery source...
    try {
        xml = (new window.DOMParser()).parseFromString(string, mimetype);
    }
    catch (e) {
        return;
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid " + type.toUpperCase() + ": " + string);
    }

    return xml;
}

/**
parseHTML(string)
Returns an HTML document parsed from `string`, or undefined.
*/

function parseHTML(string) {
    return parse('html', string);
}

/**
rest(n, array)
**/

function rest(i, object) {
    if (object.slice) { return object.slice(i); }
    if (object.rest)  { return object.rest(i); }

    var a = [];
    var n = object.length - i;
    while (n--) { a[n] = object[n + i]; }
    return a;
}

/**
choose(fn, map)
Returns a function that takes its first argument as a key and uses it
to select a function in `map` which is invoked with the remaining arguments.

Where `map` has a function `default`, that function is run when a key
is not found, otherwise unfound keys will error.

```
var fn = choose({
    'fish':  function fn1(a, b) {...},
    'chips': function fn2(a, b) {...}
});

fn('fish', a, b);   // Calls fn1(a, b)
```
*/

function choose(map) {
    return function choose(key) {
        var fn = map[key] || map.default;
        return fn && fn.apply(this, rest(1, arguments)) ;
    };
}

const done     = { done: true };
const iterator = { next: () => done };

var nothing = Object.freeze({
    // Standard array methods
    shift:   noop,
    push:    noop,
    join:    function() { return ''; },
    forEach: noop,
    map:     function() { return this; },
    filter:  function() { return this; },

    // Stream methods
    start: noop,
    stop:  noop,

    // Make it look like an empty array
    length: 0,

    // Make it an iterable with nothing in it
    [Symbol.iterator]: () => iterator
});

const assign$2 = Object.assign;

/*
config

```{
    headers:    fn(data),    // Must return an object with properties to add to the header
    body:       fn(data),    // Must return an object to send as data
    onresponse: function(response)
}```
*/

const config = {
    // Takes data, returns headers
    headers: function(data) { return {}; },

    // Takes data (can be FormData object or plain object), returns data
    body: id,

    // Takes response, returns response
    onresponse: function(response) {
        // If redirected, navigate the browser away from here. Can get
        // annoying when receiving 404s, maybe not a good default...
        if (response.redirected) {
            window.location = response.url;
            return;
        }

        return response;
    }
};

const createHeaders = choose({
    'application/x-www-form-urlencoded': function(headers) {
        return assign$2(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'application/json': function(headers) {
        return assign$2(headers, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'multipart/form-data': function(headers) {
        return assign$2(headers, {
            "Content-Type": 'multipart/form-data',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'audio/wav': function(headers) {
        return assign$2(headers, {
            "Content-Type": 'audio/wav',
            "X-Requested-With": "XMLHttpRequest"
        });
    },

    'default': function(headers) {
        return assign$2(headers, {
            "Content-Type": 'application/x-www-form-urlencoded',
            "X-Requested-With": "XMLHttpRequest"
        });
    }
});

const createBody = choose({
    'application/json': function(data) {
        return data.get ?
            formDataToJSON(data) :
            JSON.stringify(data);
    },

    'application/x-www-form-urlencoded': function(data) {
        return data.get ?
            formDataToQuery(data) :
            dataToQuery(data) ;
    },

    'multipart/form-data': function(data) {
        // Mmmmmhmmm?
        return data.get ?
            data :
            dataToFormData() ;
    }
});

function formDataToJSON(formData) {
    return JSON.stringify(
        // formData.entries() is an iterator, not an array
        Array
        .from(formData.entries())
        .reduce(function(output, entry) {
            output[entry[0]] = entry[1];
            return output;
        }, {})
    );
}

function formDataToQuery(data) {
    return new URLSearchParams(data).toString();
}

function dataToQuery(data) {
    return Object.keys(data).reduce((params, key) => {
        params.append(key, data[key]);
        return params;
    }, new URLSearchParams());
}

function dataToFormData(data) {
    throw new Error('TODO: dataToFormData(data)');
}

function urlFromData(url, data) {
    // Form data
    return data instanceof FormData ?
        url + '?' + formDataToQuery(data) :
        url + '?' + dataToQuery(data) ;
}

function createOptions(method, data, head, controller) {
    const contentType = typeof head === 'string' ?
        head :
        head['Content-Type'] ;

    const headers = createHeaders(contentType, assign$2(
        config.headers && data ? config.headers(data) : {},
        typeof head === 'string' ? nothing : head
    ));

    const options = {
        method:  method,
        headers: headers,
        credentials: 'same-origin',
        signal: controller && controller.signal
    };

    if (method !== 'GET') {
        options.body = createBody(contentType, config.body ? config.body(data) : data);
    }

    return options;
}

const responders = {
    'text/html': respondText,
    'application/json': respondJSON,
    'multipart/form-data': respondForm,
    'application/x-www-form-urlencoded': respondForm,
    'audio': respondBlob,
    'audio/wav': respondBlob,
    'audio/m4a': respondBlob
};

function respondBlob(response) {
    return response.blob();
}

function respondJSON(response) {
    return response.json();
}

function respondForm(response) {
    return response.formData();
}

function respondText(response) {
    return response.text();
}

function respond(response) {
    if (config.onresponse) {
        response = config.onresponse(response);
    }

    if (!response.ok) {
        throw new Error(response.statusText + '');
    }

    // Get mimetype from Content-Type, remembering to hoik off any
    // parameters first
    const mimetype = response.headers
    .get('Content-Type')
    .replace(/\;.*$/, '');

    return responders[mimetype](response);
}


/**
request(type, url, data, mimetype | headers)

Uses `fetch()` to send a request to `url`. Where `type` is `"GET"`, `data` is
serialised and appended to the URL, otherwise it is sent as a request body.
The 4th parameter may be a content type string or a headers object (in which
case it must have a `'Content-Type'` property).
**/

function request(type = 'GET', url, data, mimetype = 'application/json') {
    if (url.startsWith('application/') || url.startsWith('multipart/') || url.startsWith('text/') || url.startsWith('audio/')) {
        console.trace('request(type, url, data, mimetype) parameter order has changed. You passed (type, mimetype, url, data).');
        url      = arguments[1];
        data     = arguments[2];
        mimetype = arguments[3];
    }

    const method = type.toUpperCase();

    // If this is a GET and there is data, append data to the URL query string
    if (method === 'GET' && data) {
        url = urlFromData(url, data);
    }

    // param[4] is an optional abort controller
    return fetch(url, createOptions(method, data, mimetype, arguments[4]))
    .then(respond);
}

const requestDocument = cache(function requestDocument(path) {
    return request('GET', path)
    .then(parseHTML);
});

function requestTemplate(src) {
    const parts = src.split('#');
    const path  = parts[0] || '';
    const id    = parts[1] || '';

    if (!path) {
        throw new Error('dom requestTemplate(src) src "' + src + '" does not contain a path');
    }

    return id ?
        requestDocument(path)
        .then((doc) => doc.getElementById(id))
        .then((template) => {
            if (!template) {
                throw new Error('dom requestTemplate(src) template "' + src + '" not found in imported document');
            }

            return document.adoptNode(template);
        }) :

        requestDocument(path)
        .then((doc) => document.adoptNode(doc.body)) ;
}

const DEBUG = window.DEBUG === true;

const assign$3 = Object.assign;

const constructors = {
    'a':        HTMLAnchorElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'template': HTMLTemplateElement
};

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form:              { get: function() { return this[$internals].form; }},
    labels:            { get: function() { return this[$internals].labels; }},
    validity:          { get: function() { return this[$internals].validity; }},
    validationMessage: { get: function() { return this[$internals].validationMessage; }},
    willValidate:      { get: function() { return this[$internals].willValidate; }},
    checkValidity:     { value: function() { return this[$internals].checkValidity(); }},
    reportValidity:    { value: function() { return this[$internals].reportValidity(); }}
};

const onceEvent = {
    once: true
};

function getElementConstructor(tag) {
        // Return a constructor from the known list of tag names – not all tags
        // have constructor names that match their tags
    return constructors[tag]
        // Or assemble the tag name in the form "HTMLTagElement" and return
        // that property of the window object
        || window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element']
        || (() => {
            throw new Error('Constructor not found for tag "' + tag + '"');
        })();
}

function getTemplateById(id) {
    const template = document.getElementById(id);

    if (!template || !template.content) {
        throw new Error('Template id="' + id + '" not found in document');
    }

    return template;
}

function getTemplate(template) {
    if (template === undefined) { return; }

    return typeof template === 'string' ?
        // If template is an #id search for <template id="id">
        template[0] === '#' ? getTemplateById(template.slice(1)) :
        // It must be a string of HTML
        template :        
    template.content ?
        // It must be a template node
        template :
    typeof template === 'function' ?
        template :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.template not a template node, id or string');
        }() ;
}

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function createShadow(template, elem, options) {
    if (template === undefined) { return; }
    elem._initialLoad = true;

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode:           options.mode || 'closed',
        delegatesFocus: options.focusable || false
    });

    elem[$shadow] = shadow;

    // If template is a string
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else if (typeof template === 'function') {
        template(elem, shadow);
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }

    return shadow;
}

function attachInternals(elem) {
    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        return elem.attachInternals();
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    const hidden = create('input', { type: 'hidden', name: elem.name });

    // Polyfill internals object setFormValue
    hidden.setFormValue = function(value) {
        this.value = value;
    };

    return hidden;
}

function primeAttributes(elem) {
    elem._initialAttributes = {};
    elem._n = 0;
}

function advanceAttributes(elem, attributes, handlers) {
    const values = elem._initialAttributes;

    while(elem._n < attributes.length && values[attributes[elem._n]] !== undefined) {
        //console.log('ADVANCE ATTR', attributes[elem._n]);
        handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        ++elem._n;
    }
}

function flushAttributes(elem, attributes, handlers) {
    if (!elem._initialAttributes) { return; }

    const values = elem._initialAttributes;

    while(elem._n < attributes.length) {
        if (values[attributes[elem._n]] !== undefined && handlers[attributes[elem._n]]) {
            handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        }
        ++elem._n;
    }

    delete elem._initialAttributes;
    delete elem._n;
}



function element(name, options) {
    // Get the element constructor from options.extends, or the
    // base HTMLElement constructor
    const constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

    let template;

    function Element() {
        // Get a template node or HTML string from options.template
        template = template === undefined ?
            getTemplate(options.template) :
            template ;

        // Construct an instance from Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = createShadow(template, elem, options);

        if (Element.formAssociated) {
            // Get access to the internal form control API
            elem[$internals] = attachInternals(elem);
        }

        options.construct && options.construct.call(null, elem, shadow, elem[$internals]);

        // Preserve initialisation order of attribute initialisation by
        // queueing them
        if (options.attributes) {
            primeAttributes(elem);

            // Wait a tick to flush attributes
            Promise.resolve(1).then(function() {
                flushAttributes(elem, Element.observedAttributes, options);
            });
        }

        // At this point, if properties have already been set before the
        // element was upgraded, they exist on the elem itself, where we have
        // just upgraded it's protytype to define those properties those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype
        //    Object.defineProperties(elem, properties);
        //
        // 2. Take a great deal of care not to set properties before an element
        //    is upgraded. I can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy you have to do this, though.
        options.properties
        && Object.keys(options.properties).reduce(transferProperty, elem);

        return elem;
    }


    // Properties
    //
    // Must be defined before attributeChangedCallback, but I cannot figure out
    // why. Where one of the properties is `value`, the element is set up as a
    // form element.

    if (options.properties && options.properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;
        Element.prototype = Object.create(constructor.prototype, assign$3({}, formProperties, options.properties));
    }
    else {
        Element.prototype = Object.create(constructor.prototype, options.properties || {}) ;
    }


    // Attributes

    if (options.attributes) {
        Element.observedAttributes = Object.keys(options.attributes);
        Element.prototype.attributeChangedCallback = function(name, old, value) {
            if (!this._initialAttributes) {
                return options.attributes[name].call(this, value);
            }

            // Keep a record of attribute values to be applied in
            // observedAttributes order
            this._initialAttributes[name] = value;
            advanceAttributes(this, Element.observedAttributes, options.attributes);
        };
    }


    // Lifecycle

    Element.prototype.connectedCallback = function() {
        const elem      = this;
        const shadow    = elem[$shadow];
        const internals = elem[$internals];

        // Initialise any attributes that appeared out of order
        if (elem._initialAttributes) {
            flushAttributes(elem, Element.observedAttributes, options.attributes);
        }

        // If we have simulated form internals, append the hidden input now
        if (elem[$internals] && !elem.attachInternals) {
            elem.appendChild(elem[$internals]);
        }

        // If this is the first connect and there is an options.load fn,
        // _initialLoad is true
        if (elem._initialLoad) {
            const links = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (links.length) {
                let count  = 0;
                let n = links.length;

                // Avoid unstyled content by temporarily hiding elem while
                // links load
                elem.style.visibility = 'hidden';

                const load = function load(e) {
                    if (++count >= links.length) {
                        // Delete _initialLoad. If the element is removed
                        // and added to the DOM again, stylesheets do not load
                        // again
                        delete elem._initialLoad;
                        elem.style.visibility = 'visible';
                        if (options.load) {
                            options.load.call(elem, elem, shadow);
                        }
                    }
                };

                // Todo: But do we pick these load events up if the stylesheet is cached??
                while (n--) {
                    links[n].addEventListener('load', load, onceEvent);
                    links[n].addEventListener('error', function(e) {
                        console.log('Failed to load stylesheet', e.target.href);
                        load();
                    }, onceEvent);
                }

                if (options.connect) {
                    options.connect.call(null, elem, shadow, internals);
                }
            }
            else {
                if (options.connect) {
                    options.connect.call(null, elem, shadow, internals);
                }

                if (options.load) {
                    options.load.call(null, elem, shadow, internals);
                }
            }
        }
        else if (options.connect) {
            options.connect.call(null, elem, shadow, internals);
        }

        if (DEBUG) {
            console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', elem);
        }
    };

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            return options.disconnect.call(null, this, this[$shadow], this[$internals]);
        };
    }

    if (Element.formAssociated) {
        if (options.enable || options.disable) {
            Element.prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    options.disable && options.disable.call(null, this, this[$shadow], this[$internals]) :
                    options.enable && options.enable.call(null, this, this[$shadow], this[$internals]) ;
            };
        }

        if (options.reset) {
            Element.prototype.formResetCallback = function() {
                return options.reset.call(null, this, this[$shadow], this[$internals]);
            };
        }

        if (options.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                return options.restore.call(null, this, this[$shadow], this[$internals]);
            };
        }
    }

    // Define element
    // Todo: make this async regardless of external template, for consistency? Does
    // that cause problems? It shouldn't, we should be able to define custom elements 
    // whenever we like.
    if (typeof options.template === 'string' && /^(?:\.?\/|https?:\/\/)/.test(options.template)) {
        // Template src begins with ./ or / or http:// or https://
        // preload it before defining custom element
        requestTemplate(options.template)
        .then(function(node) {
            if (DEBUG) {
                console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', 'template "' + options.template + '" imported');
            }
            template = node;
            window.customElements.define(name, Element, options);
        });
    }
    else {
        window.customElements.define(name, Element, options);
    }

    return Element;
}

/**
by(fn, a, b)
Compares `fn(a)` against `fn(b)` and returns `-1`, `0` or `1`. Useful for sorting
objects by property:

```
[{id: '2'}, {id: '1'}].sort(by(get('id')));  // [{id: '1'}, {id: '2'}]
```
**/

function by(fn, a, b) {
    const fna = fn(a);
    const fnb = fn(b);
    return fnb === fna ? 0 : fna > fnb ? 1 : -1 ;
}

var by$1 = curry(by, true);

function get(key, object) {
    // Todo? Support WeakMaps and Maps and other map-like objects with a
    // get method - but not by detecting the get method
    return object[key];
}

var get$1 = curry(get, true);

const assign$4      = Object.assign;
const CustomEvent = window.CustomEvent;

const defaults    = {
	// The event bubbles (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	bubbles: true,

	// The event may be cancelled (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
	cancelable: true

	// Trigger listeners outside of a shadow root (false by default)
	// https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
	//composed: false
};

/**
Event(type, properties)

Creates a CustomEvent of type `type`.
Additionally, `properties` are assigned to the event object.
*/

function Event(type, options) {
	let settings;

	if (typeof type === 'object') {
		settings = assign$4({}, defaults, type);
		type = settings.type;
        delete settings.type;
	}

	if (options && options.detail) {
		if (settings) {
			settings.detail = options.detail;
		}
		else {
			settings = assign$4({ detail: options.detail }, defaults);
		}
	}

    // Settings accepted by CustomEvent:
    // detail:     any
    // bubbles:    true | false
    // cancelable: true | false
    // composed:   true | false
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
	var event = new CustomEvent(type, settings || defaults);

	if (options) {
		delete options.detail;
		assign$4(event, options);
	}

	return event;
}

function trigger(type, node) {
    let properties;

    if (typeof type === 'object') {
        properties = type;
        type = properties.type;
        delete properties.type;
    }

    // Don't cache events. It prevents you from triggering an event of a
	// given type from inside the handler of another event of that type.
	var event = Event(type, properties);
	node.dispatchEvent(event);
    return node;
}

/**
todB(level)

Converts a value to decibels relative to unity (dBFS).
**/

// A bit disturbingly, a correction factor is needed to make todB() and
// to toLevel() reciprocate more accurately. This is quite a lot to be off
// by... Todo: investigate?
const dBCorrectionFactor = (60 / 60.205999132796244);

function todB(n) {
    return 20 * Math.log10(n) * dBCorrectionFactor;
}

/**
toLevel(dB)

Converts a dB value relative to unity (dBFS) to unit value.
**/

function toGain(n) {
    return Math.pow(2, n / 6);
}

/**
toCamelCase(string)
Capitalises any Letter following a `'-'` and removes the dash.
**/

function toCamelCase(string) {
    // Be gracious in what we accept as input
    return string.replace(/-(\w)?/g, function($0, letter) {
        return letter ? letter.toUpperCase() : '';
    });
}

const DEBUG$1 = window.DEBUG === undefined || window.DEBUG;

const defs = {
    // Primitive types

    'boolean': (value) =>
        typeof value === 'boolean',

    'function': (value) =>
        typeof value === 'function',

    'number': (value) =>
        typeof value === 'number',

    'object': (value) =>
        typeof value === 'object',

    'symbol': (value) =>
        typeof value === 'symbol',

    // Functional types
    // Some of these are 'borrowed' from SancturyJS
    // https://github.com/sanctuary-js/sanctuary-def/tree/v0.19.0

    'Any': noop,

    'Array': (value) =>
        Array.isArray(value),

    'ArrayLike': (value) =>
        typeof value.length === 'number',

    'Boolean': (value) =>
        typeof value === 'boolean',

    'Date': (value) =>
        value instanceof Date
        && !Number.isNaN(value.getTime()),

    'Error': (value) =>
        value instanceof Error,

    'Integer': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value,

    'NegativeInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value < 0,

    'NonPositiveInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value <= 0,

    'PositiveInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value > 0,

    'NonNegativeInteger': (value) =>
        Number.isInteger(value)
        && Number.MIN_SAFE_INTEGER <= value
        && Number.MAX_SAFE_INTEGER >= value
        && value >= 0,

    'Number': (value) =>
        typeof value === 'number'
        && !Number.isNaN(value),

    'NegativeNumber': (value) =>
        typeof value === 'number'
        && value < 0,

    'NonPositiveNumber': (value) =>
        typeof value === 'number'
        && value <= 0,

    'PositiveNumber': (value) =>
        typeof value === 'number'
        && value > 0,

    'NonNegativeNumber': (value) =>
        typeof value === 'number'
        && value >= 0,

    'Null': (value) =>
        value === null,

    'Object': (value) =>
        !!value
        && typeof value === 'object',

    'RegExp': (value) =>
        value instanceof RegExp
};

const checkType = DEBUG$1 ? function checkType(type, value, file, line, message) {
    if (!defs[type]) {
        throw new RangeError('Type "' + type + '" not recognised');
    }

    if (!defs[type](value)) {
        throw new Error(message || 'value not of type "' + type + '": ' + value, file, line);
    }
} : noop ;

const checkTypes = DEBUG$1 ? function checkTypes(types, args, file, line) {
    var n = types.length;

    while (n--) {
        checkType(types[n], args[n], file, line, 'argument ' + n + ' not of type "' + types[n] + '": ' + args[n]);
    }
} : noop ;

function def(notation, fn, file, line) {
    // notation is of the form:
    // 'Type, Type -> Type'
    // Be generous with what we accept as output marker '->' or '=>'
    var parts = notation.split(/\s*[=-]>\s*/);
    var types = parts[0].split(/\s*,\s*/);
    var returnType = parts[1];

    return DEBUG$1 ? function() {
        checkTypes(types, arguments, file, line);
        const output = fn.apply(this, arguments);
        checkType(returnType, output, file, line, 'return value not of type "' + returnType + '": ' + output);
        return output;
    } : fn ;
}

// Cubic bezier function (originally translated from

function sampleCubicBezier(a, b, c, t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((a * t + b) * t + c) * t;
}

function sampleCubicBezierDerivative(a, b, c, t) {
    return (3 * a * t + 2 * b) * t + c;
}

function solveCubicBezierX(a, b, c, x, epsilon) {
    // Solve x for a cubic bezier
    var x2, d2, i;
    var t2 = x;

    // First try a few iterations of Newton's method -- normally very fast.
    for(i = 0; i < 8; i++) {
        x2 = sampleCubicBezier(a, b, c, t2) - x;
        if (Math.abs(x2) < epsilon) {
            return t2;
        }
        d2 = sampleCubicBezierDerivative(a, b, c, t2);
        if (Math.abs(d2) < 1e-6) {
            break;
        }
        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    var t0 = 0;
    var t1 = 1;

    t2 = x;

    if(t2 < t0) { return t0; }
    if(t2 > t1) { return t1; }

    while(t0 < t1) {
        x2 = sampleCubicBezier(a, b, c, t2);
        if(Math.abs(x2 - x) < epsilon) {
            return t2;
        }
        if (x > x2) { t0 = t2; }
        else { t1 = t2; }
        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
}

function cubicBezier(p1, p2, duration, x) {
    // The epsilon value to pass given that the animation is going
    // to run over duruation seconds. The longer the animation, the
    // more precision is needed in the timing function result to
    // avoid ugly discontinuities.
    var epsilon = 1 / (200 * duration);

    // Calculate the polynomial coefficients. Implicit first and last
    // control points are (0,0) and (1,1).
    var cx = 3 * p1[0];
    var bx = 3 * (p2[0] - p1[0]) - cx;
    var ax = 1 - cx - bx;
    var cy = 3 * p1[1];
    var by = 3 * (p2[1] - p1[1]) - cy;
    var ay = 1 - cy - by;

    var y = solveCubicBezierX(ax, bx, cx, x, epsilon);
    return sampleCubicBezier(ay, by, cy, y);
}

var bezierify = curry(cubicBezier, true, 4);

// Normalisers take a min and max and transform a value in that range
// to a value on the normal curve of a given type

const linear = def(
    'Number, Number, Number => Number',
    (min, max, value) => (value - min) / (max - min)
);

const quadratic = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow((value - min) / (max - min), 1/2)
);

const cubic = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow((value - min) / (max - min), 1/3)
);

const logarithmic = def(
    'PositiveNumber, PositiveNumber, NonNegativeNumber => Number',
    (min, max, value) => Math.log(value / min) / Math.log(max / min)
);

const linearLogarithmic = def(
    'PositiveNumber, PositiveNumber, NonNegativeNumber => Number',
    (min, max, value) => {
        // The bottom 1/9th of the range is linear from 0 to min, while
        // the top 8/9ths is dB linear from min to max.
        return value <= min ?
            (value / min) / 9 :
            (0.1111111111111111 + (Math.log(value / min) / Math.log(max / min)) / 1.125) ;
    }
);

// cubicBezier
// `begin` and `end` are objects of the form
// { point:  [x, y], handle: [x, y] }

const cubicBezier$1 = def(
    'Object, Object, Number => Number',
    (begin, end, value) => bezierify({
        0: linear(begin.point[0], end.point[0], begin.handle[0]),
        1: linear(begin.point[0], end.point[0], begin.handle[0])
    }, {
        0: linear(begin.point[0], end.point[0], end.handle[0]),
        1: linear(begin.point[0], end.point[0], end.handle[0])
    }, 1, linear(begin.point[0], end.point[0], value))
);

var normalise = /*#__PURE__*/Object.freeze({
    __proto__: null,
    linear: linear,
    quadratic: quadratic,
    cubic: cubic,
    logarithmic: logarithmic,
    linearLogarithmic: linearLogarithmic,
    cubicBezier: cubicBezier$1
});

// Denormalisers take a min and max and transform a value into that range
// from the range of a curve of a given type

const linear$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => value * (max - min) + min
);

const quadratic$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow(value, 2) * (max - min) + min
);

const cubic$1 = def(
    'Number, Number, Number => Number',
    (min, max, value) => Math.pow(value, 3) * (max - min) + min
);

const logarithmic$1 = def(
    'PositiveNumber, PositiveNumber, Number => Number',
    (min, max, value) => min * Math.pow(max / min, value)
);

const linearLogarithmic$1 = def(
    'PositiveNumber, PositiveNumber, Number => Number',
    (min, max, value) => {
        // The bottom 1/9th of the range is linear from 0 to min, while
        // the top 8/9ths is dB linear from min to max.
        return value <= 0.1111111111111111 ?
            value * 9 * min :
            min * Math.pow(max / min, (value - 0.1111111111111111) * 1.125);
    }
);

// cubicBezier
// `begin` and `end` are objects of the form
// { point:  [x, y], handle: [x, y] }

const cubicBezier$2 = def(
    'Object, Object, Number => Number',
    (begin, end, value) => linear$1(begin.point[1], end.point[1], bezierify({
        0: linear(begin.point[0], end.point[0], begin.handle[0]),
        1: linear(begin.point[1], end.point[1], begin.handle[1])
    }, {
        0: linear(begin.point[0], end.point[0], end.handle[0]),
        1: linear(begin.point[1], end.point[1], end.handle[1])
    }, 1, value))
);



/* Todo: does it do as we intend?? */
// Todo: implement tanh with min max scaling or gradient and crossover 
// centering or one or two of these others
// https://en.wikipedia.org/wiki/Sigmoid_function#/media/File:Gjl-t(x).svg
const tanh = def(
    'Number, Number, Number => Number',
    (min, max, value) => (Math.tanh(value) / 2 + 0.5) * (max - min) + min
);

var denormalise = /*#__PURE__*/Object.freeze({
    __proto__: null,
    linear: linear$1,
    quadratic: quadratic$1,
    cubic: cubic$1,
    logarithmic: logarithmic$1,
    linearLogarithmic: linearLogarithmic$1,
    cubicBezier: cubicBezier$2,
    tanh: tanh
});

function transform(curve, value, min, max) {
    return denormalise[toCamelCase(curve)](min, max, value) ;
}

function invert(curve, value, min, max) {
    return normalise[toCamelCase(curve)](min, max, value) ;
}


function outputMilliKilo(unit, value) {
    return value < 0.001 ? (value * 1000).toFixed(2) :
        value < 1 ? (value * 1000).toPrecision(3) :
        value > 1000 ? (value / 1000).toPrecision(3) :
        value.toPrecision(3) ;
}

const transformOutput = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? '-1.00' :
            value === 0 ? '0.00' :
            value === 1 ? '1.00' :
            value.toFixed(2) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db < -1 ? db.toPrecision(3) :
                db.toFixed(2) :
            db < 0 ?
                '-∞' :
                '∞' ;
    },

    Hz: function(unit, value) {
        return value < 1 ? value.toFixed(2) :
            value > 1000 ? (value / 1000).toPrecision(3) :
            value.toPrecision(3) ;
    },

    semitone: function(unit, value) {
        // detune value is in cents
        return value === 0 ? '0' :
            value < 0 ?
                '♭' + (-value / 100).toFixed(2) :
                '♯' + (value / 100).toFixed(2) ;
    },

    s: outputMilliKilo,

    bpm: function(unit, value) {
        // Input value is a rate in beats per second
        const bpm = value * 60;
        return bpm < 100 ?
            bpm.toFixed(1) :
            bpm.toFixed(0) ;
    },

    int: function(unit, value) {
        return Math.round(value);
    },

    default: function(unit, value) {
        return value < 0.1 ? value.toFixed(3) :
            value < 999.5 ? value.toPrecision(3) :
            value.toFixed(0) ;
    }
});

function tickMilliKilo(unit, value) {
    return value < 1 ? (value * 1000).toFixed(0) :
        value < 10 ? value.toFixed(1) :
        value < 1000 ? value.toPrecision(1) :
        (value / 1000).toPrecision(1) + 'k' ;
}

const transformTick = overload(id, {
    pan: function(unit, value) {
        return value === -1 ? 'left' :
            value === 0 ? 'centre' :
            value === 1 ? 'right' :
            value.toFixed(1) ;
    },

    dB: function(unit, value) {
        const db = todB(value) ;
        return isFinite(db) ?
            db.toFixed(0) :
            db < 0 ?
                '-∞' :
                '∞' ;
    },

    Hz: function(unit, value) {
        return value < 10 ? value.toFixed(1) :
            value < 1000 ? value.toFixed(0) :
            (value / 1000).toFixed(0) + 'k' ;
    },

    semitone: function(unit, value) {
        //console.log(unit, value, value / 100, (value / 100).toFixed(0));
        // detune value is in cents
        return (value / 100).toFixed(0);
    },

    s: tickMilliKilo,

    default: function(unit, value) {
        // Format numbers to precision 3 then remove trailing zeroes from floats
        return (value < 99.5 ?
            value.toPrecision(3) :
            value.toFixed(0)
        )
        .replace(/(\d+)(\.\d*?)0+$/, ($0, $1, $2) => {
            return $1 + ($2.length > 1 ? $2 : '');
        });
    }
});

function unitKilo(unit, value) {
    return value > 1000 ? 'k' + unit :
        unit ;
}

function unitMilliKilo(unit, value) {
    return value < 1 ? 'm' + unit :
        value > 1000 ? 'k' + unit :
        unit ;
}

function unitEmptyString() {
    return '';
}

const transformUnit = overload(id, {
    pan: unitEmptyString,

    dB: id,

    Hz: unitKilo,

    semitone: unitEmptyString,

    s: unitMilliKilo,
    
    int: () => '',

    default: function(unit, value) {
        // Return empty string if no unit
        return unit || '';
    }
});


function evaluate(string) {
    // Coerce null, undefined, false, '' to 0
    if (!string) { return 0; }

    const number = +string;
    if (number || number === 0) { return number; }

    const tokens = /^(-?[\d.]+)(?:(dB|bpm)|(m|k)?(\w+))$/.exec(string);
    if (!tokens) { return 0 }
    const value = parseFloat(tokens[1]) ;

    return tokens[2] === 'dB' ? toGain(value) :
        // BPM to rate in beats per second
        tokens[2] === 'bpm' ? value / 60 :
        // milli-
        tokens[3] === 'm' ? value / 1000 :
        // kilo-
        tokens[3] === 'k' ? value * 1000 :
        value ;
}

function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.law === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                value:        value,
                unitValue:    invert(data.law, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

function createSteps(data, tokens) {
    if (!tokens || /\s+any\s+/.test(tokens)) {
        return null;
    }

    const values = tokens.split(/\s+/);

    // Single step value not supported yet
    return values.length === 1 ?
        null :
        values
        .map(evaluate)
        .map((value) => {
            return {
                value: value,
                unitValue: invert(data.law, value, data.min, data.max)
            };
        })
        .sort(by$1(get$1('unitValue'))) ;
}

function nearestStep(steps, unitValue) {
    let n = steps.length;
    let diff = Infinity;
    let step;

    while (n--) {
        const d = Math.abs(unitValue - steps[n].unitValue);

        if (d < diff) {
            diff = d;
            step = steps[n];
        }
    }

    return step;
}


const attributes = {
    // Remember attributers are setup in this declared order

    /**
    min="0"
    Value at lower limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    min: function(value) {
        this.min = value;
    },

    /**
    max="1"
    Value at upper limit of fader. Can interpret values with recognised units,
    eg. `"0dB"`.
    **/

    max: function(value) {
        this.max = value;
    },

    /**
    law="linear"
    Fader law. This is the name of a transform to be applied over the range 
    of the fader travel. Possible values are:

- `"linear"`
- `"linear-logarithmic"`
- `"logarithmic"`
- `"quadratic"`
- `"cubic"`
    **/

    law: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        const scope    = privates$1.scope;

        data.law = value || 'linear';

        if (data.ticksAttribute) {
            data.ticks = createTicks(data, data.ticksAttribute);
        }

        if (data.step) {
            data.steps = createSteps(data, value === 'ticks' ?
                data.ticksAttribute || '' :
                data.stepsAttribute );
        }

        scope.unitZero(invert(data.law, 0, data.min, data.max));
    },

    /**
    unit=""
    The value's unit, if it has one. The output value and all ticks are 
    displayed in this unit. Possible values are:
- `"dB"` – `0-1` is displayed as `-∞dB` to `0dB`
- `"Hz"`
    **/

    unit: function(value) {
        privates(this).data.unit = value;
    },

    /**
    ticks=""
    A space separated list of values at which to display tick marks. Values
    may be listed with or without units, eg:
    
```html
ticks="0 0.2 0.4 0.6 0.8 1"
ticks="-48dB -36dB -24dB -12dB 0dB"
```
    **/

    ticks: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        const scope    = privates$1.scope;

        data.ticksAttribute = value;

        // Create ticks
        scope.ticks(createTicks(data, value));

        // If step is 'ticks' update steps
        if (data.stepsAttribute === 'ticks') {
            data.steps = createSteps(data, value || '');
        }
    },

    /**
    steps=""
    Steps is either:

- A space separated list of values. As with `ticks`, values may be listed with or without units.
- The string `"ticks"`. The values in the `ticks` attribute are used as steps.
    **/

    steps: function(value) {
        const privates$1 = privates(this);
        const data     = privates$1.data;
        data.stepsAttribute = value;

        // If steps is 'ticks' use ticks attribute as step value list
        data.steps = createSteps(data, value === 'ticks' ?
            data.ticksAttribute || '' :
            value );
    },

    /**
    value=""
    The initial value of the fader.
    **/

    value: function(value) {
        this.value = value;
    },

    prefix: function(value) {
        privates(this).data.prefix = value;
    }
};

const properties = {
    /**
    .type="number"
    A readonly property with the value `"number"` (provided for consistency 
    with native form elements, which all have a type).
    **/

    type: {
        value: 'number',
        enumerable: true
    },

    /**
    .min=0
    Value at lower limit of fader, as a number.
    **/

    min: {
        get: function() {
            return privates(this).data.min;
        },

        set: function(value) {
            const privates$1 = privates(this);
            const data     = privates$1.data;
            const scope    = privates$1.scope;

            data.min = evaluate(value);

            // Check for readiness
            if (data.max === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },

    /**
    .max=1
    Value at lower limit of fader, as a number.
    **/

    max: {
        get: function() {
            return privates(this).data.max;
        },

        set: function(value) {
            const privates$1 = privates(this);
            const data     = privates$1.data;
            const scope    = privates$1.scope;

            data.max = evaluate(value);

            if (data.min === undefined) { return; }
            scope.ticks(createTicks(data, data.ticksAttribute));
            scope.unitZero(invert(data.law, 0, data.min, data.max));

            // Check for readiness
            if (data.value === undefined) { return; }
            data.unitValue = invert(data.law, data.value, data.min, data.max);
        },

        enumerable: true
    },
    
    /**
    .value=0
    Current value of the field, as a number.
    **/
    
    value: {
        get: function() {
            return privates(this).data.value;
        },

        set: function(value) {
            const privates$1  = privates(this);
            const data      = privates$1.data;
            const scope     = privates$1.scope;
            const internals = privates$1.internals;

            value = evaluate(value);

            if (value === data.value) { return; }

            // Are we ready?
            /*
            if (data.max === undefined || data.min === undefined) {
                data.value = value;
                return;
            }*/

            let unitValue = invert(data.law, value, data.min, data.max);

            // Round to nearest step
            if (data.steps) {
                const step = nearestStep(data.steps, unitValue);
                value     = step.value;
                unitValue = step.unitValue;
            }

            if (value === data.value) { return; }
            data.value = value;
            data.unitValue = unitValue;

            internals.setFormValue(value);
            scope.displayValue(transformOutput(data.unit, value));
            scope.displayUnit(transformUnit(data.unit, value));
            scope.unitValue(unitValue);
        },

        enumerable: true
    }
};


/* Events */

/**
"input"
Sent continuously during a fader movement.
**/

function touchstart(e) {
    const target = e.target.closest('button');

    // Ignore non-ticks
    if (!target) { return; }

    const unitValue = parseFloat(target.value);
    const value = transform(this.data.law, unitValue, this.data.min, this.data.max) ;
    this.element.value = value;

    // Refocus the input (should not be needed now we have focus 
    // control on parent?) and trigger input event on element
    //            shadow.querySelector('input').focus();

    // Change event on element
    trigger('input', this.element);
}

function input(e) {
    const unitValue = parseFloat(e.target.value); 
    const value = transform(this.data.law, unitValue, this.data.min, this.data.max) ;
    this.element.value = value;

    // If the range has steps make sure the handle snaps into place
    if (this.data.steps) {
        e.target.value = this.data.unitValue;
    }
}

const handleEvent = overload((e) => e.type, {
    'touchstart': touchstart,
    'mousedown': touchstart,
    'input': input
});

const assign$5 = Object.assign;

const defaults$1 = {
    law: 'linear',
    min: 0,
    max: 1
};

const config$1 = {
    path: window.customElementStylesheetPath || ''
};


/* Shadow */

function createTemplate(elem, shadow) {
    const link   = create('link',  { rel: 'stylesheet', href: config$1.path + 'range-control.css' });
    const style  = create('style', ':host {}');
    const label  = create('label', { for: 'input', html: '<slot></slot>', part: 'label' });
    const input  = create('input', { type: 'range', id: 'input', name: 'unit-value', min: '0', max: '1', step: 'any' });
    const text   = create('text');
    const abbr   = create('abbr');
    const output = create('output', { children: [text, abbr], part: 'output' });
    const marker = create('text', '');

    shadow.appendChild(link);
    shadow.appendChild(style);
    shadow.appendChild(label);
    shadow.appendChild(input);
    shadow.appendChild(output);
    shadow.appendChild(marker);

    // Get the :host {} style rule from style
    const css = style.sheet.cssRules[0].style;

    return {
        'unitValue': function(unitValue) {
            if (input.value !== unitValue + '') {
                input.value = unitValue + '';
            }

            css.setProperty('--unit-value', unitValue);
        },

        'unitZero': function(unitZero) {
            css.setProperty('--unit-zero', unitZero);
        },

        'displayValue': function(displayValue) {
            text.textContent = displayValue;
            css.setProperty('--display-value', displayValue);
        },

        'displayUnit': function(displayUnit) {
            // Add and remove output > abbr
            if (displayUnit) {
                if (!abbr.parentNode) {
                    output.appendChild(abbr);
                }

                // Update abbr text
                abbr.textContent = displayUnit;
            }
            else if (abbr.parentNode) {
                abbr.remove();
            }
        },

        'ticks': (function(buttons) {
            return function(scopes) {    
                // Clear out existing ticks
                buttons.forEach((node) => node.remove());
                buttons.length = 0;

                // Create new ticks and put them in the dom    
                scopes.forEach(function(scope) {
                    const button = create('button', {
                        type: 'button',
                        name: 'unit-value',
                        value: scope.unitValue,
                        style: '--tick-value: ' + scope.unitValue + ';',
                        text: scope.displayValue,
                        part: 'tick'
                    });

                    marker.before(button);
                    buttons.push(button);
                });
            };
        })([])
    };
}

/* Element */

var rangeControl = element('range-control', {
    template: function(elem, shadow) {
        const privates$1 = privates(elem);
        privates$1.scope = createTemplate(elem, shadow);
    },

    mode:       'closed',
    focusable:  true,
    attributes: attributes,
    properties: properties,

    construct: function(elem, shadow, internals) {
        // Setup internal data store `privates`
        const privates$1 = privates(elem);
        const data     = privates$1.data  = assign$5({}, defaults$1);

        privates$1.element     = elem;
        privates$1.shadow      = shadow;
        privates$1.internals   = internals;
        privates$1.handleEvent = handleEvent;

        // Listen to touches on ticks
        shadow.addEventListener('mousedown', privates$1);
        shadow.addEventListener('touchstart', privates$1);

        // Listen to range input
        shadow.addEventListener('input', privates$1);
    },

    connect: function(elem, shadow) {
        const privates$1 = privates(elem);
        const data     = privates$1.data;

        // Range control must have value
        if (data.value === undefined) {
            elem.value = clamp(data.min, data.max, 0);
        }
    }
});

export default rangeControl;
