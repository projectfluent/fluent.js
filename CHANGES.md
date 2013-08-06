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
