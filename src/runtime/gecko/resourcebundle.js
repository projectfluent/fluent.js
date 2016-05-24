import { fetchResource } from './io';

export class ResourceBundle {
  constructor(lang, resIds) {
    this.lang = lang;
    this.loaded = false;
    this.resIds = resIds;
  }

  fetch() {
    if (!this.loaded) {
      this.loaded = Promise.all(
        this.resIds.map(id => fetchResource(id, this.lang))
      );
    }

    return this.loaded;
  }
}
