L20n Examples
=============

This directory contains example HTML files which are ready to be used in the 
browser.  All files must be accessed on `http://localhost` for 
`XMLHttpRequest`s to work properly.


multilingual-dev.html
---------------------

This files uses a localization manifest which tells L20n to run in the 
multilingual mode, i.e. with language negotiation and language fallback 
enabled.  

It also makes use of an AMD module loader (RequireJS) to dynamically 
and asynchronously load L20n source files, so that no build step is necessary.

Use this file if you want to __hack on L20n's codebase__ and immediately see your 
edits when you refresh the browser.


multilingual-prod.html
----------------------

This files uses a localization manifest which tells L20n to run in the 
multilingual mode, i.e. with language negotiation and language fallback 
enabled.

It runs a built version of L20n which can be included in an HTML page with 
a single `<script>` element.  In order to make it work, you'll need to run 
`make build` first.  See the [main README][] for more information.

[main README]: ../README.md

Use this file if you want to experiment with L20n for your project and __immitate 
the production environment__.


monolingual-dev.html
---------------------

This file runs L20n in the monolignual mode, with no manifest, no language 
negotiation and no language fallback.  There is only one locale available, bu  
however the localization still happens at runtime, on the client side.

It also makes use of an AMD module loader (RequireJS) to dynamically 
and asynchronously load L20n source files, so that no build step is necessary.

Use this file for __quick experiments__ which don't involve language fallback, for 
presentations, or for testing server-side or build-time optimizations.
