L20n: Localization 2.0 [![Build Status][travisimage]][travislink]
=================================================================

[travisimage]: https://travis-ci.org/l20n/l20n.js.png?branch=master
[travislink]: https://travis-ci.org/l20n/l20n.js

L20n reinvents software localization. Users should be able to benefit from the 
entire expressive power of a natural language.  L20n keeps simple things 
simple, and at the same time makes complex things possible.


What L20n's syntax looks like
-----------------------------

A straight-forward example in English:

```php
<brandName "Firefox">
<about "About {{ brandName }}">
<preferences "{{ brandName }} Preferences">
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
<preferences "Preferencje {{ brandName.genitive }}">
```

Visit [L20n by Example](http://l20n.org/learn) to learn more about L20n's 
syntax.


Localizing Web content with HTML Bindings
------------------------------------------

You can take advantage of HTML bindings to localize your HTML documents with 
L20n.  See [docs/html][] for documentation and examples.

[docs/html]: https://github.com/l20n/l20n.js/blob/master/docs/html.md


The JavaScript API and documentation
------------------------------------

L20n encloses localization into so-called contexts.  A context is an 
independent object with its own set of localization resources and available 
languages.  You can have more than one context at the same time.

```javascript
var ctx = L20n.getContext();
ctx.linkResource('./locales/strings.l20n');
ctx.requestLocales();
```

When you freeze the context by calling `requestLocales`, the resource files 
will be retrieved, parsed and compiled.  You can listen to the `ready` event 
(emitted by the `Context` instance when all the resources have been compiled) 
and use `ctx.getSync` and `ctx.getEntitySync` to get translations 
synchronously.

Alternatively, you can register callbacks to execute when the context is ready 
(or when globals change and translations need to be updated) with 
`ctx.localize`.

```javascript
ctx.localize(['hello', 'new'], function(l10n) {
  var node = document.querySelector('[data-l10n-id=hello]');
  node.textContent = l10n.entities.hello.value;
  node.classList.remove('hidden');
});
```

You can find the complete documentation for localizers, developers and 
contributors at the [Mozilla Developer Network][].  The original design 
documents can be found at the [Mozilla Wiki][].  We also use the wiki for 
release planning.

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
L20n is open-source, licensed under the Apache License, Version 2.0.  We 
encourage everyone to take a look at our code and we'll listen to your 
feedback.

We use Bugzilla to track our work. Visit our [Tracking] page for a collection 
of useful links and information about our release planning.  You can also go 
straight to the [Dashboard][] or [file a new bug][].

We <3 GitHub, but we prefer `text/plain` patches over pull requests.  Refer to 
the [Contributor's documentation][]  for more information.

[Tracking]: https://wiki.mozilla.org/L20n/Tracking 
[Dashboard]: https://bugzilla.mozilla.org/page.cgi?id=productdashboard.html&product=L20n&bug_status=open&tab=summary
[file a new bug]: https://bugzilla.mozilla.org/enter_bug.cgi?product=L20n
[Contributor's documentation]: https://developer.mozilla.org/en-US/docs/L20n/Contribute
