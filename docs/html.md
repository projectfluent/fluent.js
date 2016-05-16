The HTML Bindings
=================

You can take advantage of HTML bindings to localize your HTML documents 
with L20n.  


Build
-----

In order to use the most up-to-date version of L20n, build it manually:

    $ git clone https://github.com/l20n/l20n.js
    $ cd l20n.js
    $ npm install
    $ make build

This will build a number of variants of L20n called *runtimes*.  Use the *web* 
runtime to localize your HTML app.  It's recommended to include the l20n.js 
file as the first deferred script in the `head` element.

```html
<head>
  …
  <script defer src="dist/bundle/web/l20n.js"></script>
</head>
```


Configure Languages
-------------------

In order to know which language to display to the user, L20n needs the 
information about the languages your app is available in, as well as the 
default language.

```html
<meta name="defaultLanguage" content="en-US">
<meta name="availableLanguages" content="de, en-US, fr, pl">
```


Add Resources
-------------

L20n.js supports FTL translation resources, as documented at 
http://l20n.org/learn/.

Include them in the `<head>` of your HTML:

```html
<link rel="localization" href="locales/base.{locale}.ftl">
<link rel="localization" href="locales/app.{locale}.ftl">
```


Making HTML Elements Localizable
--------------------------------

Use the `data-l10n-id` attribute on a node to mark it as localizable.

```html
<p data-l10n-id="about"></p>
```

Notice that you don't have to put the text content in the HTML anymore (you 
still can if you want to).  All content lives in the localization resources.

Use the `data-l10n-args` attribute to pass additional data into translations 
which will be interpolated via the `{ }` syntax.  The data should be 
serialized JSON.

```html
<h1 data-l10n-id="hello" data-l10n-args='{"username": "Mary"}'></h1>
```

Given the following translation:

```properties
hello = Hello, { $username }!
```

…the result will be as follows (`data-` attributes omitted for 
clarity):

```html
<h1>Hello, Mary!</h1>
```

The first time all DOM nodes are localized, the `document.l10n.ready` promise 
will resolve.  On every following re-translation due to languages change, 
the `document` will fire a `DOMRetranslated` event.


The document.l10n API
---------------------

The main abstraction used by the JavaScript API is the `HTMLLocalization` 
class.  It is responsible for localizing `document` objects in HTML.  Each 
`document` will have its corresponding `HTMLLocalization` instance created 
automatically on startup, as `document.l10n`.


### document.l10n.ready

A Promise which resolves when the `document` is first translated.

```javascript
document.l10n.ready.then(App.init);
```


### document.l10n.requestLanguages(langCodes)

Trigger the language negotation process with an array of `langCodes`.  Returns 
a promise with the negotiated array of language objects as above.

```javascript
document.l10n.requestLanguages(['de-DE', 'de', 'en-US']);
```


### document.l10n.formatValue(id, args)

Retrieve the translation corresponding to the `id` identifier.

If passed, `args` is a simple hash object with a list of variables that will be 
interpolated in the value of the translation.

Returns a Promise resolving to the translation string.

```javascript
document.l10n.formatValue('hello', { who: 'world' }).then(
  hello => console.log(hello));
// -> 'Hello, world!'
```

Use this sparingly for one-off messages which don't need to be retranslated 
when the user changes their language preferences.


### document.l10n.formatValues(...keys)

A generalized version of `document.l10n.formatValue`.  Retrieve translations 
corresponding to the passed keys.  Keys can either be simple string identifiers 
or `[id, args]` arrays.

Returns a Promise resolving to an array of the translation strings.

```javascript
document.l10n.formatValues(
  ['hello', { who: 'Mary' }],
  ['hello', { who: 'John' }],
  'welcome'
).then(([helloMary, helloJohn, welcome]) =>
  console.log(helloMary, helloJohn, welcome));
// -> 'Hello, Mary!', 'Hello, John!', 'Welcome!'
```


### document.l10n.setAttributes(elem, id, args)

Set the `data-l10n-id` and `data-l10n-args` attributes on DOM elements.

L20n makes use of mutation observers to detect changes to `data-l10n-*`
attributes and translate elements asynchronously.  `setAttributes` is 
a convenience method which allows to translate DOM elements declaratively.

You should always prefer to use `data-l10n-id` on elements (statically in HTML 
or dynamically via `setAttributes`) over manually retrieving translations with 
`format`.  The use of attributes ensures that the elements can be retranslated 
when the user changes their language preferences.

```javascript
document.l10n.setAttributes(
  document.querySelector('#welcome'), 'hello', { who: 'world' });
```

This will set the following attributes on the `#welcome` element.  L20n's 
MutationObserver will pick up this change and will localize the element 
asynchronously.

```html
<p id='welcome' data-l10n-id='hello' data-l10n-args='{"who": "world"}'></p> 
```


### document.l10n.getAttributes(elem)

Get the `data-l10n-*` attributes from DOM elements.

```javascript
document.l10n.getAttributes(
  document.querySelector('#welcome'));
// -> { id: 'hello', args: { who: 'world' } }
```


### document.l10n.translateFragment(frag)

Translate a DOM node or fragment asynchronously.

You can manually trigger translation (or re-translation) of a DOM fragment with 
`translateFragment`.  Use the `data-l10n-id` and `data-l10n-args` attributes to 
mark up the DOM with information about which translations to use.

Returns a Promise.
