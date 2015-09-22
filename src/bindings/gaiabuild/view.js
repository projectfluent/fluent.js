'use strict';

import { qps } from '../../lib/pseudo';
import { Env } from '../../lib/env';
import { LegacyEnv } from './legacy/env';
import { getResourceLinks } from '../../bindings/html/head';
import { translateFragment } from '../../bindings/html/dom';
import { getDirection } from '../../bindings/html/langs';
import { serializeContext } from './serialize';
import { serializeLegacyContext } from './legacy/serialize';

export class View {
  constructor(htmloptimizer, fetch) {
    this.htmloptimizer = htmloptimizer;
    this.doc = htmloptimizer.document;

    this.isEnabled = this.doc.querySelector('link[rel="localization"]');
    // XXX we should check if the app uses l10n.js instead, but due to lazy 
    // loading we can't rely on querySelector.
    this.isLegacy = !this.doc.querySelector('script[src$="l20n.js"]');

    const EnvClass = this.isLegacy ? LegacyEnv : Env;
    this.env = new EnvClass(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetch);
    this.ctx = this.env.createContext(getResourceLinks(this.doc.head));

    // add the url of the currently processed webapp to all errors
    this.env.addEventListener('*', amendError.bind(this));

    this.stopBuildError = null;
    const log = logError.bind(this);
    const stop = stopBuild.bind(this);

    // stop the build if these errors happen for en-US
    // XXX tv_apps break the build https://bugzil.la/1179833
    // this.env.addEventListener('fetcherror', stop);
    this.env.addEventListener('parseerror', stop);
    this.env.addEventListener('duplicateerror', stop);
    this.env.addEventListener('notfounderror', stop);
    // XXX sms breaks the build https://bugzil.la/1178187
    // this.env.addEventListener('resolveerror', stop);

    this.env.addEventListener('deprecatewarning', log);

    // if LOCALE_BASEDIR is set alert about missing strings
    if (htmloptimizer.config.LOCALE_BASEDIR !== '') {
      this.env.addEventListener('fetcherror', log);
      this.env.addEventListener('parseerror', log);
      this.env.addEventListener('duplicateerror', log);
    }
  }

  emit(...args) {
    return this.env.emit(...args);
  }

  observe() {}
  disconnect() {}

  _resolveEntities(langs, keys) {
    return this.ctx.resolveEntities(langs, keys);
  }

  translateDocument(code) {
    const dir = getDirection(code);
    const langs = [{ code, dir, src: 'app' }];
    const setDocLang = () => {
      this.doc.documentElement.lang = code;
      this.doc.documentElement.dir = dir;
    };
    return this.ctx.fetch(langs).then(
      langs => translateFragment(this, langs, this.doc.documentElement)).then(
      setDocLang);
  }

  serializeResources(code) {
    const lang = {
      code,
      dir: getDirection(code),
      src: code in qps ? 'qps' : 'app'
    };
    return fetchContext(this.ctx, lang).then(() => {
      const [errors, entries] = this.isLegacy ?
        serializeLegacyContext(this.ctx, lang) :
        serializeContext(this.ctx, lang);

      if (errors.length) {
        const notFoundErrors = errors.filter(
          err => err.message.indexOf('not found') > -1).map(
          err => err.id);
        const malformedErrors = errors.filter(
          err => err.message.indexOf('malformed') > -1).map(
          err => err.id);

        if (notFoundErrors.length) {
          this.htmloptimizer.dump(
            '[l10n] [' + lang.code + ']: ' + notFoundErrors.length +
            ' missing compared to en-US: ' + notFoundErrors.join(', '));
        }
        if (malformedErrors.length) {
          this.htmloptimizer.dump(
            '[l10n] [' + lang.code + ']: ' + malformedErrors.length +
            ' malformed compared to en-US: ' + malformedErrors.join(', '));
        }
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
  err.message = err.message + ' (' + this.htmloptimizer.webapp.url + ')';
}

function logError(err) {
  this.htmloptimizer.dump('[l10n] ' + err);
}

function stopBuild(err) {
  if (err.lang && err.lang.code === 'en-US' && !this.stopBuildError) {
    this.stopBuildError = err;
  }
}

function fetchContext(ctx, lang) {
  const sourceLang = { code: 'en-US', dir: 'ltr', src: 'app' };
  return Promise.all(
    [sourceLang, lang].map(lang => ctx.fetch([lang])));
}
