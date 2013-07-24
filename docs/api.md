L20n JavaScript API
===================

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
  node.textContent = l10n.entities.hello.value;
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
  node.textContent = l10n.entities.hello.value;
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
