function load(url, value) {
  return Promise.resolve(value);
}

export function fetchResource(res, lang, value) {
  const url = res.replace('{locale}', lang);
  return load(url, value).catch(() => null);
}

export class ResourceBundle {
  constructor(lang, resIds, values) {
    this.lang = lang;
    this.loaded = false;
    this.resIds = resIds;
    this.values = values;
  }

  fetch() {
    if (!this.loaded) {
      this.loaded = Promise.all(
        this.resIds.map(
          resId => fetchResource(resId, this.lang, this.values[resId]))
      );
    }

    return this.loaded;
  }
}
