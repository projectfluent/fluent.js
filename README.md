L20n: Localization 2.0 [![Build Status][travisimage]][travislink]
=================================================================

[travisimage]: https://travis-ci.org/l20n/l20n.js.png?branch=master
[travislink]: https://travis-ci.org/l20n/l20n.js

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

Visit [L20n by Example](http://l20n.org/learn) to learn more about L20n's 
syntax.


The JavaScript API
------------------

```javascript
var ctx = L20n.getContext();
ctx.linkResource('./locales/strings.l20n');
ctx.freeze();
```

When you freeze the context, the resource files will be retrieved, parsed and 
compiled.  You can listen to the `ready` event (emitted by the `Context` 
instance when all the resources have been compiled) and use `ctx.get` and 
`ctx.getEntity` to get translations synchronously.

Alternatively, you can register callbacks to execute when the context is ready 
(or when globals change and translations need to be updated) with 
`ctx.localize`.

```javascript
ctx.localize(['hello', 'new'], function(l10n) {
  var node = document.querySelector('[data-l10n-id=hello]');
  node.textConent = l10n.entities.hello.value;
  node.classList.remove('hidden');
});
```

### ctx.registerLocales(...locales: String?)

Register the locales (language codes) passed as the arguments.

```javascript
ctx.registerLocales('es-AR', 'es-ES', 'en-US');
```

The list of locales should be the result of a client-side language negotiation 
between the HTML document and the browser.  It should include the original 
language of the document as the last element.

If `registerLocales` is called with a non-empty list of arguments, the Context 
instance will run in a multi-locale mode.  In this mode, the language fallback 
is enabled according to the negotiated fallback chain.  Each entity retrieved 
via `getEntity` or `localize` will also have a `locale` property denoting which 
language it is in.  (E.g., in the example above, if an entity is missing from 
`es-AR` and is found in `es-ES`, the `locale` property will be `es-ES`.)

If, on the other hand, `registerLocales` is called with an empty argument list, 
with a falsy argument or is not called at all, the Context instance will run in 
a single-locale mode.  In this mode there is no language negotiation nor 
language fallback.  All resources are added to a special locale internally 
called `__none__` and all retrieved entities come from it as well (their 
`locale` property is `undefined`).

`registerLocales` can be called after `freeze` to change the current language 
fallback chain, for instance if requested by the user.


### ctx.addResource(text: String)

Add a string as the content of a resource to the Context instance. 

```javascript
ctx.addResource('<hello "Hello, world!">');
```

The resource is added to all registered locales, or to the `__none__` 
locale in the single-locale mode.


### ctx.linkResource(uri: String)

Add a resource identified by a URL to the Context instance. 

```javascript
ctx.linkResource('../locale/app.lol');
```

The resource is added to all registered locales, or to the `__none__` 
locale in the single-locale mode.


### ctx.linkResource(template: Function)

Add a resource identified by a URL to the Context instance.  The URL is 
constructed dynamically when you call `freeze`.  The function passed to 
`linkResource` (called a _template function_) takes one argument which is the 
code of the current locale, which needs to be first registered with 
`registerLocales`.

```javascript
ctx.linkResource(function(locale) {
  return '../locales/' + locale + '/app.lol';
});
```

The resource is added to all registered locales.  If there are no registered 
locales, calling `freeze` with a template function as an argument will throw 
a `No registered locales` error in `freeze`.


### ctx.freeze()

Freeze the Context instance.  No more resources can be added after `freeze` is 
called.

All IO related to fetching the resource files takes place in `freeze`.  When 
all resources have been fetched, parsed and compiled, the Context instance will 
emit a `ready` event.


### ctx.addEventListener(event: String, callback: Function)

Register an event handler on the Context instance.

Currently available event types:

 - `ready` - fired when all resources are available and the Context instance is 
   ready to be used.  This event is also fired after each change to locale 
   order (retranslation).
 - `error` - fired when the Context instance encounters an error like:
   - entity could not be retrieved,
   - entity could not be found in the current locale,
   - entity value could not be evaluated to a string.

   The error object is passed as the first argument to `callback`.

 - `debug` - fired when an unknown JS error is thrown in the async code.  The 
   error object is passed as the first argument to `callback`.


### ctx.removeEventListener(event: String, callback: Function)

Remove an event listener previously registered with `addEventListener`.


### ctx.get(id: String, ctxdata: Object?)

Retrieve a string value of an entity called `id`.

If passed, `ctxdata` is a simple hash object with a list of variables that
extend the context data available for the evaluation of this entity.

Returns a string.


### ctx.getEntity(id: String, ctxdata: Object?)

Retrieve an object with data evaluated from an entity called `id`.

If passed, `ctxdata` is a simple hash object with a list of variables that
extend the context data available for the evaluation of this entity.

Returns an object with the following properties:

 - `value`: the string value of the entity,
 - `attributes`: an object of evaluated attributes of the entity,
 - `globals`: a list of global variables used while evaluating the entity,
 - `locale`: locale code of the language the entity is in;  it can be different 
   than the first locale in the current fallback chain if the entity couldn't 
   be evaluated and a fallback translation had to be used.


### ctx.localize(ids: Array&lt;String&gt;, callback: Function)

Registers a callback which fires when all entities listed in `ids` have been 
retrieved.

```javascript
ctx.localize(['hello', 'about'], function(l10n) {
  var node = document.querySelector('[data-l10n-id=hello]');
  node.textConent = l10n.entities.hello.value;
  node.classList.remove('hidden');
});
```

The callback becomes bound to the entities on the `ids` list.  It will be 
called when the entities become available (asynchronously) or whenever the 
translation of any of the entities changes.

`localize` should be the preferred way of localizing the UI.

The callback function is passed an `l10n` object with the following properties:

  - `entities`: an object whose keys are the identifiers and value are the 
    entity objects as returned by `getEntity`,
  - `reason`: an object with the reason why `callback` was invoked.

The `reason` object can be:
 
  - `{ locales: Array<String> }` if `callback` was invoked because of a change 
    of the current locale (see `registerLocales`),
  - `{ global: String }` if `callback` was invoked because the value of one of 
    the globals used in the translation of `ids` has changed.


### ctx.ready(callback: Function)

Fires the function passed as argument as soon as the context is available.

If the context is available when the function is called, it fires the callback
instantly. 
Otherwise it sets the event listener and fire as soon as the context is ready.

After that, each time locale list is modified (retranslation case) the callback 
will be executed.
 

The HTML Bindings
-----------------

You can take advantage of HTML bindings to localize your HTML documents with 
L20n.  See [bindings/README][].

[bindings/README]: https://github.com/l20n/l20n.js/blob/master/bindings/README.md


Install L20n in Node.js (using npm)
-----------------------------------

    npm install l20n

Or, if you want to hack on L20n, install from source:

    git clone https://github.com/l20n/l20n.js.git
    cd l20n.js
    sudo npm link
    cd ../some/other/project
    npm link l20n

In your other project you can now require L20n:

    var L20n = require('l20n');
    var ctx = L20n.getContext();


Build L20n for the Clientside
-----------------------------

In order to use L20n on a webpage, all you need is an optimized to a single 
file, and possibly minified, version of the library.

    git clone https://github.com/l20n/l20n.js.git
    cd l20n.js
    npm install
    make build

This will produce the optimized files in `dist`.

    dist/l20n.js
    dist/l20n.min.js

Include the optimized script in your webpage to make the `L20n` object global.

```html
<script src="../path/to/dist/l20n.js"></script>
<script>
  var ctx = L20n.getContext();
</script>
```

For resource file loading over XHR to work properly, remember to run your 
webpage on a server (localhost will do).


Set up L20n for Development
---------------------------

If you want to hack on L20n locally, you don't have to `make build` after every 
edit.  L20n follows the AMD naming scheme and can be used with module loaders 
like [RequireJS][].

[RequireJS]: http://requirejs.org/

```html
<script src="require.js"></script>
<script>
  require.config({ 
    baseUrl: '../path/to/lib/', // tell RequireJS where to look for L20n
    paths: {
      'l20n/platform': 'client/l20n/platform'
    }
  });
  require(['l20n'], function(L20n) {
    var ctx = L20n.getContext();
    // write the rest of your code here
  });
</script> 
```


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
