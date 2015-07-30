L20n.js for node.js
===================

The low-level L20n.js API is internal and experimental and  it might change 
without notice.


## Install

L20n.js is available for installation via npm.

    npm install l20n


## Import

If your environment supports ES2015, you can import L20n like this:

```javascript
import { Env, fetch } from 'l20n';
```


## Transpile on-the-fly

You can also transpile to ES5 on-the-fly with Babel.  First, install Babel:

    npm install babel

You can then require L20n like so:

```javascript
require('babel/register');
var L20n = require('l20n');
```


## Require the dist version

If you're using one of the official releases from the [v3.x][] branch, you can 
also require an already transpiled version of L20n.js with:

```javascript
var L20n = require('l20n/compat');
```

[v3.x]: https://github.com/l20n/l20n.js/tree/v3.x/dist


## Getting Started

```javascript
import { Env, fetch } from 'l20n';

const env = new Env('en-US', fetch);
const ctx = env.createContext(['{locale}.l20n']);
const langs = [
  {code: 'de-DE'},
  {code: 'de'},
];

ctx.fetch(langs).then(init);

function init() {
  ctx.resolve(langs, 'foo').then(
    ({value}) => console.log(value));
}
```
