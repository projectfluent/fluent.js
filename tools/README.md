L20n tools
==========

A collection of command line utilities to make learning and working with L20n 
easier.


parse.js
--------

`parse.js` is a utility script that uses L20n's Parser to parse a string into 
an AST and output the result.

    Usage: parse.js [options] [file]
    
    Options:
    
      -h, --help      output usage information
      -V, --version   output the version number
      -r, --raw       Print raw JSON
      -n, --no-color  Print errors to stderr without color

Examples:

    echo "<foo 'Foo'>" | ./parse.js
    ./parse.js file.l20n


format.js
---------

`format.js` is a utility script that uses L20n's Resolver to parse and 
transform a source string into Entity objects and output the formatted result.

    Usage: format.js [options] [file]
    
    Options:
    
      -h, --help         output usage information
      -V, --version      output the version number
      -d, --data <file>  Context data to use (.json)
      -a, --ast          Treat input as AST, not source code
      -n, --no-color     Print without color
      -l, --with-local   Print local entities and attributes

Examples:

    echo "<foo 'Foo'>" | ./format.js
    echo "<foo 'Foo'>" | ./parse.js --raw |  ./format.js --ast
    ./format.js file.l20n
    ./format.js -d ctxdata.json file.l20n


perf
----

Measure the performance impact of changes that you make to the L20n codebase by 
running `./perf/test.js`.

See [perf/README](perf/README.md) for more information.
