Project Fluent Tools
====================

A collection of command line utilities to make learning and working with
fluent.js easier.


parse.js
--------

`parse.js` is a utility script that uses fluent.js Parser to parse a string
into an AST and output the result.

    Usage: parse [options] [file]

    Options:

      -h, --help           output usage information
      -V, --version        output the version number
      -o, --output <type>  Type of output: ast or entries [ast]
      -r, --raw            Print raw JSON
      -n, --no-color       Print errors to stderr without color

Examples:

    echo "foo = Foo" | ./parse.js
    ./parse.js file.ftl


format.js
---------

`format.js` is a utility script that uses fluent.js Resolver to parse and
transform a source string into Entity objects and output the formatted result.

    Usage: format [options] [file]

    Options:

      -h, --help             output usage information
      -V, --version          output the version number
      -e, --external <file>  External arguments (.json)
      -n, --no-color         Print without color
      -l, --lang <code>      Locale to use with Intl [en-US]

Examples:

    echo "foo = Foo" | ./format.js
    ./format.js file.ftl
    ./format.js -e data.json file.ftl


perf
----

Measure the performance impact of changes that you make to the fluent.js
codebase by running `./perf/test.js`.

See [perf/README](perf/README.md) for more information.
