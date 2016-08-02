The Localization API
--------------------

The `Localization` class is responsible for fetching resources and formatting 
translations.

l20n.js for HTML will create an instance of `Localization` for the default set 
of `<link rel="localization">` elements.  You can get a reference to it via:

```javascript
const localization = document.l10n.get('main');
```

Different names can be specified via the `name` attribute on the `<link>` 
elements.


### Localization.interactive

A Promise which resolves when the `Localization` instance has fetched and 
parsed all localization resources in the user's first preferred language (if 
available).

```javascript
localization.interactive.then(callback);
```


### Localization.formatValue(id, args)

Retrieve the translation corresponding to the `id` identifier.

If passed, `args` is a simple hash object with a list of variables that will be 
interpolated in the value of the translation.

Returns a Promise resolving to the translation string.

```javascript
localization.formatValue('hello', { who: 'world' }).then(
  hello => console.log(hello));
// -> 'Hello, world!'
```

Use this sparingly for one-off messages which don't need to be retranslated 
when the user changes their language preferences.


### Localization.formatValues(...keys)

A generalized version of `Localization.formatValue`.  Retrieve translations 
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
