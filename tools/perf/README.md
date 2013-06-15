Perf testing
============

Measure the performance impact of changes that you make to the L20n codebase by 
running `./index.js` (or `make perf` from the root of the repository).

The script measures the speed of parsing, compilation and getting all entities 
from a resource file based on Firefox OS's [Settings localization file][].  The 
file consists of 500 entities, majority of which are simple key-value pairs. 
This aims to immitate a real-life scenario in which only a handful of entities 
make use of L20n's advanced features.

[Settings localization file]: https://github.com/mozilla-b2g/gaia/blob/v1.0.1/apps/settings/locales/settings.en-US.properties

    Usage: index.js [options]
    
    Options:
    
      -h, --help              output usage information
      -V, --version           output the version number
      -s, --sample <int>      Sample size [25]
      -i, --iterations <int>  Iterations per sample [100]
      -p, --progress          Show progress
      -r, --raw               Print raw JSON

Examples:

    ./index.js
    ./index.js --sample 50 --iterations 1000 --progress
