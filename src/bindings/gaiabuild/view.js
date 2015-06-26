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
    this.htmloptimizer = htmloptimizer;
    this.doc = htmloptimizer.document;
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));

    this.stopBuildError = null;
    this.entityErrors = new Map();

    // stop the build if these errors happen for en-US
    this.env.addEventListener('fetcherror', stopBuild.bind(this));
    this.env.addEventListener('parseerror', stopBuild.bind(this));
    this.env.addEventListener('duplicateerror', stopBuild.bind(this));
    this.env.addEventListener('notfounderror', stopBuild.bind(this));
    this.env.addEventListener('resolveerror', stopBuild.bind(this));

    // if LOCALE_BASEDIR is set alert about missing strings
    if (htmloptimizer.config.LOCALE_BASEDIR !== '') {
      let logResourceError = err => htmloptimizer.dump(err);

      this.env.addEventListener('fetcherror', logResourceError);
      this.env.addEventListener('parseerror', logResourceError);
      this.env.addEventListener('duplicateerror', logResourceError);
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
    return fetchContext(this.ctx, lang).then(() => {
      let [errors, entries] = serializeContext(this.ctx, lang);

      if (errors.length) {
        this.htmloptimizer.dump(
          '[l10n] [' + lang.code + ']: ' + errors.length +
          ' missing compared to en-US: ' + errors.map(
            err => err.id).join(', '));
      }

      return entries;
    });
  }

  checkError() {
    return {
      wait: false,
      error: this.stopBuildError
    };
  }
}

function stopBuild(err) {
  if (err.code === 'en-US') {
    this.stopBuildError = err;
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
  return ctx._resIds.reduce(([errorsSeq, entriesSeq], cur) => {
    let sourceRes = cache[cur + 'en-USapp'];
    let langRes = cache[cur + lang.code + lang.src];
    let [errors, entries] = serializeEntries(
      lang, langRes instanceof L10nError ? {} : langRes, sourceRes);
    return [errorsSeq.concat(errors), entriesSeq.concat(entries)];
  }, [[], []]);
}
