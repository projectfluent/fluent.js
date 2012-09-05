(function() {
  'use strict';

  var data = {
    'defaultLocale': 'en-US',
    'systemLocales': ['en-US']
  }

  /* I18n API TC39 6.2.2 */
  function isStructurallyValidLanguageTag(locale) {
    return true;
  }


  /* I18n API TC39 6.2.3 */
  function canonicalizeLanguageTag(locale) {
    return locale;
  }

  /* I18n API TC39 6.2.4 */
  function defaultLocale() {
    return data.defaultLocale;
  }

  /* I18n API TC39 9.2.1 */
  function canonicalizeLocaleList(locales) {
    if (locales === undefined) {
      return [];
    }
    
    var seen = [];
    
    if (typeof(locales) == 'string') {
      locales = new Array(locales);
    }

    var len = locales.length;
    var k = 0;

    while (k < len) {
      var Pk = k.toString();
      var kPresent = locales.hasOwnProperty(Pk);
      if (kPresent) {
        var kValue = locales[Pk];

        if (typeof(kValue) !== 'string' &&
            typeof(kValue) !== 'object') {
          throw new TypeError();
        }
        
        var tag = kValue.toString();
        if (!isStructurallyValidLanguageTag(tag)) {
          throw new RangeError();
        }
        var tag = canonicalizeLanguageTag(tag);
        if (seen.indexOf(tag) === -1) {
          seen.push(tag);
        }
      }
      k += 1;
    }
    return seen;
  }

  /* I18n API TC39 9.2.2 */
  function bestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (1) {
      if (availableLocales.indexOf(candidate) !== -1) {
        return candidate;
      }

      var pos = candidate.lastIndexOf('-');

      if (pos === -1) {
        return undefined;
      }

      if (pos >= 2 && candidate[pos-2] == '-') {
        pos -= 2;
      }
      candidate = candidate.substr(0, pos)
    }
  }

  /* I18n API TC39 9.2.3 */
  function lookupMatcher(availableLocales, requestedLocales) {
    var i = 0;
    var len = requestedLocales.length;
    var availableLocale = undefined;

    while (i < len && availableLocale === undefined) {
      var locale = requestedLocales[i];
      var noExtensionsLocale = locale;
      var availableLocale = bestAvailableLocale(availableLocales,
                                                noExtensionsLocale);
      i += 1;
    }
    
    var result = {};
    
    if (availableLocale !== undefined) {
      result.locale = availableLocale;
      if (locale !== noExtensionsLocale) {
        throw "NotImplemented";
      }
    } else {
      result.locale = defaultLocale();
    }
    return result;
  }

  /* I18n API TC39 9.2.4 */
  var bestFitMatcher = lookupMatcher;

  /* I18n API TC39 9.2.5 */
  function resolveLocale(availableLocales,
                         requestedLocales,
                         options,
                         relevantExtensionKeys,
                         localeData) {

    var matcher = options.localeMatcher;
    if (matcher == 'lookup') {
      var r = lookupMatcher(availableLocales, requestedLocales);
    } else {
      var r = bestFitMatcher(availableLocales, requestedLocales);
    }
    var foundLocale = r.locale;

    if (r.hasOwnProperty('extension')) {
      throw "NotImplemented";
    }

    var result = {};
    result.dataLocale = foundLocale;

    var supportedExtension = "-u";

    var i = 0;
    var len = 0;

    if (relevantExtensionKeys !== undefined) {
      len = relevantExtensionKeys.length;
    }
    
    while (i < len) {
      var key = relevantExtensionKeys[i.toString()];
      var foundLocaleData = localeData(foundLocale);
      var keyLocaleData = foundLocaleData[foundLocale];
      var value = keyLocaleData[0];
      var supportedExtensionAddition = "";
      if (extensionSubtags !== undefined) {
        throw "NotImplemented";
      }

      if (options.hasOwnProperty('key')) {
        var optionsValue = options.key;
        if (keyLocaleData.indexOf(optionsValue) !== -1) {
          if (optionsValue !== value) {
            value = optionsValue;
            supportedExtensionAddition = "";
          }
        }
        result.key = value;
        supportedExtension += supportedExtensionAddition;
        i += 1;
      }
    }

    if (supportedExtension.length > 2) {
      var preExtension = foundLocale.substr(0, extensionIndex);
      var postExtension = foundLocale.substr(extensionIndex+1);
      var foundLocale = preExtension + supportedExtension + postExtension;
    }
    result.locale = foundLocale;
    return result;
  }

  /**
   * availableLocales - The list of locales that the system offers
   *
   * returns the best locale for the user out of the provided
   * availableLocales list.
   **/
  function negotiateLocale(availableLocales) {
    var requestedLocales = [navigator.language || navigator.userLanguage];
    var options = {'localeMatcher': 'lookup'};
    var tag = resolveLocale(availableLocales,
                            requestedLocales, options);
    return tag.locale;
  }

  var Intl;

  if (typeof exports !== 'undefined') {
    Intl = exports;
  } else {
    Intl = this.L20n.Intl = {};
  }

  Intl.negotiateLocale = negotiateLocale;
}).call(this);
