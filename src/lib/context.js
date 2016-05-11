import { Bundle } from './bundle';
import { L10nError } from './errors';

export class Context {
  constructor(langs, resIds) {
    this.langs = langs;
    this.resIds = resIds;
  }

  formatValues() {
    throw new L10nError('Not implemented');
  }

  formatEntities() {
    throw new L10nError('Not implemented');
  }
}

export class SimpleContext extends Context {
  constructor(langs, resIds, resources) {
    super(langs, resIds);
    const goodResources = resources.filter(
      res => !(res instanceof Error)
    );
    // shouldn't need to pass languages here
    this.bundle = new Bundle(resources, langs[0].code);
  }

  _formatKeys(keys, method) {
    return keys.map((key, i) => {
      const [id, args] = Array.isArray(key) ?
        key : [key, undefined];
      const entity = this.bundle.get(id);

      return entity ?
        entity[method](args) : id;
    });
  }

  formatValues(...keys) {
    return this._formatKeys(keys, 'format');
  }

  formatEntities(...keys) {
    return this._formatKeys(keys, 'formatToObject');
  }
}

SimpleContext.create = function(fetchResource, langs, resIds) {
  const [first] = langs;

  return Promise.all(
    resIds.map(resId => fetchResource(resId, first))
  ).then(
    resources => new SimpleContext(langs, resIds, resources)
  );
}
