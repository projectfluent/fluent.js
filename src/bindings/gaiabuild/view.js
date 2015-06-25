'use strict';

import { Env } from '../../lib/env';
import { qps } from '../../lib/pseudo';
import { L10nError } from '../../lib/errors';
import { getResourceLinks } from '../../bindings/html/head';
import { translateFragment } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';
import { serializeEntries } from '../../bindings/gaiabuild/serialize';
import { addBuildMessage } from
  '../../bindings/gaiabuild/debug';

export class View {
  constructor(htmloptimizer, fetch) {
    this.env = new Env(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetch);
    this.doc = htmloptimizer.document;
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));

    // stop the build if these errors happen for en-US
    this.error = null;
    this.env.addEventListener('notfounderror', stopBuild.bind(this));
    this.env.addEventListener('duplicateerror', stopBuild.bind(this));

    // if LOCALE_BASEDIR is set alert about missing strings
    if (htmloptimizer.config.LOCALE_BASEDIR !== '') {
      this.msgs = {};
      var error = addBuildMessage.bind(this, 'error');
      var warn = addBuildMessage.bind(this, 'warn');

      this.env.addEventListener('fetcherror', error);
      this.env.addEventListener('parseerror', warn);
      this.env.addEventListener('resolveerror', warn);
      this.env.addEventListener('notfounderror', error);
      this.env.addEventListener('duplicateerror', error);
    }
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
    return fetchContext(this.ctx, lang).then(
      () => serializeContext(this.ctx, lang));
  }

  checkError() {
    return {
      wait: false,
      error: this.error
    };
  }
}

function stopBuild(err) {
  if (err.code === 'en-US') {
    this.error = err;
  }
}

function fetchContext(ctx, lang) {
  let sourceLang = { code: 'en-US', dir: 'ltr', src: 'app' };
  return Promise.all([
    ctx.fetch([sourceLang]),
    ctx.fetch([lang])]);
}

function serializeContext(ctx, lang) {
  let cache = ctx._env._resCache;
  return ctx._resIds.reduce((seq, cur) => {
    let sourceRes = cache[cur + 'en-USapp'];
    let langRes = cache[cur + lang.code + lang.src];
    return langRes instanceof L10nError ?
      seq.concat(serializeEntries({}, sourceRes)) :
      seq.concat(serializeEntries(langRes, sourceRes));
  }, []);
}
