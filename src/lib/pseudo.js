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
 *   qps-ploc - Ȧȧƈƈḗḗƞŧḗḗḓ Ḗḗƞɠŀīīşħ
 *
 *     In Accented English all English letters are replaced by accented
 *     Unicode counterparts which don't impair the readability of the content.
 *     This allows developers to quickly test if any given string is being
 *     correctly displayed in its 'translated' form.  Additionally, simple
 *     heuristics are used to make certain words longer to better simulate the
 *     experience of international users.
 *
 *   qps-plocm - ɥsıʅƃuƎ pǝɹoɹɹıW
 *
 *     Mirrored English is a fake RTL locale.  All words are surrounded by
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
      // ȦƁƇḒḖƑƓĦĪĴĶĿḾȠǾƤɊŘŞŦŬṼẆẊẎẐ + [\\]^_` + ȧƀƈḓḗƒɠħīĵķŀḿƞǿƥɋřşŧŭṽẇẋẏẑ
      'qps-ploc':
        '\u0226\u0181\u0187\u1E12\u1E16\u0191\u0193\u0126\u012A' +
        '\u0134\u0136\u013F\u1E3E\u0220\u01FE\u01A4\u024A\u0158' +
        '\u015E\u0166\u016C\u1E7C\u1E86\u1E8A\u1E8E\u1E90' +
        '[\\]^_`' +
        '\u0227\u0180\u0188\u1E13\u1E17\u0192\u0260\u0127\u012B' +
        '\u0135\u0137\u0140\u1E3F\u019E\u01FF\u01A5\u024B\u0159' +
        '\u015F\u0167\u016D\u1E7D\u1E87\u1E8B\u1E8F\u1E91',

      // XXX Until https://bugzil.la/1007340 is fixed, ᗡℲ⅁⅂⅄ don't render well
      // on the devices.  For now, use the following replacements: pɟפ˥ʎ
      // ∀ԐↃpƎɟפHIſӼ˥WNOԀÒᴚS⊥∩ɅＭXʎZ + [\\]ᵥ_, + ɐqɔpǝɟƃɥıɾʞʅɯuodbɹsʇnʌʍxʎz
      'qps-plocm':
        '\u2200\u0510\u2183p\u018E\u025F\u05E4HI\u017F' +
        '\u04FC\u02E5WNO\u0500\xD2\u1D1AS\u22A5\u2229\u0245' +
        '\uFF2DX\u028EZ' +
        '[\\]\u1D65_,' +
        '\u0250q\u0254p\u01DD\u025F\u0183\u0265\u0131\u027E' +
        '\u029E\u0285\u026Fuodb\u0279s\u0287n\u028C\u028Dx\u028Ez',
    };

    const mods = {
      'qps-ploc': val =>
        val.replace(reVowels, match => match + match.toLowerCase()),

      // Surround each word with Unicode formatting codes, RLO and PDF:
      //   U+202E:   RIGHT-TO-LEFT OVERRIDE (RLO)
      //   U+202C:   POP DIRECTIONAL FORMATTING (PDF)
      // See http://www.w3.org/International/questions/qa-bidi-controls
      'qps-plocm': val =>
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
  'qps-ploc': {
    enumerable: true,
    get: createGetter('qps-ploc', 'Runtime Accented')
  },
  'qps-plocm': {
    enumerable: true,
    get: createGetter('qps-plocm', 'Runtime Mirrored')
  }
});
