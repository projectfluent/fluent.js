The LocalizationObserver API
----------------------------

The `LocalizationObserver` class is responsible for localizing DOM trees.  It 
also implements the iterable protocol which allows iterating over and 
retrieving available `Localization` objects.

Each `document` will have its corresponding `LocalizationObserver` instance 
created automatically on startup, as `document.l10n`.


### LocalizationObserver.get(name)

Retrieve a reference to the `Localization` object associated with the name 
`name`.  See [docs/localization] for `Localization`'s API reference.

```javascript
const mainLocalization = document.l10n.get('main');
const extraLocalization = document.l10n.get('extra');
```

[docs/localization]: https://github.com/l20n/l20n.js/blob/master/docs/localization.md


### LocalizationObserver.requestLanguages(langCodes)

Trigger the language negotation process with an array of `langCodes`.  Returns 
a promise with the negotiated array of language objects as above.

```javascript
document.l10n.requestLanguages(['de-DE', 'de', 'en-US']);
```


### LocalizationObserver.setAttributes(elem, id, args)

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


### LocalizationObserver.getAttributes(elem)

Get the `data-l10n-*` attributes from DOM elements.

```javascript
document.l10n.getAttributes(
  document.querySelector('#welcome'));
// -> { id: 'hello', args: { who: 'world' } }
```


### LocalizationObserver.translateFragment(frag)

Translate a DOM node or fragment asynchronously.

You can manually trigger translation (or re-translation) of a DOM fragment with 
`translateFragment`.  Use the `data-l10n-id` and `data-l10n-args` attributes to 
mark up the DOM with information about which translations to use.

Returns a Promise.
