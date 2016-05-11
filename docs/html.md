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
