Project Fluent [![Build Status][travisimage]][travislink]
=========================================================

[travisimage]: https://travis-ci.org/projectfluent/fluent.js.svg?branch=master
[travislink]: https://travis-ci.org/projectfluent/fluent.js

Fluent.js is a JavaScript implementation of Project Fluent, a localization framework
designed to unleash the entire expressive power of natural language
translations.

Project Fluent keeps simple things simple and makes complex things possible.
The syntax used for describing translations is easy to read and understand.  At
the same time it allows, when necessary, to represent complex concepts from
natural languages like gender, plurals, conjugations, and others.


How to use Fluent.js
--------------------

When you require the `fluent-l10n` module it will add the `Intl.MessageContext`
constructor to the global `Intl` object, together with a few other polyfills.
You can consult the complete list of the polyfills in [src/intl/polyfill.js]. 

`Intl.MessageContext` provides the core functionality of parsing FTL files and
formatting translations from them.

[src/intl/polyfill.js]: https://github.com/projectfluent/fluent.js/blob/master/src/intl/polyfill.js

```javascript
require('fluent-l10n');

const ctx = new Intl.MessageContext('en-US');

const errors = ctx.addMessages(`
brand-name = Foo 3000
welcome    = Welcome, { $name }, to { brand-name }!
`);

if (errors.length) {
  // syntax errors are per-message and don't break the whole resource
}

const welcome = ctx.messages.get('welcome');

ctx.format(welcome, { name: 'Anna' });
// → 'Welcome, Anna, to Foo 3000!'
```

You can access other API methods by requiring the `fluent-l10n` module.  The
currently exposed functions can be found in [src/lib/index.js][].  Keep in mind
that `fluent-l10n` is in its 0.x days and that the exposed API may change.

[src/lib/index.js]: https://github.com/projectfluent/fluent.js/blob/master/src/lib/index.js


Learn the FTL syntax
--------------------

FTL is a localization file format used for describing translation resources.
FTL stands for _Fluent Translation List_.

FTL is designed to be simple to read, but at the same time allows to represent
complex concepts from natural languages like gender, plurals, conjugations,
and others.

    hello-user = Hello, { $username }!

Visit [projectfluent/syntax][] to [read the guide on FTL][] and learn the syntax.
If you're a tool author you may be interested in the formal [EBNF grammar][]
and the [ASDL description of the AST][].

[projectfluent/syntax]: https://github.com/projectfluent/syntax/
[read the guide on FTL]: https://github.com/projectfluent/syntax/blob/master/guide.rst
[EBNF grammar]: https://github.com/projectfluent/syntax/blob/master/fluent.ebnf
[ASDL description of the AST]: https://github.com/projectfluent/syntax/blob/master/fluent.asdl


Discuss
-------

We'd love to hear your thoughts on Project Fluent!  Whether you're a localizer looking 
for a better way to express yourself in your language, or a developer trying to 
make your app localizable and multilingual, or a hacker looking for a project 
to contribute to, please do get in touch on the mailing list and the IRC 
channel.

 - mailing list: https://lists.mozilla.org/listinfo/tools-l10n
 - IRC channel: [irc://irc.mozilla.org/l20n](irc://irc.mozilla.org/l20n)


Get Involved
------------

Fluent.js is open-source, licensed under the Apache License, Version 2.0.  We 
encourage everyone to take a look at our code and we'll listen to your 
feedback.
