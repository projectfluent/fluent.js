'use strict';

import { Env } from '../../lib/env';
import { getResourceLinks } from '../../bindings/html/head';
import { translateFragment } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';

export class View {
  constructor(htmloptimizer, fetch) {
    this.env = new Env(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetch);
    this.doc = htmloptimizer.win.document;
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));
  }

  translate(code) {
    let dir = getDirection(code);
    let langs = [{ code, dir, src: 'app' }];
    return translateFragment(this, langs, this.doc.documentElement).then(
      () => {
        this.doc.documentElement.lang = code;
        this.doc.documentElement.dir = dir;
      });
  }

  observe() {}
  disconnect() {}
}
