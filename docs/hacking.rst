=======
Hacking
=======

L20n library is a combination of three layers of APIs built on top of each other.
The intention is for the user to be able to use just the first or first and the second
layer separately.

Each layer has different external dependencies and is intended to tie better into the
host and client environments.

Intl API
========

The bottom layer is completely dependency-free and environment independent.
It's shaped similarly to `ICU MessageFormat`_ API.

Entity
------

A single localization unit in L20n vocabulary is called an entity.
An entity is an ``Object`` with three fields:

:id:
    An identifier

:value:
    A value that may be a simple or more complex computable string.

:traits:
    A list of key-value pairs that can be providing additional data for the entity like
    attributes or variants.

Entities are encoded in a source format named FTL. L20n provides two parsers for the
format. The full AST parser is available for tools and external users who need
access to the full AST of the file.
For runtime purposes, L20n uses a smaller and faster Entries parser, which
has many optimizations that target performance and smaller memory footprint.

MessageContext
--------------

``MessageContext`` is a synchronous single-locale Map and doesn't provide any fallback.

It parses source string into a list of messages, and allows the user to retrieve
``Entity`` objects formatted using environmental variables, user provided arguments,
other messages in the context and any syntax that the format allows for.

The entities are parsed into a lazy intermittent form and then formatted
and cached only on retrieval.


``MessageContext`` has two methods:

:constructor(lang, options):
    lang
        a language tag string
    options 
        functions
            an object with environmental function that are going to be available
            from within the entities.
    
:addMessages(source):
    takes a localization file source (at the moment FTL file format is supported),
    parses the source into localization messages and stores them.

:format(entity, args, errors):
    fromats a message and returns it as an Object.

Example::

  const brandStrings = `brandName = Loki`;

  const strings = `

  hello-world = Hello { $userName }! Welcome to { brandName } 
  open-pref = { OS() ->
    [mac] Open Preferences
   *[other] Open Settings 
  }

  `;

  const mc = new MessageContext('en-US', {
    functions: {
      'OS': function() {
        return env.platform;
      }
    }
  });

  mc.addMessages(brandStrings);
  mc.addMessages(strings);

  const str1 = mc.format('hello-world', {
    userName: 'John'
  });

  // str1 === "Hello John! welcome to Loki"

Localization API
===================

Second layer has two fundamental features over the first one.
It interacts with environment by using I/O to load resources and it is multi-lignual
with language fallbacking.

Due to those two differences, it's fully asynchronous.

ResourceBundle
--------------

A bundle is a single-locale object that holds collection of resource sources
necessary for a given ``Localization`` object and corresponding ``MessageContext`` object.

``ResourceBundle`` API:

:lang:
    Language tag associated with the bundle

:loaded:
    Either ``false`` or a promise that returns a list of resources for the bundle.

:resIds:
    List of resources for the bundle.

:fetch():
    Returns a Promise that resolves to a list of resources for the bundle

Example::

  const bundle = new ResourceBundle('en-US', [
    '/locales/en-US/brand.ftl',
    '/locales/en-US/menu.ftl'
  ]);

  bundle.lang; // 'en-US'
  bundle.resIds; // ['/locales/en-US/brand.ftl', '/locales/en-US/menu.ftl']
  bundle.loaded; // false
  bundle.fetch().then(sources => {
    const mc = new MessageContext(bundle.lang);
    sources.forEach(source => {
      mc.addMessages(source);
    });
  });


Localization
------------

The main class on this level is ``Localization``. One can think of it as a
multi-lingual, asynchronous wrapper on top of ``MessageContext`` which handles lazy-IO
and fallbacks.

:constructor(requestBundles, createContext):
    requestBundles
        An asynchronous function that returns a list of `ResourceBundle` objects.
    createContext
        A synchronous function which returns a new ``MessageContext`` object.

:requestLanguages(requestedLangs):
    An asynchronous function which allows user to change the fallback languages
    chain for ``Localization``.

:formatValue(id, args):
    An asynchronous function that given entity ``id`` and user provided ``args``
    returns a formatted value for the requested entity performing optional fallback.

:formatValues(...keys):
    A multi-kvp version of ``formatValue`` which allows for retrieving many
    entities in one async call.

:formatEntities(keys):
    A multi-kvp function that returns full ``Entity`` objects, not just their values.
    Useful for cases where the user wants to retrieve traits as well.

The reason ``createContext`` and ``requestBundles`` are callbacks is to allow
the user to provide different ways to build bundles and create contexts with different
environment functions without having to modify the observer.

Example::

  const resIds = [
    '/locales/{locale}/brand.ftl',
    '/locales/{locale}/menu.ftl'
  ];
  const defaultLang = 'en-US';
  const availableLangs = ['en-US', 'pl', 'fr'];

  function requestBundles(requestedLangs = new Set(navigator.languages)) {
    return prioritizeLocales(defaultLang, availableLangs, requestedLangs).then(langs => {
      return langs.map(lang => new ResourceBundle(lang, resIds));
    });
  }

  function createContext(lang) {
    return new MessageContext(lang, {
      functions: {
        OS: function() { return navigator.platform; },
        UserName: function() { Settings.user.name; }
      }
    });
  }

  const localization = new HTMLLocalization(requestBundles, createContext);

  localization.formatValue('menu-ok').then(str => {
    console.log(str);
  });

Localization Observer object
============================

Third layer is a class that binds Localization object to the host environment.

An example of it is when L20n is used for HTML/JS localization, in which case the
observer hooks via ``MutationObserver`` into DOM and exposes itself on ``document.l10n``
with methods for L10n DOM manipulation.
This is also the class where HTML Element translation functions will be exposed.

This layer will be competly different for Node.js environment, for Python environment etc.

HTMLLocalizationObserver
------------------------

``HTML Localization Observer`` exposes the following API:

:setAttributes(element, id, args):
    Sets the DOM attributes `data-l10n-id` and `data-l10n-args` for the element. 
:getAttributes(element):
    Returns an Object with ``id`` and ``args`` for the given element.
:has(name):
    Tests if the ``LocalizationObserver`` has a ``Localization`` object for a given name.
:get(name):
    Returns a ``Localization`` object for a given name.
:set(name, value):
    Adds a new ``Localization`` instance with a given name.
:observeRoot(root, l10n):
    Adds a new root that is going to be translated and observed by this observer.
    If ``l10n`` is omitted, it'll use the default ``main`` ``Localization`` object.
:disconnectRoot:
    Removes a root from the list of observed roots.
:translateElement(element):
    Translates a single element using a ``Localization`` object from its collection.
:translateFragment(frag):
    Translates a DOMFragment using ``Localization`` objects from its collection.
:translateAllRoots():
    Translates all roots which the ``LocalizationObserver`` is observing
:requestLanguages(requestedLangs):
    Updates the requested languages list, recreates the fallback chain and
    potentially retranslates into the new negotiated locale.
:pause():
    Pause ``MutationObserver``.
:resume:
    Resumes ``MutationObserver``.


``LocalizationObserver`` may hold references to multiple ``Localization`` objects and
user may bind multiple DOM element roots to it, but in the example below we'll just use one of each::

  const l10n = new HTMLLocalization(requestBundles, createContext);

  document.l10n = new HTMLLocalizationObserver();

  document.l10n.set('main', l10n);
  document.l10n.observeRoot(document.documentElement, l10n);
  document.l10n.translateAllRoots();

Conclusion
==========
With this in place, you should now understand the structure and flow of code
in L20n library and can start hacking on it!

.. _ICU MessageFormat: http://userguide.icu-project.org/formatparse/messages
