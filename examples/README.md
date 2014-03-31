mozL10n Examples
================

This directory contains example HTML files which are ready to be used in the 
browser.  It runs a built version of mozL10n which can be included in an HTML 
page with a single `<script>` element.  In order to make it work, you'll need 
to run `grunt build` first.  See the [main README][] in the root of the repo 
for more information.

[main README]: ../README.md


basic.html
------------

This is the basic example of mozL10n in action, with no I/O optimizations.  The 
localization resources are defined in `locales/example.ini`.  mozL10n first 
downloads the ini file and then proceeds to fetch the properties files relevant 
to the user's preferred language.


concat.html
-----------

In this example, the localization resources have been parsed and concatenated 
into a single JSON file for each language.  This allows to avoid the I/O 
related to the ini file.


inline.html
-----------

In this example, mozL10n is further optimized by embedding localization resources 
into the HTML.  No additional I/O is required, but the size of the HTML 
increases linearly to the number of supported languages, so be careful when 
using this approach.
