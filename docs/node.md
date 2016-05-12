L20n.js for node.js
===================

The low-level L20n.js API is internal and experimental and  it might change
without notice.


## Install

The current (master) version of L20n.js hasn't been published to the `npm` 
registry yet.  You can still add it to your project with:

```bash
$ npm install git+https://git@github.com/l20n/l20n.js.git
```


## Usage

Example resource files:

`./locales/en-US.ftl`

```properties
foo = Foo in English
```

Example node script:

```javascript
'use strict';

const { createSimpleContext } = require('l20n');

const resIds = ['./locales/{locale}.ftl'];
const langs = [{ code: 'en-US'}];

// contexts are immutable; if langs change a new context must be created
createSimpleContext(langs, resIds).then(ctx => {
  // pass string ids or tuples of [id, args]
  const [foo] = ctx.formatValues(['foo']);
  console.log(foo);
});

// → 'Foo in English'
```
