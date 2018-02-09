Project Fluent [![Build Status][travisimage]][travislink]
=========================================================

[travisimage]: https://travis-ci.org/projectfluent/fluent.js.svg?branch=master
[travislink]: https://travis-ci.org/projectfluent/fluent.js

Fluent.js is a JavaScript implementation of Project Fluent, a localization
framework designed to unleash the expressive power of the natural language.

Project Fluent keeps simple things simple and makes complex things possible.
The syntax used for describing translations is easy to read and understand.  At
the same time it allows, when necessary, to represent complex concepts from
natural languages like gender, plurals, conjugations, and others.


Packages
--------

Fluent.js consists of a set of packages which have different use-cases and can
be installed independently of each other.

  - [fluent](https://github.com/projectfluent/fluent.js/tree/master/fluent)
  - [fluent-syntax](https://github.com/projectfluent/fluent.js/tree/master/fluent-syntax)
  - [fluent-intl-polyfill](https://github.com/projectfluent/fluent.js/tree/master/fluent-intl-polyfill)
  - [fluent-langneg](https://github.com/projectfluent/fluent.js/tree/master/fluent-langneg)
  - [fluent-react](https://github.com/projectfluent/fluent.js/tree/master/fluent-react)
  - [fluent-merge](https://github.com/projectfluent/fluent.js/tree/master/fluent-merge)

You can install each of the above packages via `npm`, e.g. `npm install
fluent-react`.  See the end of this `README` for instructions on how to build
`fluent.js` locally.


Learn the FTL syntax
--------------------

FTL is a localization file format used for describing translation resources.
FTL stands for _Fluent Translation List_.

FTL is designed to be simple to read, but at the same time allows to represent
complex concepts from natural languages like gender, plurals, conjugations,
and others.

    hello-user = Hello, { $username }!

[Read the Fluent Syntax Guide][] in order to learn more about the syntax.  If
you're a tool author you may be interested in the formal [EBNF grammar][].

[Read the Fluent Syntax Guide]: http://projectfluent.org/fluent/guide/
[EBNF grammar]: https://github.com/projectfluent/fluent/tree/master/spec


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


Local Development
-----------------

Hacking on `fluent.js` is easy! To quickly get started clone the repo:

    $ git clone https://github.com/projectfluent/fluent.js.git
    $ cd fluent.js

You'll need node.js 8 LTS (v8.9.0 and up). Older 8.x versions and 7.x
versions have been reported to work as well. node.js 6.x is not supported.

Install the build tools used by all packages (Babel, Rollup, Mocha etc.):

    $ npm install

Install dependencies of individual `fluent.js` packages which are required for
passing tests:

    $ make deps

Build all packages at once:

    $ make

…which is equivalent to:

    $ make lint
    $ make test
    $ make build

You can also `cd` into a package's directory and issue the above `make`
commands from there.  Only this one package will be affected.
