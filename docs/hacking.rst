=======
Hacking
=======

This document is intended as a guide for people interested in contributing to 
l20n.js or curious about its inner workings.  It presents an overview of the 
architecture of l20n.js.

The l20n.js library is built as a combination of three layers of APIs stacked on 
top of each other.  This modularization allows l20n.js to support many 
different environments and platforms.

Intl
    The low-level API providing single-purpose building blocks for l20n.js.

Localization
    The main l20n.js class responsible for language negotiation, resource 
    loading and the fallback strategy.

LocalizationObserver
    The manager class used to bind to the host environment.

Each layer has different external dependencies and is intended to tie better 
into the host and client environments.  In addition to the above three layers 
there's also the so-called runtime code which is responsible for instantiating 
the proper classes, attaching event listeners and triggering the initial 
translation of the UI.


The Intl API
============

L20n.js builds on top of the JavaScript Intl API (ECMA 402).  L20n.js uses 
``Intl.NumberFormat`` to format numbers in a locale-aware manner and 
``Intl.DateTimeFormat`` to format dates.  Other features are implemented as 
extensions to the Intl API modeled after the existing ECMA specifications.  We
work with ECMA to enhance the APIs which address the needs of L20n and other 
libraries needing access to internationalized data.

``ListFormat``
    Provides a way to format lists and enumerations in a locale-aware manner.  
    Proposed to ECMA 402 as `Intl.ListFormat`_.

``PluralRules``
    Returns CLDR plural categories (zero, one, two, few, many, other) using the
    given locale's plural rule. Proposed to ECMA 402 as `Intl.PluralRules`_.

``MessageContext``
    Formats translations to strings allowing for interpolating external 
    arguments passed in by the developer and some more logic if needed.


Entity
------

A single localization unit in ``MessageContext`` is called an entity.  An entity 
has an identifier, a value and traits.

id
    The unique identifier of the entity.

value
    The entity's value. It may be null.

traits
    A list of key-value pairs that can be providing additional data for the entity like
    attributes or variants. It may be empty.

Entities are encoded in a source format named FTL. l20n.js has two FTL parsers.
The full AST parser is available for tools and external consumers who need
access to the full AST.  For runtime purposes, l20n.js uses a smaller and 
faster Runtime parser, which has many optimizations that target performance and 
smaller memory footprint.


MessageContext
--------------

``MessageContext`` is a synchronous single-locale map of translations.  It can 
format translations to strings.

Translations must be defined in the `FTL syntax`_ and can be added with the 
``addMessages`` method.  They are internally parsed into a lazy intermittent 
form and then formatted only on retrieval.  The ``format`` method allows the 
user to format them using environmental variables, user-provided arguments, 
other messages in the current context and any other syntax that the format 
allows.

Translation resources may come from a third party and need not go through 
a review.  Translations are thus considered untrusted.  ``MessageContext`` has been 
designed to be resilient to formatting errors.  If a translation contains 
errors, ``MessageContext`` will try to salvage as much of the translation as 
possible and will still return a string.

The ``format`` method of ``MessageContext`` takes an additional parameter, 
``errors``, which if provided must be an Array to which errors will be pushed.

Example::

  // Remove indentation from FTL samples below.
  const ftl = ([text]) => text.replace(/^\s*/mg, '');

  // Define two translation resources.
  const brandTranslations = ftl`
      brand-name = Loki
  `;
  const mainTranslations = ftl`
      hello-world = Hello { $username }! Welcome to { brand-name } 
      open-pref = { PLATFORM() ->
          [mac]    Open Preferences
         *[other]  Open Settings 
      }
  `;

  // Create the MessageContext instance with a custom PLATFORM function.
  const mc = new MessageContext('en-US', {
    functions: {
      PLATFORM: function() {
        return process.platform;
      }
    }
  });

  // Add and parse the FTL translations.
  mc.addMessages(brandTranslations);
  mc.addMessages(mainTranslations);

  // An array for collection formatting errors.
  const errors = [];

  const str1 = mc.format('hello-world', {
    username: 'John'
  }, errors);

  // str1 === "Hello John! Welcome to Loki"
  // errors.length == 0

  const str2 = mc.format('hello-world', null, errors);

  // str1 === "Hello username! Welcome to Loki"
  // errors.length == 1
  // errors[0] is a <ReferenceError: Unknown external: username>


The Localization API
====================

The ``Localization`` class represents the main functionality of l20n.js.  It 
can retrieve formatted translations in accordance to the user's language 
preferences, resorting to fallback languages in case of errors.  It also 
interacts with the environment via I/O in order to load resources.  It is the 
work-horse of l20n.js.  

In Web-like runtimes the ``Localization`` API is fully asynchronous.  This 
allows for loading fallback resources lazily in case of errors in the first 
language.

The ``Localization`` class can be thought of as a multi-lingual, asynchronous 
wrapper on top of multiple ``MessageContext`` instances which handles lazy-IO 
and the language fallback strategy.

Internally, ``Localization`` instances use an array of runtime-specific 
``ResourceBundle`` objects which represent information about localization 
resources: in particular, how to load them when they're needed, and where from.  
This array is the *de facto* fallback chain that will be used in case of 
fallback.  For each fetched ``ResourceBundle`` the ``Localization`` creates 
a corresponding ``MessageContext`` instance which it will use to format 
translations to the bundle's language.

The ``Localization`` constructor takes two runtime-specific functions as 
arguments, ``requestBundles`` and ``createContext``. This allows the user to 
provide different ways to build bundles, use different IO and language 
negotiation methods, as well as pass custom functions to the ``MessageContext``
constructor.  The ``Localization`` class itself is generic and 
environment-agnostic.


Example::

  // The list of unique resource identifiers that the Localization object will 
  // know about and use to retrieve formatted translations.
  const resourceIds = [
    '/brand.ftl',
    '/menu.ftl'
  ];

  // Used by Localization to request an array of ResourceBundle objects 
  // representing the information about language resources.
  function requestBundles(requestedLangs) {
    // Use the runtime-specific way of nagotiating languaes and loading resources.
    return L10nRegistry.getResources(requestedLangs, resourceIds);
  }

  // Used by Localization to create new MessageContext instances.  Can include 
  // runtime-specific FTL Functions.
  function createContext(lang) {
    return new MessageContext(lang, {
      functions: {
        PLATFORM: () => process.platform,
        USER: () => process.env.USER
      }
    });
  }

  const localization = new Localization(requestBundles, createContext);

  localization.formatValue('hello-world').then(alert);


The Localization Observer API
=============================

The ``LocalizationObserver`` class binds ``Localization`` objects to the host 
environment and provides environment-specific methods to localize content.  
Each environment will have its own ``LocalizationObserver`` class.

For instance, in Web-like runtimes the ``LocalizationObserver`` class has 
methods to localize DOM elements and fragments and uses the 
``MutationObserver`` API to monitor the DOM for changes to localizable nodes.  
It is exposed as ``document.l10n``.

The ``LocalizationObserver`` class implements the iteration protocol to serve 
as a collection of ``Localization`` instances which registered with it.

By default the runtime code will create a default ``Localization`` instance 
called ``main``.  XBL buildings and Web Components can create and register more 
``Localization`` instances and ask the ``LocalizationObserver`` to observe
their anonymous and shadow DOM trees respectively.

Example::

  // The LocalizationObserver is created early on.
  document.l10n = new LocalizationObserver();

  // Create a special-purpose Localization instance.
  const extra = new Localization(requestBundles, createContext);

  document.l10n.set('extra', extra);
  document.l10n.observeRoot(document.querySelector('#extra-content', extra);
  document.l10n.translateAllRoots();

In Web-like runtimes the ``LocalizationObserver`` provides the methods to 
localize DOM fragments and elements::

  document.l10n.translateFragment(node).then(…);

It also provides helper methods for working with ``data-l10n-*`` attributes::

  document.l10n.setAttributes(node, 'hello-user', { user: 'Jane' });
  document.l10n.getAttributes(node);

  // -> { id: 'hello-user', args: { user: 'Jane' } }


Conclusion
==========

This was quite a lot of information to take in — and you did it!  You should 
now understand the structure and the flow of code in l20n.js. Go start hacking 
on it! :)

.. _Intl.ListFormat: https://github.com/zbraniecki/proposal-intl-list-format
.. _Intl.PluralRules: https://github.com/tc39/proposal-intl-plural-rules
.. _FTL syntax: syntax.rst
