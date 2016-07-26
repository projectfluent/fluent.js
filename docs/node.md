L20n.js for node.js
===================

The low-level L20n.js API is internal and experimental and it might change
without notice.  The higher-level API (the `Localization` class) isn't exposed 
at this time.  Patches are most welcome!


## Install

```bash
$ npm install l20n
```


## Usage

You can access the low-level API by requiring the 'l20n' module.  The currently 
exposed functions can be found in [src/runtime/node/index.js][].  Additionally 
the 'l20n' module will patch the global `Intl` object and add required 
polyfills.  You can consult the list of the polyfills in 
[src/intl/polyfill.js].  The most important one is the `Intl.MessageContext` 
polyfill which provides the core functionality of parsing FTL files and 
formatting translations from them.

[src/runtime/node/index.js]: https://github.com/l20n/l20n.js/blob/master/src/runtime/node/index.js
[src/intl/polyfill.js]: https://github.com/l20n/l20n.js/blob/master/src/intl/polyfill.js

```javascript
'use strict';

require('l20n');

const ctx = new Intl.MessageContext('en-US');

const errors = ctx.addMessages(`
brand-name = Foo 3000
welcome    = Welcome, { $name }, to { brand-name }!
`);

if (errors.length) {
  // handle syntax errors
  // …
}

const welcome = ctx.messages.get('welcome');

ctx.format(welcome, { name: 'Anna' });
// format() returns a tuple of [formatted string, runtime errors]
// → [ 'Welcome, Anna, to Foo 3000!', [] ]
```
