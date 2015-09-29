The View API
============

The main abstraction used by the JavaScript API is the `View` class.  Views are 
responsible for localizing `document` objects in HTML.  Internally, viewes use 
a centralized `Service` to store the state of the language negotiation and 
cache downloaded resources.

If you're using the `web` or the `webcompat` runtime builds (see 
[docs/html][]), each `document` will have its corresponding `View` created 
automatically on startup, as `document.l10n`.

[docs/html]: html.md


View (document.l10n)
--------------------

### view.ready

A Promise which resolves when the `document` is first translated.

```javascript
view.ready.then(App.init);
```


### view.resolvedLanguages()

Return a Promise which resolves to an array of the current user-preferred 
languages.  Language objects have the following properties:

```javascript
{
  code: 'ar',
  dir: 'rtl',
  src: 'app'
}
```

Language codes follow [BCP 47][].  Direction can be `ltr` or `rtl`.  Source is 
`app` for languages bundled with the application, `extra` for languages from 
language packages and `qps` for pseudo-languages.

[BCP 47]: http://tools.ietf.org/html/bcp47

```javascript
view.resolvedLanguages().then(
  langs => console.log(langs));
// -> [{ code: 'pl', dir: 'ltr', src: 'extra' },
       { code: 'en-US', dir: 'ltr', src: 'app' }]
```


### view.requestLanguages(langCodes)

Trigger the language negotation process with an array of `langCodes`.  Returns 
a promise with the negotiated array of language objects as above.

```javascript
view.requestLanguages(['de-DE', 'de', 'en-US']);
```


### view.formatValue(id, args)

Retrieve the translation corresponding to the `id` identifier.

If passed, `args` is a simple hash object with a list of variables that will be 
interpolated in the value of the translation.

Returns a Promise resolving to the translation string.

```javascript
view.formatValue('hello', { who: 'world' }).then(
  hello => console.log(hello));
// -> 'Hello, world!'
```

Use this sparingly for one-off messages which don't need to be retranslated 
when the user changes their language preferences.


### view.formatValues(...keys)

A generalized version of `view.formatValue`.  Retrieve translations 
corresponding to the passed keys.  Keys can either be simple string identifiers 
or `[id, args]` arrays.

Returns a Promise resolving to an array of the translation strings.

```javascript
view.formatValues(
  ['hello', { who: 'Mary' }],
  ['hello', { who: 'John' }],
  'welcome'
).then(([helloMary, helloJohn, welcome]) =>
  console.log(helloMary, helloJohn, welcome));
// -> 'Hello, Mary!', 'Hello, John!', 'Welcome!'
```


### view.setAttributes(elem, id, args)

Set the `data-l10n-id` and `data-l10n-args` attributes on DOM elements.

L20n makes use of mutation observers to detect changes to `data-l10n-*`
attributes and translate elements asynchronously.  `setAttributes` is 
a convenience method which allows to translate DOM elements declaratively.

You should always prefer to use `data-l10n-id` on elements (statically in HTML 
or dynamically via `setAttributes`) over manually retrieving translations with 
`format`.  The use of attributes ensures that the elements can be retranslated 
when the user changes their language preferences.

```javascript
view.setAttributes(
  document.querySelector('#welcome'), 'hello', { who: 'world' });
```

This will set the following attributes on the `#welcome` element.  L20n's 
MutationObserver will pick up this change and will localize the element 
asynchronously.

```html
<p id='welcome' data-l10n-id='hello' data-l10n-args='{"who": "world"}'></p> 
```


### view.getAttributes(elem)

Get the `data-l10n-*` attributes from DOM elements.

```javascript
view.getAttributes(
  document.querySelector('#welcome'));
// -> { id: 'hello', args: { who: 'world' } }
```


### view.translateFragment(frag)

Translate a DOM node or fragment asynchronously.

You can manually trigger translation (or re-translation) of a DOM fragment with 
`translateFragment`.  Use the `data-l10n-id` and `data-l10n-args` attributes to 
mark up the DOM with information about which translations to use.

Returns a Promise.
