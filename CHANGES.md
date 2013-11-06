1.0.0 RC
========

This is the Release Candidate for 1.0.0.  Below is the summary of the most 
important changes. 

 - `ctx.get` is now `ctx.getSync`,
 - `ctx.getEntity` is now `ctx.getEntitySync`,
 - the `maybeComplex` optimization has beed removed from strings,
 - all expressions are now compiled lazily,
 - a [subset of HTML is now allowed][] in translations;  the `data-l10n-overlay` 
   attribute is now obsolete,
 - L20n now uses Grunt to automate the build tasks,
 - L20n successfully passed a [security review][].

[subset of HTML is now allowed]: https://github.com/l20n/l20n.js/blob/1.0.0rc/docs/html.md#making-html-elements-localizable
[security review]: https://bugzil.la/925579

Detailed changes:

* Core lib
  * Bug [929909](https::/bugzil.la/929909) - Rename Context::get to getSync
  * Bug [918655](https://bugzil.la/918655) - Get rid of getComplexString
  * Bug [921740](https://bugzil.la/921740) - Compile ComplexStrings lazily
  * Bug [923547](https://bugzil.la/923547) - Delay array/objects initialization in compiler
  * Bug [924071](https://bugzil.la/924071) - Resource's source is null when the resource can't be downloaded
  * Bug [912469](https://bugzil.la/912469) - Use Object.keys or hasOwnProperty for safer iteration
  * Bug [908777](https://bugzil.la/908777) - Allow locale negotiator to be asynchronous
  * Bug [916545](https://bugzil.la/916545) - Simplify the client IO, use onreadystatechange
  * Bug [913638](https://bugzil.la/913638) - Don't throw when context has no resources
* HTML bindings
  * Bug [921169](https://bugzil.la/921169) - Implement secure DOM localization
  * Bug [922576](https://bugzil.la/922576) - Allow reordering HTML elements in translations
  * Bug [935017](https://bugzil.la/935017) - Sanitize attributes before appending the element. 
  * Bug [923461](https://bugzil.la/923461) - Clean up the start-up logic
  * Bug [923048](https://bugzil.la/923048) - Use document.createDocumentFragment
  * Bug [868852](https://bugzil.la/868852) - Support Phonegap's/iOS pseudo-absolute paths in src and href
  * Bug [911715](https://bugzil.la/911715) - Support attributes with dashes in names
* Infrastructure
  * Bug [907840](https://bugzil.la/907840) - Rewrite Makefile to Grunt
  * Bug [921450](https://bugzil.la/921450) - Enable IRC notifications from Travis
  * Bug [923552](https://bugzil.la/923552) - shell:perf results affected by process dots

(Full changelog: [1.0.0b4...1.0.0rc][])

[1.0.0b4...1.0.0rc]: https://github.com/l20n/l20n.js/compare/1.0.0b4...1.0.0rc

1.0.0 beta 4
============

Based on the previous beta feedback, this version introduces a few important 
API changes intended to make working with language negotiation easier:

 - `ctx.registerLocales` now takes two arguments: the default locale for the 
   context and a list of all available locales,
 - `ctx.requestLocales` is a new method which triggers language negotiation 
   between the available locales, inluding the default locale (as defined via 
   `ctx.registerLocales`), and the locales passed as arguments.
 - `ctx.freeze` has been removed;  use `ctx.requestLocales` instead,
 - `ctx.supportedLocales` is a new read-only property which holds the result of 
   the language negotiation (i.e. the current fallback chain of locales),
 - `ctx.data` property has been removed, use `ctx.updateData` method instead.

Additionally, the error reporting strategy has been revisited as described in 
the [API documentation][].

[API documentation]: https://github.com/l20n/l20n.js/blob/1.0.0b4/docs/api.md#ctxaddeventlistenerevent-string-callback-function

Detailed changes:

* Core lib
  * Bug [897862](https://bugzil.la/897862) - Context::registerLocales should take the default language as the first argument (added Context::requestLocales)
  * Bug [904618](https://bugzil.la/904618) - Remove Contex::freeze in favor of requestLocales
  * Bug [897865](https://bugzil.la/897865) - Ctxdata should have an API for setting and unsetting values
  * Bug [904207](https://bugzil.la/904207) - Add ctx.supportedLocales
  * Bug [802850](https://bugzil.la/802850) - Debug, error and warning strategy
  * Bug [869016](https://bugzil.la/869016) - Remove promises
  * Bug [900559](https://bugzil.la/900559) - Compiler should not use a shared env object
  * Bug [896997](https://bugzil.la/896997) - Implement .stop method to localize wrapper
  * Bug [897026](https://bugzil.la/897026) - Locale file inclusion not working over file://
* HTML bindings
  * Bug [886055](https://bugzil.la/886055) - Use navigator.browserLanguage for IE compatiblity
  * Bug [897069](https://bugzil.la/897069) - Set the locale code for the document as soon as possible
  * Bug [896979](https://bugzil.la/896979) - l20n should be able to localize elements outside of BODY
  * Bug [897899](https://bugzil.la/897899) - In Chrome, console.log and console.warn need to be bound to the console object
* Infrastructure
  * Bug [897034](https://bugzil.la/897034) - Improve discoverability of L20n, part 1
  * Bug [886830](https://bugzil.la/886830) - make perf can now test V8 (node) and SpiderMonkey (jsshell)

(Full changelog: [1.0.0b3...1.0.0b4][])

[1.0.0b3...1.0.0b4]: https://github.com/l20n/l20n.js/compare/1.0.0b3...1.0.0b4

1.0.0 beta 3
============

* Core lib
  * Bug [886253](https://bugzil.la/886253) - l10n.reason may be undefined
  * Bug [886051](https://bugzil.la/886051) - Add a polyfill for String.startsWith in intl.js for WebKit
  * Bug [884201](https://bugzil.la/884201) - Macros should have strict arity rules
  * Bug [816887](https://bugzil.la/816887) - Macros should always return a String or a Literal
  * Bug [884228](https://bugzil.la/884228) - Referencing a macro (not calling it) should fail gracefully
  * Bug [884734](https://bugzil.la/884734) - Missing attributes should fail gracefully
  * Bug [883270](https://bugzil.la/883270) - Compiler should handle globals and ctxdata which are not strings
  * Bug [883664](https://bugzil.la/883664) - Missing members of strings, hashes, globals and variables
  * Bug [884229](https://bugzil.la/884229) - Detect cyclic references in indexes
  * Bug [886750](https://bugzil.la/886750) - Change how HashLiterals store content
  * Bug [803931](https://bugzil.la/803931) - Compiler is vulnerable to the billion laughs attack

* Infrastructure
  * Add attribute display to tools/compile 
  * Bug [886082](https://bugzil.la/886082) - Add statistical testing to make perf
  * Bug [888192](https://bugzil.la/888192) - make perf underestimates the time of getting entites
  * Bug [885993](https://bugzil.la/885993) - Add .npmignore
  * Bug [883100](https://bugzil.la/883100) - Lint the code and create a make lint target
  * Bug [886824](https://bugzil.la/886824) - Introduce shell bindings target

(Full changelog: [1.0.0b2...1.0.0b3][])

[1.0.0b2...1.0.0b3]: https://github.com/l20n/l20n.js/compare/1.0.0b2...1.0.0b3
