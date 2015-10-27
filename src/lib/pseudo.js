'use strict';

// Walk an entry node searching for content leaves
export function walkEntry(entry, fn) {
  if (typeof entry === 'string') {
    return fn(entry);
  }

  const newEntry = Object.create(null);

  if (entry.value) {
    newEntry.value = walkValue(entry.value, fn);
  }

  if (entry.index) {
    newEntry.index = entry.index;
  }

  if (entry.attrs) {
    newEntry.attrs = Object.create(null);
    for (let key in entry.attrs) {
      newEntry.attrs[key] = walkEntry(entry.attrs[key], fn);
    }
  }

  return newEntry;
}

export function walkValue(value, fn) {
  if (typeof value === 'string') {
    return fn(value);
  }

  // skip expressions in placeables
  if (value.type) {
    return value;
  }

  const newValue = Array.isArray(value) ? [] : Object.create(null);
  const keys = Object.keys(value);

  for (let i = 0, key; (key = keys[i]); i++) {
    newValue[key] = walkValue(value[key], fn);
  }

  return newValue;
}

/* Pseudolocalizations
 *
 * pseudo is a dict of strategies to be used to modify the English
 * context in order to create pseudolocalizations.  These can be used by
 * developers to test the localizability of their code without having to
 * actually speak a foreign language.
 *
 * Currently, the following pseudolocales are supported:
 *
 *   fr-x-psaccent - Ȧȧƈƈḗḗƞŧḗḗḓ Ḗḗƞɠŀīīşħ
 *
 *     In Accented English all English letters are replaced by accented
 *     Unicode counterparts which don't impair the readability of the content.
 *     This allows developers to quickly test if any given string is being
 *     correctly displayed in its 'translated' form.  Additionally, simple
 *     heuristics are used to make certain words longer to better simulate the
 *     experience of international users.
 *
 *   ar-x-psbidi - ɥsıʅƃuƎ ıpıԐ
 *
 *     Bidi English is a fake RTL locale.  All words are surrounded by
 *     Unicode formatting marks forcing the RTL directionality of characters.
 *     In addition, to make the reversed text easier to read, individual
 *     letters are flipped.
 *
 *     Note: The name above is hardcoded to be RTL in case code editors have
 *     trouble with the RLO and PDF Unicode marks.  In reality, it should be
 *     surrounded by those marks as well.
 *
 * See https://bugzil.la/900182 for more information.
 *
 */

function createGetter(id, name) {
  let _pseudo = null;

  return function getPseudo() {
    if (_pseudo) {
      return _pseudo;
    }

    const reAlphas = /[a-zA-Z]/g;
    const reVowels = /[aeiouAEIOU]/g;
    const reWords = /[^\W0-9_]+/g;
    // strftime tokens (%a, %Eb), template {vars}, HTML entities (&#x202a;)
    // and HTML tags.
    const reExcluded = /(%[EO]?\w|\{\s*.+?\s*\}|&[#\w]+;|<\s*.+?\s*>)/;

    const charMaps = {
      'fr-x-psaccent':
        'ȦƁƇḒḖƑƓĦĪĴĶĿḾȠǾƤɊŘŞŦŬṼẆẊẎẐ[\\]^_`ȧƀƈḓḗƒɠħīĵķŀḿƞǿƥɋřşŧŭṽẇẋẏẑ',
      'ar-x-psbidi':
        // XXX Use pɟפ˥ʎ as replacements for ᗡℲ⅁⅂⅄. https://bugzil.la/1007340
        '∀ԐↃpƎɟפHIſӼ˥WNOԀÒᴚS⊥∩ɅＭXʎZ[\\]ᵥ_,ɐqɔpǝɟƃɥıɾʞʅɯuodbɹsʇnʌʍxʎz',
    };

    const mods = {
      'fr-x-psaccent': val =>
        val.replace(reVowels, match => match + match.toLowerCase()),

      // Surround each word with Unicode formatting codes, RLO and PDF:
      //   U+202E:   RIGHT-TO-LEFT OVERRIDE (RLO)
      //   U+202C:   POP DIRECTIONAL FORMATTING (PDF)
      // See http://www.w3.org/International/questions/qa-bidi-controls
      'ar-x-psbidi': val =>
        val.replace(reWords, match => '\u202e' + match + '\u202c'),
    };

    // Replace each Latin letter with a Unicode character from map
    const replaceChars =
      (map, val) => val.replace(
        reAlphas, match => map.charAt(match.charCodeAt(0) - 65));

    const transform =
      val => replaceChars(charMaps[id], mods[id](val));

    // apply fn to translatable parts of val
    const apply = (fn, val) => {
      if (!val) {
        return val;
      }

      const parts = val.split(reExcluded);
      const modified = parts.map(function(part) {
        if (reExcluded.test(part)) {
          return part;
        }
        return fn(part);
      });
      return modified.join('');
    };

    return _pseudo = {
      name: transform(name),
      process: str => apply(transform, str)
    };
  };
}

export const pseudo = Object.defineProperties(Object.create(null), {
  'fr-x-psaccent': {
    enumerable: true,
    get: createGetter('fr-x-psaccent', 'Runtime Accented')
  },
  'ar-x-psbidi': {
    enumerable: true,
    get: createGetter('ar-x-psbidi', 'Runtime Bidi')
  }
});
