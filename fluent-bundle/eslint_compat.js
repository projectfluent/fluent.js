module.exports = {
  "parser": "babel-eslint",
  "parserOptions": {
      "ecmaVersion": 9,
      "sourceType": "module"
  },
  "extends": ["plugin:compat/recommended"],
  "env": {
    "browser": true
  },
  "settings": {
    "polyfills": [
      // https://github.com/zloirock/core-js/blob/44413c0a49d23ab3761f8b0a8da4f7d8d240c3fc/packages/core-js/modules/es.string.from-code-point.js
      "String.fromCodePoint",
      // https://github.com/zloirock/core-js/blob/44413c0a49d23ab3761f8b0a8da4f7d8d240c3fc/packages/core-js/internals/object-assign.js
      "Object.assign",
      // https://github.com/zloirock/core-js/blob/44413c0a49d23ab3761f8b0a8da4f7d8d240c3fc/packages/core-js/modules/es.object.entries.js
      "Object.entries",
      // https://github.com/zloirock/core-js/blob/44413c0a49d23ab3761f8b0a8da4f7d8d240c3fc/packages/core-js/modules/es.number.is-nan.js
      "Number.isNaN",
      // https://github.com/zloirock/core-js/blob/44413c0a49d23ab3761f8b0a8da4f7d8d240c3fc/packages/core-js/modules/es.weak-set.js
      "WeakSet",
      // https://www.npmjs.com/package/intl-pluralrules
      "Intl.PluralRules"
    ]
  }
}
