L20n Examples
=============

This directory contains example HTML files which are ready to be used in the 
browser.  It runs a built version of l20n.js which can be included in an HTML 
page with a single `<script>` element.  In order to make it work, you'll need 
to run `make build` first.  See the [main README][] in the root of the repo 
for more information.

[main README]: ../README.md


web.html
------------

This is the basic example of l20n.js in action, with no I/O optimizations.  The 
localization resources are defined in `head`.  l20n.js fetches the properties 
files relevant to the user's preferred language.
