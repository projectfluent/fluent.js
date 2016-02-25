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
const L20n = require('l20n');
const langs = [
  {code: 'es-ES'},
  {code: 'en-US'}
];

// fetchResource is node-specific, Env isn't
const env = new L20n.Env(L20n.fetchResource);

// helpful for debugging
env.addEventListener('*', e => console.log(e));

// contexts are immutable;  if langs change a new context must be created
const ctx = env.createContext(langs, ['./locales/{locale}.l20n']);

// pass string ids or tuples of [id, args]
ctx.formatValues('foo', ['bar', {baz: 'Baz'}]).then(values => {
  // values is an array of resolved translations
  console.log(values);
});

// -> ['Foo en español', 'Bar only exists in English']
```
