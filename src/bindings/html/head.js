export function getResourceLinks(head) {
  return Array.prototype.map.call(
    head.querySelectorAll('link[rel="localization"]'),
    el => el.getAttribute('href'));
}

export function getMeta(head) {
  let availableLangs = Object.create(null);
  let defaultLang = null;
  let appVersion = null;

  // XXX take last found instead of first?
  const metas = Array.from(head.querySelectorAll(
    'meta[name="availableLanguages"],' +
    'meta[name="defaultLanguage"],' +
    'meta[name="appVersion"]'));
  for (let meta of metas) {
    const name = meta.getAttribute('name');
    const content = meta.getAttribute('content').trim();
    switch (name) {
      case 'availableLanguages':
        availableLangs = getLangRevisionMap(
          availableLangs, content);
        break;
      case 'defaultLanguage':
        const [lang, rev] = getLangRevisionTuple(content);
        defaultLang = lang;
        if (!(lang in availableLangs)) {
          availableLangs[lang] = rev;
        }
        break;
      case 'appVersion':
        appVersion = content;
    }
  }

  return {
    defaultLang,
    availableLangs,
    appVersion
  };
}

function getLangRevisionMap(seq, str) {
  return str.split(',').reduce((prevSeq, cur) => {
    const [lang, rev] = getLangRevisionTuple(cur);
    prevSeq[lang] = rev;
    return prevSeq;
  }, seq);
}

function getLangRevisionTuple(str) {
  const [lang, rev]  = str.trim().split(':');
  // if revision is missing, use NaN
  return [lang, parseInt(rev)];
}
