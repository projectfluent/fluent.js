# fluent-merge

`fluent-merge` is a command line utility for merging localization files.  It's
part of Project Fluent, a localization framework designed to unleash the
expressive power of the natural language.


## Installation

    npm install -g fluent-merge


## Usage

    $ fluent-merge en-US.ftl de.ftl


## API

`fluent-merge` can be used both on the client-side and the server-side.
You can install it from the npm registry or use it as a standalone script.

    npm install fluent-merge

Two functions are available: `mergeFiles` for merging text files and
`mergeResources` for merging AST trees.

```javascript
import { mergeFiles } from 'fluent-merge';

async function merge(paths) {
  const buffers = await Promise.all(
    program.args.map(
      path => readFile(path)
    )
  );

  const files = buffers.map(buffer => buffer.toString());
  return mergeFiles(...files);
}
```


## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
