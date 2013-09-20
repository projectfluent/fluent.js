Building L20n.js
================

Install L20n in Node.js (using npm)
-----------------------------------

    npm install l20n

In your other project you can now require L20n:

    var L20n = require('l20n');
    var ctx = L20n.getContext();


Build L20n for the Clientside with HTML Bindings
------------------------------------------------

In order to use L20n on a webpage, all you need is an optimized to a single 
file, and possibly minified, version of the library with the HTML bindings.

    git clone https://github.com/l20n/l20n.js.git
    cd l20n.js
    npm -g install grunt-cli
    npm install
    grunt

The `grunt` command first checks if all Git conflicts are resolved, then
lints all files, afterwards builds the library (which is equivalent to
`grunt build` which, in turn, is equivalent to `grunt clean compile:html uglify:html docco`)
and executes all unit tests afterwards. If you want just to build the project
without running any tests just run `grunt test` (usually that's not what you want, though!).

This will produce the optimized files in `dist`.

    dist/html/l20n.js
    dist/html/l20n.min.js

In order to use the coverage tests, first do:

    npm -g install jscoverage

and then invoke the tests using:

    grunt coverage

It's recommended to include the l20n.js file as the last script in the `head` 
element. The `L20n` object will be made globally available.

```html
<head>
  …
  <script src="l20n.js"></script>
  <script>
    var ctx = L20n.getContext();
  </script>
</head>
```
