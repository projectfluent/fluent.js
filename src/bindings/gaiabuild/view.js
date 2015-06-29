'use strict';

import { Env } from '../../lib/env';
import { qps } from '../../lib/pseudo';
import { getResourceLinks } from '../../bindings/html/head';
import { translateFragment } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';
import { serializeContext } from '../../bindings/gaiabuild/serialize';

export class View {
  constructor(htmloptimizer, fetch) {
    this.env = new Env(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetch);
    this.htmloptimizer = htmloptimizer;
    this.doc = htmloptimizer.document;
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));

    // add the url of the currently processed webapp to all errors
    this.env.addEventListener('*', amendError.bind(this));

    this.stopBuildError = null;

    // stop the build if these errors happen for en-US
    this.env.addEventListener('fetcherror', stopBuild.bind(this));
    this.env.addEventListener('parseerror', stopBuild.bind(this));
    this.env.addEventListener('duplicateerror', stopBuild.bind(this));
    this.env.addEventListener('notfounderror', stopBuild.bind(this));
    // XXX readd once https://bugzil.la/1178187 lands
    // this.env.addEventListener('resolveerror', stopBuild.bind(this));

    // if LOCALE_BASEDIR is set alert about missing strings
    if (htmloptimizer.config.LOCALE_BASEDIR !== '') {
      this.env.addEventListener('fetcherror', logResourceError.bind(this));
      this.env.addEventListener('parseerror', logResourceError.bind(this));
      this.env.addEventListener('duplicateerror', logResourceError.bind(this));
    }
  }

  observe() {}
  disconnect() {}

  translateDocument(code) {
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
      const [errors, entries] = serializeContext(this.ctx, lang);

      if (errors.length) {
        const notFoundErrors = errors.filter(
          err => err.message.indexOf('not found') > -1).map(
          err => err.id);
        const malformedErrors = errors.filter(
          err => err.message.indexOf('malformed') > -1).map(
          err => err.id);

        this.htmloptimizer.dump(
          '[l10n] [' + lang.code + ']: ' + notFoundErrors.length +
          ' missing compared to en-US: ' + notFoundErrors.join(', '));
        this.htmloptimizer.dump(
          '[l10n] [' + lang.code + ']: ' + malformedErrors.length +
          ' malformed compared to en-US: ' + malformedErrors.join(', '));
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

function amendError(err) {
  err.message = err.message + ' in ' + this.htmloptimizer.webapp.url;
}

function logResourceError(err) {
  this.htmloptimizer.dump('[l10n] ' + err);
}

function stopBuild(err) {
  if (err.lang && err.lang.code === 'en-US') {
    this.stopBuildError = err;
  }
}

function fetchContext(ctx, lang) {
  let sourceLang = { code: 'en-US', dir: 'ltr', src: 'app' };
  return Promise.all([
    ctx.fetch([sourceLang]),
    ctx.fetch([lang])]);
}
