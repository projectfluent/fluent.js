# @fluent/prettier-plugin ![](https://github.com/projectfluent/fluent.js/workflows/test/badge.svg)

`@fluent/prettier-plugin` is a [Prettier](https://prettier.io/) plugin
built on top of `@fluent/syntax` to format Project Fluent `.ftl`
files. It's part of [Project Fluent][].

[project fluent]: https://projectfluent.org

The formatter normalizes valid Fluent syntax, such as indentation,
newlines, and spacing within placeables and functions. Invalid input
is rejected with an error.

Terms and messages sort alphabetically, giving deterministic output
that is easy to read and helps minimize merge conflicts. Example:

```fluent
account = Account
-brand-name = Foo 3000
welcome = Welcome, { $name }, to { -brand-name }!
```

Both stand-alone comments and comments bound to messages (see the
[syntax guide](https://projectfluent.org/fluent/guide/comments.html))
are preserved, and stand-alone comments keep their original order.
Groups of messages and terms delineated by stand-alone comments are
sorted separately.

See the unit tests for more formatting examples.

## Installation

```sh
npm install --save-dev prettier @fluent/prettier-plugin
```

## How to use

```sh
npx prettier --plugin=@fluent/prettier-plugin --write "**/*.ftl"
```

Add the plugin to the project Prettier config to automatically use it:

```json
{
  "plugins": ["@fluent/prettier-plugin"]
}
```

Individual files can opt out of formatting via a `@noformat` or
`@noprettier` ‘pragma’ comment at the top of the file. Example:

```fluent
# @noformat
beta=Beta
alpha=Alpha
```

## Vue support

When using [fluent-vue](https://github.com/fluent-vue/fluent-vue) and
per-component messages in Vue single-file components (SFC), add a
`lang="fluent"` attribute on `<fluent>` custom blocks to tell Prettier which
formatter to use:

```vue
<fluent locale="en" lang="fluent">
account = Account
greeting = Hello, { $name }
</fluent>
```

The [eslint-plugin-vue](https://eslint.vuejs.org/)
[`vue/block-lang`](https://eslint.vuejs.org/rules/block-lang) rule can
be used to enforce this:

```json
{
  "vue/block-lang": [
    "error",
    {
      "fluent": {
        "lang": "fluent"
      }
    }
  ]
}
```
