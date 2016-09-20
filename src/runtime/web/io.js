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
        resolve(e.target.responseText);
      } else {
        reject(new Error(`${url} not found`));
      }
    });

    xhr.addEventListener('error',
      () => reject(new Error(`${url} failed to load`))
    );
    xhr.addEventListener('timeout',
      () => reject(new Error(`${url} timed out`))
    );

    xhr.send(null);
  });
}

export function fetchResource(res, lang) {
  const url = res.replace('{locale}', lang);
  return load(url).catch(() => null);
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
