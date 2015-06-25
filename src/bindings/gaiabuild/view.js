'use strict';

import { Env } from '../../lib/env';
import { qps } from '../../lib/pseudo';
import { L10nError } from '../../lib/errors';
import { getResourceLinks } from '../../bindings/html/head';
import { translateFragment } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';
import { serializeEntries } from '../../bindings/gaiabuild/serialize';

export class View {
  constructor(htmloptimizer, fetch) {
    this.env = new Env(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetch);
    this.doc = htmloptimizer.document;
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));
  }

  observe() {}
  disconnect() {}

  translate(code) {
    let dir = getDirection(code);
    let langs = [{ code, dir, src: 'app' }];
    let setDocLang = () => {
      this.doc.documentElement.lang = code;
      this.doc.documentElement.dir = dir;
    };
    return this.ctx.fetch(langs).then(
      langs => translateFragment(this, langs, this.doc.documentElement)).then(
      setDocLang);
  }

  serializeEntries(code) {
    let lang = {
      code,
      dir: getDirection(code),
      src: code in qps ? 'qps' : 'app'
    };
    return this.ctx.fetch([lang]).then(
      () => serializeContext(this.ctx, lang));
  }
}

function serializeContext(ctx, lang) {
  let cache = ctx._env._resCache;
  return ctx._resIds.reduce((seq, cur) => {
    let resource = cache[cur + lang.code + lang.src];
    return resource instanceof L10nError ?
      seq : seq.concat(serializeEntries(resource));
  }, []);
}
