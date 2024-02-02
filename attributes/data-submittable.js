
/*
[submittable]

```html
<form submittable action="" method="">
</form>
```

Hijacks the submit event and submits the form via `fetch()`. Reads the form's
standard `enctype` attribute to set the mimetype of the request, but extends
it by permitting the value `"application/json"` as well as the standard
`"application/x-www-form-urlencoded"` and `"multipart/form-data"`.
*/

import compose from '../../fn/modules/compose.js';
import get     from '../../fn/modules/get.js';
import matches from '../../dom/modules/matches.js';
import request from '../../dom/modules/request.js';
import events  from '../../dom/modules/events.js';
import trigger from '../../dom/modules/trigger.js';


// Define

const match = matches('[submittable], [data-submittable]');


// Functions
events('submit', document)
.filter(compose(match, get('target')))
.each(function(e) {
	e.preventDefault();

	const form = e.target;
	const method   = form.method;
	const url      = form.action || '';
    // Allow other values for enctype by reading the attribute first
	const mimetype = form.getAttribute('enctype') || form.enctype;
	const formData = new FormData(form);

	request(method, url, formData, mimetype)
	.then((data)   => trigger({ type: 'dom-submitted', detail: data }, form))
	.catch((error) => trigger({ type: 'dom-submit-error', detail: error }, form));
});
