L20n: Localization 2.0
======================

L20n reinvents software localization. Users should be able to benefit from the 
entire expressive power of a natural language.  L20n keeps simple things 
simple, and at the same time makes complex things possible.


What L20n looks like
--------------------

A straight-forward example in English:

```php
<brandName "Firefox">
<about "About {{ brandName }}">
```

And the same thing in Polish:

```php
<brandName {
  nominative: "Firefox",
  genitive: "Firefoksa",
  dative: "Firefoksowi",
  accusative: "Firefoksa",
  instrumental: "Firefoksem",
  locative: "Firefoksie"
}>
<about "O {{ brandName.locative }}">
```


The JavaScript API
------------------

```javascript
var ctx = L20n.getContext();
ctx.linkResource('./locales/strings.l20n');
ctx.freeze();
```

When you freeze the context, the resource files will be retrieved, parsed and 
compiled.  Register calls back to execute when the context is ready, or register calls back to listen 
to the `LocalizationReady` event emitted by `document.l10n`.

```javascript
document.l10n.localize(['hello', 'new'], function(l10n) {
  var node = document.querySelector('[data-l10n-id=hello]');
  node.textConent = l10n.entities.hello;
  node.classList.remove('hidden');
});
```


The HTML Bindings
-----------------

You can take advantage of HTML bindings to localize your HTML documents 
with L20n.  We maintain a repository with L20n optimized for production use:

 - [one file](https://github.com/l20n/l20n.min.js/blob/master/l20n.js) (~100KB)
 - [one file, minified](https://github.com/l20n/l20n.min.js/blob/master/min/l20n.js) (~30KB)

It's recommended to include the l20n.js file as the last script in the `head` 
element.

```html
<head>
  …
  <script src="l20n.js"></script>
</head>
```

### Adding resources

You can embed localization resources right in your HTML.  This may be useful 
when you first start a new project, or when determining server-side language negotiation.

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
<script type="application/l20n" src="../locales/browser.l20n"></script>
```

Once you're ready to provide a multilingual version of your app, use 
a localization *manifest* to define available languages and their resource files.

```html
<link rel="localization" href="../locales/browser.json">
```

An example of the manifest file:
    
```json
{
  "languages": [
    "en-US",
    "pl"
  ],
  "resources": [
    "../locales/{{lang}}/browser.l20n",
    "/shared/{{lang}}/date.l20n"
  ]
}
```

### Making HTML elements localizable

Use the `data-l10n-id` attribute on a node to mark it as localizable.

```html
<p data-l10n-id="about"></p>
```

Notice that you don't have to put the text content in the HTML anymore (you 
still can if you want to).  All content lives in the localization resources.

When all DOM nodes are localized, `document` will fire a `DocumentLocalized` 
event.

### Exposing context data

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

This data will be available context-wide to all localized strings.


Further Reading
---------------
You can find the documentation for localizers, developers and contributors at 
the [Mozilla Developer Network][].  The original design documents can be found 
at the [Mozilla Wiki][].  We also use the wiki for release planning.

[Mozilla Developer Network]: https://developer.mozilla.org/en-US/docs/L20n
[Mozilla Wiki]: https://wiki.mozilla.org/L20n


Discuss
-------
We'd love to hear your thoughts on L20n!  Whether you're a localizer looking 
for a better way to express yourself in your language, or a developer trying to 
make your app localizable and multilingual, or a hacker looking for a project 
to contribute to, please do get in touch on the mailing list and the IRC 
channel.

 - mailing list: https://lists.mozilla.org/listinfo/tools-l10n
 - IRC channel: [irc://irc.mozilla.org/l20n](irc://irc.mozilla.org/l20n)


Get Involved
------------
L20n is open-source, MPL 2-licensed.  We encourage everyone to take a look at 
our code and we'll listen to your feedback.

We use Bugzilla to track our work. Visit our [Tracking] page for a collection of useful links 
and information about our release planning.  You can also go straight to the [Dashboard][] or [file a new bug][].

We <3 GitHub, but we prefer `text/plain` patches over pull requests.  Refer to 
the [Contributor's documentation][]  for more information.

[Tracking]: https://wiki.mozilla.org/L20n/Tracking 
[Dashboard]: https://bugzilla.mozilla.org/page.cgi?id=productdashboard.html&product=L20n&bug_status=open&tab=summary
[file a new bug]: https://bugzilla.mozilla.org/enter_bug.cgi?product=L20n
[Contributor's documentation]: https://developer.mozilla.org/en-US/docs/L20n/Contribute
