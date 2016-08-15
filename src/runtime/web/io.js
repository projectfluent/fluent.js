import { L10nError } from '../../lib/errors';

const HTTP_STATUS_CODE_OK = 200;

function load(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }

    xhr.open('GET', url, true);

    xhr.addEventListener('load', e => {
      if (e.target.status === HTTP_STATUS_CODE_OK ||
          e.target.status === 0) {
        resolve(e.target.response);
      } else {
        reject(new L10nError(`Not found: ${url}`));
      }
    });
    xhr.addEventListener('error', reject);
    xhr.addEventListener('timeout', reject);

    xhr.send(null);
  });
}

export function fetchResource(res, lang) {
  const url = res.replace('{locale}', lang);
  return load(url).catch(e => e);
}

export class ResourceBundle {
  constructor(lang, resIds) {
    this.lang = lang;
    this.loaded = false;
    this.resIds = resIds;
  }

  fetch() {
    if (!this.loaded) {
      this.loaded = Promise.all(
        this.resIds.map(resId => fetchResource(resId, this.lang))
      );
    }

    return this.loaded;
  }
}
