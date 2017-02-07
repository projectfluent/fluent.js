Perf testing
============

Measure the performance impact of changes that you make to the fluent.js
codebase.

Execution time is reported in microseconds (μs).

The script measures the speed of parsing, compilation and getting all entities
from a resource file based on Firefox OS's [Settings localization file][].  The
file consists of ca. 500 entities, majority of which are simple key-value
pairs.  This aims to immitate a real-life scenario in which only a handful of
entities make use of Project Fluent's advanced features.

[Settings localization file]: https://github.com/mozilla-b2g/gaia/blob/v1.0.1/apps/settings/locales/settings.en-US.properties

  Usage: test.js [options] command

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -e, --engine <string>      Engine to test: node, jsshell, d8 [node]
    -s, --sample <int>         Sample size [30]
    -p, --progress             Show progress
    -n, --no-color             Print without color
    -r, --raw                  Print raw JSON
    -c, --compare <reference>  Compare with a reference JSON
    -a, --alpha <float>        Significance level for the t-test [0.01]

The `command` argument is the command that will be spawned via 
`child_process.exec`.  This allows to reliably measure the speed over a big 
sample of runs without triggering JIT compilation of the modern JavaScript 
engines.  The command is always executed with `tools/perf` being the current 
directory.  If not given, the value of `command` will be determined based on 
the value ot the `engine` argument.


Examples:

    ./test.js
    ./test.js --engine jsshell
    ./test.js --sample 1000 --progress
    ./test.js --raw > ~/reference.js
    ./test.js --compare ~/reference.js
    ./test.js "~/src/jsshell/js benchmark.jsshell.js"


Statistical significance
------------------------

You can save raw JSON output to a file to serve as a benchmark for future 
measurements.  Afer you make edits to the codebase, re-run `perf` with 
`--compare path/to/reference.json` to see relative changes of new means.

The differences are tested for statistical significance with a two-sample 
[t-test][] with a default significance level of 0.01.  If the difference is 
significant, it will be show in green (faster) or red (slower).

![Screenshot](http://i.imgur.com/74aE9LR.png)

[t-test]: https://en.wikipedia.org/wiki/Student%27s_t-test


High Resolution Timer (HRT)
---------------------------

All numbers are reported in microseconds (μs) via node's 
[process.hrtime][] or SpiderMonkey shell's [dateNow][].  This allows to 
measure the time of a single operation.  

[process.hrtime]: http://nodejs.org/api/process.html#process_process_hrtime
[dateNow]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Hacking_Tips#Benchmarking_with_sub-milliseconds_%28JS_shell%29
