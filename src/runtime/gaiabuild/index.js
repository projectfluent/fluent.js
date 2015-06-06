'use strict';

import io from './io';
import Env from '../../lib/env';
import { View } from '../../bindings/html/view';
import { translateDocument } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';

export class Builder {
  constructor(htmloptimizer) {
    this.fetch = io.fetch.bind(io, htmloptimizer);
    this.env = new Env(
      'gaiabuild', htmloptimizer.config.GAIA_DEFAULT_LOCALE, this.fetch);
    this.view = new View(this.env, htmloptimizer.win.document);
  }

  translateDocument(lang) {
    let langs = {
      code: lang,
      dir: getDirection(lang),
      src: 'app'
    };
    return translateDocument.call(this.view, this.view.doc, langs);
  }
}
