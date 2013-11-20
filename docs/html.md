The HTML Bindings
=================

You can take advantage of HTML bindings to localize your HTML documents 
with L20n.  


Download L20n with HTML Bindings
--------------------------------

We maintain a repository with L20n optimized for production use:

 - [one file](https://github.com/l20n/builds/blob/master/l20n.js) (~110KB)
 - [one file, minified](https://github.com/l20n/builds/blob/master/l20n.min.js) (~35KB)

It's recommended to include the l20n.js file as the last script in the `head` 
element.

```html
<head>
  …
  <script src="l20n.js"></script>
</head>
```


Create Manifest
---------------

Use a localization *manifest* to define available languages and their resource 
files.

```html
<link rel="localization" href="../locales/manifest.json">
```

An example of the manifest file (all keys are required):
    
```json
{
  "locales": [
    "en-US",
    "pl"
  ],
  "default_locale": "en-US",
  "resources": [
    "../locales/{{locale}}/strings.l20n",
    "/shared/{{locale}}/date.l20n"
  ]
}
```


Make HTML Elements Localizable
------------------------------

Use the `data-l10n-id` attribute on an HTML element to mark it as localizable.

```html
<p data-l10n-id="about"></p>
```

Notice that you don't have to put the text content in the HTML anymore (you 
still can if you want to).  All content lives in the localization resources.

A safe subset of HTML [elements][] (e.g. `em`, `sup`), [attributes][] (e.g.
`title`) and entities can be used in translations.  In addition to the 
pre-defined whitelists, any element found in the original source HTML is 
allowed in the translation as well.  Consider the following source HTML:

```html
<p data-l10n-id="save">
  <input type="submit">
  <a href="/main" class="btn-cancel"></a>
</p>
```

Assume the following malicious translation:

```php
<save """
  <input value="Save" type="text"> or
  <a href="http://myevilwebsite.com"
     onclick="alert('pwnd!')"
     title="Back to the homepage">cancel</a>.
""">
```

The result will be:

```html
<p data-l10n-id="back">
  <input value="Save" type="submit"> or
  <a href="/main" class="btn-cancel"
     title="Back to the homepage">cancel</a>.
</p>
```

The `input` element is not on the default whitelist but since it's present in 
the source HTML, it is also allowed in the translation.  The `value` attribute 
is allowed on `input` elements, but `type` is not.  Similarly, `href` and 
`onclick` attributes are not allowed in translations and they are not inserted 
in the final DOM.  However, the `title` attribute is safe.

It is important to note that applying translations doesn't replace DOM 
elements, but only modifies their text nodes and their attributes.  This makes 
it possible to use L20n in conjunction with MVC frameworks.

[elements]: http://www.w3.org/html/wg/drafts/html/CR/text-level-semantics.html#text-level-semantics
[attributes]: http://www.w3.org/html/wg/drafts/html/CR/dom.html#the-translate-attribute

When all DOM nodes are localized, the `document` element will fire 
a `DocumentLocalized` event, which you can listen to:

```javascript
document.addEventListener('DocumentLocalized', function() {
  // the DOM has been localized and the user sees it in their language
  YourApp.init();
});
```


Exposing Context Data
---------------------

You can expose important bits of data to the localization context in form of 
*context data*.

```html
<script type="application/l10n-data+json">
{
  "newNotifications": 3,
  "user": {
    "name": "Jane",
    "gender": "feminine"
  }
}
</script>
```

This data will be available context-wide to all localized strings.  For 
instance, a string could use the information about the user's gender to provide 
two variants of the translation, like in the example below. See [L20n by 
Example][] to learn more about L20n's syntax. 

[L20n by Example]: http://l20n.org/learn/

```php
<invited[$user.gender] {
  feminine: "{{ $user.name }} has invited you to her circles.",
  masculine: "{{ $user.name }} has invited you to his circles.",
 *unknown: "{{ $user.name }} has invited you to their circles."
}>
```

Based on the context data defined above, this will produce:

    Jane has invited you to her circles.


Monolingual mode
----------------

L20n can also operate in the so-called monolingual mode, when there is only one 
locale available.  It doesn't have any specific locale code (internally, it's 
called `i-default` in compliance to [RFC 2277][]).  There is no language 
negotiation nor locale fallback possible in the monolingual mode.  L20n simply 
always uses this one default locale.

[RFC 2277]: http://www.iana.org/assignments/lang-tags/i-default

The monolingual mode may be useful when you first start a new project, when you 
want to test something quickly or when using server-side language negotiation.

In order to enable the monolingual mode, remove the manifest `link` from your 
HTML.  With no information about the available and the default locales, L20n 
will switch to the monolingual mode.  You can then embed localization resources 
right in your HTML.

```html
<script type="application/l20n">
  <brandName "Firefox">
  <about "About {{ brandName }}">
</script>
```

An alternative is to include localization resources in `script` elements.  Note 
that this still only works for a single language.  We plan to add support for 
a Language Pack Service in the future that can tap into this scenario on the 
client side.

```html
<script type="application/l20n" src="../locales/strings.l20n"></script>
```

Note that you currently _cannot_ use the manifest file _and_ manually add 
resources via `script` tags at the same time (bug [923670][]).

[923670]: https://bugzil.la/923670
