L20n Examples
=============

This directory contains example HTML files which are ready to be used in the 
browser.  It runs a built version of l20n.js which can be included in an HTML 
page with a single `<script>` element.  In order to make it work, you'll need 
to run `grunt build` first.  See the [main README][] in the root of the repo 
for more information.

[main README]: ../README.md


regular.html
------------

This is the basic example of l20n.js in action, with no I/O optimizations.  The 
localization resources are defined in `head`.  l20n.js fetches the properties 
files relevant to the user's preferred language.


concat.html
-----------

In this example, the localization resources have been parsed and concatenated 
into a single JSON file for each language.  This allows to avoid the I/O 
of fetching multiple resource files and parsing them.
