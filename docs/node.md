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
<fooEntity "Foo en español">
```

`./locales/en-US.l20n`

```html
<fooEntity "Foo in English">
<barEntity "Bar only exists in English">
```

Example node script:

```javascript
import { Env, fetch } from 'l20n';

const env = new Env('es-ES', fetch);
const ctx = env.createContext(['locales/{locale}.l20n']);
const langs = [
  {code: 'es-ES'},
  {code: 'en-US'}
];

ctx.fetch(langs).then(init);

function init() {
  ctx.resolve(langs, 'fooEntity').then((value) => {
    console.log('Foo: ', value);
  });

  ctx.resolve(langs, 'barEntity').then((value) => {
    console.log('Bar: ', value);
  });
}
```
