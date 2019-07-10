# @fluent/dedent

`@fluent/dedent` provides a template literal tag to dedent Fluent code.
Fluent Syntax is indentation-sensitive, and `@fluent/dedent` offers a
convenient way to include Fluent snippets in source code keeping the current
level of indentation and without compromising the readability.


## Installation

`@fluent/dedent` can be used both on the client-side and the server-side.  You can
install it from the npm registry or use it as a standalone script (as the
`FluentDedent` global).

    npm install @fluent/dedent


## How to use

`@fluent/dedent`'s default export is meant to be used as a template literal
tag. By convention, the tag is often called `ftl`.

```javascript
import ftl from "@fluent/dedent";

let messages = ftl`
    hello = Hello, world!
    welcome = Welcome, {$userName}!
    `;
```

The position of the closing backtick defines how much indent will be removed
from each line of the content. If the indentation is not sufficient in any of
the non-blank lines of the content, a `RangeError` is thrown.

```javascript
import ftl from "@fluent/dedent";

let messages = ftl`
    hello = Hello, world!
  welcome = Welcome, {$userName}!
    `;

// → RangeError("Insufficient indentation in line 2.")
```

Content must start on a new line and must end on a line of its own. The
closing delimiter must appear on a new line. The first and the last line of
the input will be removed from the output. If any of them contains
non-whitespace characters, a `RangeError` is thrown.

```javascript
import ftl from "@fluent/dedent";

let message1 = "hello = Hello, world!";
let message2 = ftl`
    hello = Hello, world!
    `;

assert(message1 === message2);
```

If you wish to include the leading or trailing line breaks in the output, put
extra blank lines in the input.

```javascript
import ftl from "@fluent/dedent";

let message = ftl`

    hello = Hello, world!

    `;

assert(message === "\nhello = Hello, world!\n");
```


## Compatibility

For legacy browsers, the `compat` build has been transpiled using Babel's [env
preset][].

```javascript
import ftl from '@fluent/dedent/compat';
```


## Learn more

Find out more about Project Fluent at [projectfluent.org][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[env preset]: https://babeljs.io/docs/plugins/preset-env/
[projectfluent.org]: http://projectfluent.org
[FTL]: http://projectfluent.org/fluent/guide/
