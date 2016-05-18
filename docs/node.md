L20n.js for node.js
===================

The low-level L20n.js API is internal and experimental and it might change
without notice.  The high-level API (the `Localization` class) isn't exposed.  
Patches are most welcome!


## Install

The current (master) version of L20n.js hasn't been published to the `npm` 
registry yet.  You can still add it to your project with:

```bash
$ npm install git+https://git@github.com/l20n/l20n.js.git
```


## Usage

```javascript
'use strict';

require('./dist/bundle/node/l20n');

const ctx = new Intl.MessageContext('en-US');

const errors = ctx.addMessages(`
brand-name = Foo 3000
hello      = Hello, { $name }, to { brand-name }!
`);

if (errors.length) {
  // handle syntax errors
  // …
}

const hello = ctx.messages.get('hello');

ctx.format(hello, { name: 'Anna' });
// format() returns a tuple of [formatted string, runtime errors]
// → [ 'Hello, Anna, to Foo 3000!', [] ]
```
