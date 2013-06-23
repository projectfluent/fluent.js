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
    ./parse.js file.lol


compile.js
----------

`compile.js` is a utility script that uses L20n's Compiler to parse and compile 
a string into Entity objects and output the result.

    Usage: compile.js [options] [file]
    
    Options:
    
      -h, --help         output usage information
      -V, --version      output the version number
      -d, --data <file>  Context data to use (.json)
      -a, --ast          Treat input as AST, not source code
      -n, --no-color     Print without color
      -l, --with-local   Print local entities and attributes

Examples:

    echo "<foo 'Foo'>" | ./compile.js
    echo "<foo 'Foo'>" | ./parse.js --raw |  ./compile.js --ast
    ./compile.js file.lol
    ./compile.js -d ctxdata.json file.lol


perf
----

Measure the performance impact of changes that you make to the L20n codebase by 
running `./index.js` (or `make perf` from the root of the repository).

See [perf/README](perf/README.md) for more information.
