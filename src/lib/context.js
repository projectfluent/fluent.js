import { Bundle } from './bundle';

export class Context {
  constructor(resources, langobjs) {
    const goodResources = resources.filter(
      res => !(res instanceof Error)
    );
    this.langs = langobjs;
    // shouldn't need to pass languages here
    this.bundle = new Bundle(resources, langobjs[0].code);
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

Context.create = function(fetchResource, langobjs, resIds) {
  // XXX support more than one lang
  const [first] = langobjs;

  return Promise.all(
    resIds.map(resId => fetchResource(resId, first))
  ).then(
    resources => {
      return new Context(resources, langobjs)
    }
  );
}
