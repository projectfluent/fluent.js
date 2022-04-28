# Project Fluent Tools

A collection of command line utilities to make learning and working with
fluent.js easier.

## parse.js

`parse.js` is a utility script that uses fluent.js Parser to parse a string
into an AST and output the result.

    Usage: parse [options] [file]

    Options:

      -h, --help     output usage information
      -V, --version  output the version number
      -r, --runtime  Use the runtime parser
      -s, --silent   Silence syntax errors

Examples:

    echo "foo = Foo" | ./parse.js
    ./parse.js file.ftl

## format.js

`format.js` is a utility script that uses fluent.js Resolver to parse and
transform a source string into Message objects and output the formatted result.

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

## fuzz.js

`fuzz.js` is a fuzzer for fluent.js's parsers.

    Usage: fuzz [options] [file]

    Options:

      -h, --help                output usage information
      -V, --version             output the version number
      -r, --runtime             Use the runtime parser
      -i, --repetitions <int>   Number of repetitions [100000]

Examples:

    echo "foo = Foo" | ./fuzz.js
    ./fuzz.js -i 1000 file.ftl

## perf

Measure the performance impact of changes that you make to the fluent.js
codebase by running `./perf/test.js`.

See [perf/README](perf/README.md) for more information.
