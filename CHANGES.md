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
