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


Adding Resources
----------------

You can embed localization resources right in your HTML.  This may be useful 
when you first start a new project, or when determining server-side language 
negotiation.

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

Once you're ready to provide a multilingual version of your app, use 
a localization *manifest* to define available languages and their resource 
files.

```html
<link rel="localization" href="../locales/manifest.json">
```

An example of the manifest file:
    
```json
{
  "locales": [
    "en-US",
    "pl"
  ],
  "resources": [
    "../locales/{{locale}}/strings.l20n",
    "/shared/{{locale}}/date.l20n"
  ]
}
```

Making HTML Elements Localizable
--------------------------------

Use the `data-l10n-id` attribute on a node to mark it as localizable.

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
elements, but only modifies their text nodes and their attributes.  The 
limitation of the current implementation is that it is yet not possible to 
reorder elements in the translation (things may break if you try).  See [bug 
922576][].

[bug 922576]: https://bugzilla.mozilla.org/show_bug.cgi?id=922576
[elements]: http://www.w3.org/html/wg/drafts/html/CR/text-level-semantics.html#text-level-semantics
[attributes]: http://www.w3.org/html/wg/drafts/html/CR/dom.html#the-translate-attribute

When all DOM nodes are localized, `document` will fire a `DocumentLocalized` 
event.

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

