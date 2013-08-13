if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
      }
    });
  }

  var unicodeLocaleExtensionSequence = "-u(-[a-z0-9]{2,8})+";
  var unicodeLocaleExtensionSequenceRE = new RegExp(unicodeLocaleExtensionSequence);
  var unicodeLocaleExtensionSequenceGlobalRE = new RegExp(unicodeLocaleExtensionSequence, "g");
  var langTagMappings = {};
  var langSubtagMappings = {};
  var extlangMappings = {};

  /**
   * Regular expression defining BCP 47 language tags.
   *
   * Spec: RFC 5646 section 2.1.
   */
  var languageTagRE = (function () {
    // RFC 5234 section B.1
    // ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
    var ALPHA = "[a-zA-Z]";
    // DIGIT          =  %x30-39
    //                        ; 0-9
    var DIGIT = "[0-9]";

    // RFC 5646 section 2.1
    // alphanum      = (ALPHA / DIGIT)     ; letters and numbers
    var alphanum = "(?:" + ALPHA + "|" + DIGIT + ")";
    // regular       = "art-lojban"        ; these tags match the 'langtag'
    //               / "cel-gaulish"       ; production, but their subtags
    //               / "no-bok"            ; are not extended language
    //               / "no-nyn"            ; or variant subtags: their meaning
    //               / "zh-guoyu"          ; is defined by their registration
    //               / "zh-hakka"          ; and all of these are deprecated
    //               / "zh-min"            ; in favor of a more modern
    //               / "zh-min-nan"        ; subtag or sequence of subtags
    //               / "zh-xiang"
    var regular = "(?:art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang)";
    // irregular     = "en-GB-oed"         ; irregular tags do not match
    //                / "i-ami"             ; the 'langtag' production and
    //                / "i-bnn"             ; would not otherwise be
    //                / "i-default"         ; considered 'well-formed'
    //                / "i-enochian"        ; These tags are all valid,
    //                / "i-hak"             ; but most are deprecated
    //                / "i-klingon"         ; in favor of more modern
    //                / "i-lux"             ; subtags or subtag
    //                / "i-mingo"           ; combination
    //                / "i-navajo"
    //                / "i-pwn"
    //                / "i-tao"
    //                / "i-tay"
    //                / "i-tsu"
    //                / "sgn-BE-FR"
    //                / "sgn-BE-NL"
    //                / "sgn-CH-DE"
    var irregular = "(?:en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)";
    // grandfathered = irregular           ; non-redundant tags registered
    //               / regular             ; during the RFC 3066 era
    var grandfathered = "(?:" + irregular + "|" + regular + ")";
    // privateuse    = "x" 1*("-" (1*8alphanum))
    var privateuse = "(?:x(?:-[a-z0-9]{1,8})+)";
    // singleton     = DIGIT               ; 0 - 9
    //               / %x41-57             ; A - W
    //               / %x59-5A             ; Y - Z
    //               / %x61-77             ; a - w
    //               / %x79-7A             ; y - z
    var singleton = "(?:" + DIGIT + "|[A-WY-Za-wy-z])";
    // extension     = singleton 1*("-" (2*8alphanum))
    var extension = "(?:" + singleton + "(?:-" + alphanum + "{2,8})+)";
    // variant       = 5*8alphanum         ; registered variants
    //               / (DIGIT 3alphanum)
    var variant = "(?:" + alphanum + "{5,8}|(?:" + DIGIT + alphanum + "{3}))";
    // region        = 2ALPHA              ; ISO 3166-1 code
    //               / 3DIGIT              ; UN M.49 code
    var region = "(?:" + ALPHA + "{2}|" + DIGIT + "{3})";
    // script        = 4ALPHA              ; ISO 15924 code
    var script = "(?:" + ALPHA + "{4})";
    // extlang       = 3ALPHA              ; selected ISO 639 codes
    //                 *2("-" 3ALPHA)      ; permanently reserved
    var extlang = "(?:" + ALPHA + "{3}(?:-" + ALPHA + "{3}){0,2})";
    // language      = 2*3ALPHA            ; shortest ISO 639 code
    //                 ["-" extlang]       ; sometimes followed by
    //                                     ; extended language subtags
    //               / 4ALPHA              ; or reserved for future use
    //               / 5*8ALPHA            ; or registered language subtag
    var language = "(?:" + ALPHA + "{2,3}(?:-" + extlang + ")?|" + ALPHA + "{4}|" + ALPHA + "{5,8})";
    // langtag       = language
    //                 ["-" script]
    //                 ["-" region]
    //                 *("-" variant)
    //                 *("-" extension)
    //                 ["-" privateuse]
    var langtag = language + "(?:-" + script + ")?(?:-" + region + ")?(?:-" +
      variant + ")*(?:-" + extension + ")*(?:-" + privateuse + ")?";
    // Language-Tag  = langtag             ; normal language tags
    //               / privateuse          ; private use tag
    //               / grandfathered       ; grandfathered tags
    var languageTag = "^(?:" + langtag + "|" + privateuse + "|" + grandfathered + ")$";

    // Language tags are case insensitive (RFC 5646 section 2.1.1).
    return new RegExp(languageTag, "i");
  }());

  var duplicateVariantRE = (function () {
    // RFC 5234 section B.1
    // ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
    var ALPHA = "[a-zA-Z]";
    // DIGIT          =  %x30-39
    //                        ; 0-9
    var DIGIT = "[0-9]";

    // RFC 5646 section 2.1
    // alphanum      = (ALPHA / DIGIT)     ; letters and numbers
    var alphanum = "(?:" + ALPHA + "|" + DIGIT + ")";
    // variant       = 5*8alphanum         ; registered variants
    //               / (DIGIT 3alphanum)
    var variant = "(?:" + alphanum + "{5,8}|(?:" + DIGIT + alphanum + "{3}))";

    // Match a langtag that contains a duplicate variant.
    var duplicateVariant =
    // Match everything in a langtag prior to any variants, and maybe some
    // of the variants as well (which makes this pattern inefficient but
    // not wrong, for our purposes);
    "(?:" + alphanum + "{2,8}-)+" +
    // a variant, parenthesised so that we can refer back to it later;
    "(" + variant + ")-" +
    // zero or more subtags at least two characters long (thus stopping
    // before extension and privateuse components);
    "(?:" + alphanum + "{2,8}-)*" +
    // and the same variant again
    "\\1" +
    // ...but not followed by any characters that would turn it into a
    // different subtag.
    "(?!" + alphanum + ")";

  // Language tags are case insensitive (RFC 5646 section 2.1.1), but for
  // this regular expression that's covered by having its character classes
  // list both upper- and lower-case characters.
  return new RegExp(duplicateVariant);
  }());


  var duplicateSingletonRE = (function () {
    // RFC 5234 section B.1
    // ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
    var ALPHA = "[a-zA-Z]";
    // DIGIT          =  %x30-39
    //                        ; 0-9
    var DIGIT = "[0-9]";

    // RFC 5646 section 2.1
    // alphanum      = (ALPHA / DIGIT)     ; letters and numbers
    var alphanum = "(?:" + ALPHA + "|" + DIGIT + ")";
    // singleton     = DIGIT               ; 0 - 9
    //               / %x41-57             ; A - W
    //               / %x59-5A             ; Y - Z
    //               / %x61-77             ; a - w
    //               / %x79-7A             ; y - z
    var singleton = "(?:" + DIGIT + "|[A-WY-Za-wy-z])";

    // Match a langtag that contains a duplicate singleton.
    var duplicateSingleton =
    // Match a singleton subtag, parenthesised so that we can refer back to
    // it later;
      "-(" + singleton + ")-" +
      // then zero or more subtags;
      "(?:" + alphanum + "+-)*" +
      // and the same singleton again
      "\\1" +
      // ...but not followed by any characters that would turn it into a
      // different subtag.
      "(?!" + alphanum + ")";

  // Language tags are case insensitive (RFC 5646 section 2.1.1), but for
  // this regular expression that's covered by having its character classes
  // list both upper- and lower-case characters.
  return new RegExp(duplicateSingleton);
  }());

  /**
   * Verifies that the given string is a well-formed BCP 47 language tag
   * with no duplicate variant or singleton subtags.
   *
   * Spec: ECMAScript Internationalization API Specification, 6.2.2.
   */
  function IsStructurallyValidLanguageTag(locale) {
    if (!languageTagRE.test(locale))
      return false;

    // Before checking for duplicate variant or singleton subtags with
    // regular expressions, we have to get private use subtag sequences
    // out of the picture.
    if (locale.startsWith("x-"))
      return true;
    var pos = locale.indexOf("-x-");
    if (pos !== -1)
      locale = locale.substring(0, pos);

    // Check for duplicate variant or singleton subtags.
    return !duplicateVariantRE.test(locale) &&
      !duplicateSingletonRE.test(locale);
  }

  /**
   * Canonicalizes the given structurally valid BCP 47 language tag, including
   * regularized case of subtags. For example, the language tag
   * Zh-NAN-haNS-bu-variant2-Variant1-u-ca-chinese-t-Zh-laTN-x-PRIVATE, where
   *
   *     Zh             ; 2*3ALPHA
   *     -NAN           ; ["-" extlang]
   *     -haNS          ; ["-" script]
   *     -bu            ; ["-" region]
   *     -variant2      ; *("-" variant)
   *     -Variant1
   *     -u-ca-chinese  ; *("-" extension)
   *     -t-Zh-laTN
   *     -x-PRIVATE     ; ["-" privateuse]
   *
   * becomes nan-Hans-mm-variant2-variant1-t-zh-latn-u-ca-chinese-x-private
   *
   * Spec: ECMAScript Internationalization API Specification, 6.2.3.
   * Spec: RFC 5646, section 4.5.
   */
  function CanonicalizeLanguageTag(locale) {
    // The input
    // "Zh-NAN-haNS-bu-variant2-Variant1-u-ca-chinese-t-Zh-laTN-x-PRIVATE"
    // will be used throughout this method to illustrate how it works.

    // Language tags are compared and processed case-insensitively, so
    // technically it's not necessary to adjust case. But for easier processing,
    // and because the canonical form for most subtags is lower case, we start
    // with lower case for all.
    // "Zh-NAN-haNS-bu-variant2-Variant1-u-ca-chinese-t-Zh-laTN-x-PRIVATE" ->
    // "zh-nan-hans-bu-variant2-variant1-u-ca-chinese-t-zh-latn-x-private"
    locale = locale.toLowerCase();

    // Handle mappings for complete tags.
    if (langTagMappings && langTagMappings.hasOwnProperty(locale))
      return langTagMappings[locale];

    var subtags = locale.split("-");
    var i = 0;

    // Handle the standard part: All subtags before the first singleton or "x".
    // "zh-nan-hans-bu-variant2-variant1"
    while (i < subtags.length) {
      var subtag = subtags[i];

      // If we reach the start of an extension sequence or private use part,
      // we're done with this loop. We have to check for i > 0 because for
      // irregular language tags, such as i-klingon, the single-character
      // subtag "i" is not the start of an extension sequence.
      // In the example, we break at "u".
      if (subtag.length === 1 && (i > 0 || subtag === "x"))
        break;

      if (subtag.length === 4) {
        // 4-character subtags are script codes; their first character
        // needs to be capitalized. "hans" -> "Hans"
        subtag = subtag[0].toUpperCase() +
          subtag.substring(1);
      } else if (i !== 0 && subtag.length === 2) {
        // 2-character subtags that are not in initial position are region
        // codes; they need to be upper case. "bu" -> "BU"
        subtag = subtag.toUpperCase();
      }
      if (langSubtagMappings.hasOwnProperty(subtag)) {
        // Replace deprecated subtags with their preferred values.
        // "BU" -> "MM"
        // This has to come after we capitalize region codes because
        // otherwise some language and region codes could be confused.
        // For example, "in" is an obsolete language code for Indonesian,
        // but "IN" is the country code for India.
        // Note that the script generating langSubtagMappings makes sure
        // that no regular subtag mapping will replace an extlang code.
        subtag = langSubtagMappings[subtag];
      } else if (extlangMappings.hasOwnProperty(subtag)) {
        // Replace deprecated extlang subtags with their preferred values,
        // and remove the preceding subtag if it's a redundant prefix.
        // "zh-nan" -> "nan"
        // Note that the script generating extlangMappings makes sure that
        // no extlang mapping will replace a normal language code.
        subtag = extlangMappings[subtag].preferred;
        if (i === 1 && extlangMappings[subtag].prefix === subtags[0]) {
          subtags.shift();
          i--;
        }
      }
      subtags[i] = subtag;
      i++;
    }
    var normal = subtags.slice(0, i).join("-");

    // Extension sequences are sorted by their singleton characters.
    // "u-ca-chinese-t-zh-latn" -> "t-zh-latn-u-ca-chinese"
    var extensions = [];
    while (i < subtags.length && subtags[i] !== "x") {
      var extensionStart = i;
      i++;
      while (i < subtags.length && subtags[i].length > 1)
        i++;
      var extension = sybtags.slice(extensionStart, i).join("-");
      extensions.push(extension);
    }
    extensions.sort();

    // Private use sequences are left as is. "x-private"
    var privateUse = "";
    if (i < subtags.length)
      privateUse = subtags.slice(i).join("-");

    // Put everything back together.
    var canonical = normal;
    if (extensions.length > 0)
      canonical += "-" + extensions.join("-");
    if (privateUse.length > 0) {
      // Be careful of a Language-Tag that is entirely privateuse.
      if (canonical.length > 0)
        canonical += "-" + privateUse;
      else
        canonical = privateUse;
    }

    return canonical;
  }

  /**
   * Canonicalizes a locale list.
   *
   * Spec: ECMAScript Internationalization API Specification, 9.2.1.
   */
  function CanonicalizeLocaleList(locales) {
    if (locales === undefined)
      return [];
    var seen = [];
    if (typeof locales === "string")
      locales = [locales];
    var O = locales;
    var len = O.length;
    var k = 0;
    while (k < len) {
      // Don't call ToString(k) - SpiderMonkey is faster with integers.
      var kPresent = k in O;
      if (kPresent) {
        var kValue = O[k];
        if (!(typeof kValue === "string" || typeof kValue === "object"))
          ThrowError(JSMSG_INVALID_LOCALES_ELEMENT);
        var tag = kValue;
        if (!IsStructurallyValidLanguageTag(tag))
          ThrowError(JSMSG_INVALID_LANGUAGE_TAG, tag);
        tag = CanonicalizeLanguageTag(tag);
        if (seen.indexOf(tag) === -1)
          seen.push(tag);
      }
      k++;
    }
    return seen;
  }

  /**
   * Compares a BCP 47 language tag against the locales in availableLocales
   * and returns the best available match. Uses the fallback
   * mechanism of RFC 4647, section 3.4.
   *
   * Spec: ECMAScript Internationalization API Specification, 9.2.2.
   * Spec: RFC 4647, section 3.4.
   */
  function BestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (true) {
      if (availableLocales.indexOf(candidate) !== -1)
        return candidate;
      var pos = candidate.lastIndexOf('-');
      if (pos === -1)
        return undefined;
      if (pos >= 2 && candidate[pos - 2] === "-")
        pos -= 2;
      candidate = candidate.substring(0, pos);
    }
  }

  /**
   * Returns the subset of availableLocales for which requestedLocales has a
   * matching (possibly fallback) locale. Locales appear in the same order in the
   * returned list as in the input list.
   *
   * This function is a slight modification of the LookupSupprtedLocales algorithm
   * The difference is in step 4d where instead of adding requested locale,
   * we're adding availableLocale to the subset.
   *
   * This allows us to directly use returned subset to pool resources.
   *
   * Spec: ECMAScript Internationalization API Specification, 9.2.6.
   */
  function LookupAvailableLocales(availableLocales, requestedLocales) {
    // Steps 1-2.
    var len = requestedLocales.length;
    var subset = [];

    // Steps 3-4.
    var k = 0;
    while (k < len) {
      // Steps 4.a-b.
      var locale = requestedLocales[k];
      var noExtensionsLocale = locale.replace(unicodeLocaleExtensionSequenceGlobalRE, "");

      // Step 4.c-d.
      var availableLocale = BestAvailableLocale(availableLocales, noExtensionsLocale);
      if (availableLocale !== undefined)
        // in LookupSupportedLocales it pushes locale here
        subset.push(availableLocale);

      // Step 4.e.
      k++;
    }

    // Steps 5-6.
    return subset.slice(0);
  }

  function PrioritizeLocales(availableLocales,
                             requestedLocales,
                             defaultLocale) {
    availableLocales = CanonicalizeLocaleList(availableLocales);
    requestedLocales = CanonicalizeLocaleList(requestedLocales);

    var result = LookupAvailableLocales(availableLocales, requestedLocales);
    if (!defaultLocale) {
      return result;
    }

    // if default locale is not present in result,
    // add it to the end of fallback chain
    defaultLocale = CanonicalizeLanguageTag(defaultLocale);
    if (result.indexOf(defaultLocale) === -1) {
      result.push(defaultLocale);
    }
    return result;
  }

  exports.Intl = {
    prioritizeLocales: PrioritizeLocales
  };

});
