L20n: Localization 2.0 [![Build Status][travisimage]][travislink]
=================================================================

[travisimage]: https://travis-ci.org/l20n/l20n.js.svg?branch=master
[travislink]: https://travis-ci.org/l20n/l20n.js

L20n reinvents software localization. Users should be able to benefit from the 
entire expressive power of a natural language.  L20n keeps simple things 
simple, and at the same time makes complex things possible.

L20n.js is a localization framework for websites which want to offer 
a best-in-class translation experience for their users.  L20n takes advantage 
of modern web technologies to offer a fast and lean localization of HTML and 
JavaScript.


How to use L20n
---------------

Include the following code in the `<head>` section of your HTML:

```html
<meta name="defaultLanguage" content="en-US">
<meta name="availableLanguages" content="de, en-US, fr, pl">
<link rel="localization" href="locales/myApp.{locale}.ftl">
<script defer src="dist/bundle/web/l20n.js"></script>
```

L20n.js supports FTL translation resources, as documented at 
http://l20n.org/learn/.


What L20n's syntax looks like
-----------------------------

A straight-forward example in English:

```properties
brand-name = Firefox
about      = About { brand-name }
settings   = { brand-name } Settings
```

And the same thing in Polish:

```properties
brand-name =
 *[nominative]   Firefox
  [genitive]     Firefoksa
  [dative]       Firefoksowi
  [accusative]   Firefoksa
  [instrumental] Firefoksem
  [locative]     Firefoksie
about      = O { brand-name[locative] }
settings   = Ustawienia { brand-name[genitive] }
```

Visit [FTL by Example](http://l20n.org/learn) to learn more about FTL's 
syntax.


Localizing Web content with HTML Bindings
------------------------------------------

You can take advantage of HTML bindings to localize your HTML documents with 
L20n.  See [docs/html][] for documentation and examples.

[docs/html]: https://github.com/l20n/l20n.js/blob/master/docs/html.md


The JavaScript API and documentation
------------------------------------

It is also possible to use L20n programmatically, for instance in order to 
localize dynamic content.  Refer to [docs/node][] and [docs/view][] for more 
details.

[docs/node]: https://github.com/l20n/l20n.js/blob/master/docs/node.md
[docs/view]: https://github.com/l20n/l20n.js/blob/master/docs/view.md


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
