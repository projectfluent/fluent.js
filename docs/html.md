The HTML Bindings
=================

You can take advantage of HTML bindings to localize your HTML documents 
with L20n.  


Install
-------

Production builds of L20n are available in the `dist` directory on release 
branches ([v1.0.x][], [v2.x][], [v3.x][]).  Major versions differ in API and 
are not backwards-compatible.  Please use [v3.x][] if you can.

You can also use [bower][] to install L20n:

    bower install l20n#v3.x

The `dist/` directory contains subdirectories with different variations of 
L20n (called _runtimes_).  The `webcompat` runtime is best suited for webpages 
and is written in ES5.  The `web` runtime is written in ES2015.

[v1.0.x]: https://github.com/l20n/l20n.js/tree/v1.0.x/dist
[v2.x]: https://github.com/l20n/l20n.js/tree/v2.x/dist
[v3.x]: https://github.com/l20n/l20n.js/tree/v3.x/dist
[bower]: http://bower.io/

Finally, include L20n in your HTML.  It's recommended to include the l20n.js 
file as the first deferred script in the `head` element.

```html
<head>
  …
  <script defer src="dist/webcompat/l20n.js"></script>
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

_Optional:_ If you're also providing user-installable language packages via L20n, specify 
the app version:

```html
<meta name="appVersion" content="2.5">
```


Add Resources
-------------

L20n.js supports three kinds of translation resources:

 - L20n syntax, as documented at http://l20n.org/learn/,
 - properties syntax: https://en.wikipedia.org/wiki/.properties (deprecated),
 - JSON files parsed by `tools/parse.js -o entries`.

Include them in the `<head>` of your HTML:

```html
<link rel="localization" href="locales/myApp.{locale}.l20n">
<link rel="localization" href="locales/myApp.{locale}.properties">
<link rel="localization" href="locales/myApp.{locale}.json">
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
which will be interpolated via the `{{ }}` syntax.  The data should be 
serialized JSON.

```html
<h1 data-l10n-id="hello" data-l10n-args='{"username": "Mary"}'></h1>
```

Given the following translation:

```php
<hello "Hello, {{ $username }}!">
```

…the result will be as follows (`data-` attributes omitted for 
clarity):

```html
<h1>Hello, Mary!</h1>
```

The first time all DOM nodes are localized, the `document.l10n.ready` promise 
will resolve.  On every following re-translation due to languages change, 
`document` will fire a `DOMRetranslated` event.
