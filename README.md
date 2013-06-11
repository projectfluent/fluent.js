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

### ctx.addResource(String)
### ctx.registerLocales(Array&lt;String&gt;)
### ctx.linkResource(String|Function)
### ctx.freeze()
### ctx.addEventListener(String, Function)
### ctx.removeEventListener(String, Function)
### ctx.get(String, Object)
### ctx.getEntity(String, Object)
### ctx.localize(Array, Function)
### ctx.ready(Function)


The HTML Bindings
-----------------

You can take advantage of HTML bindings to localize your HTML documents with 
L20n.  See [bindings/README][].

[bindings/README]: https://github.com/l20n/l20n.js/blob/master/bindings/README.md


Install L20n in Node.js (using NPM)
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
      'l20n/platform': 'client/l20n/platform' // and where the client-
                                              // specific code lives relative
                                              // to `baseUrl` (you shouldn't
                                              // need to change this)
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
