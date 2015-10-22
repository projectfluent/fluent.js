L20n.js for node.js
===================

The low-level L20n.js API is internal and experimental and  it might change
without notice.


## Install

L20n.js is available for installation via `npm`.

```bash
$ npm install l20n
```


## Usage

Example resource files:

`./locales/es-ES.l20n`

```html
<foo "Foo en español">
```

`./locales/en-US.l20n`

```html
<foo "Foo in English">
<bar "Bar only exists in English">
```

Example node script:

```javascript
import { Env, fetchResource } from 'l20n';

const env = new Env('en-US', fetchResource);
const ctx = env.createContext(['locales/{locale}.l20n']);
const langs = [
  {code: 'es-ES'},
  {code: 'en-US'}
];

ctx.resolveValues(langs, ['foo', 'bar']).then(
  ([foo, bar]) => console.log(foo, bar));

// -> 'Foo en español', 'Bar only exists in English'
```
