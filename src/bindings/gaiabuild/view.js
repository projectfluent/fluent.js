'use strict';

import { pseudo } from '../../lib/pseudo';
import { Env } from '../../lib/env';
import { LegacyEnv } from './legacy/env';
import { translateFragment } from '../../bindings/html/dom';
import { getResourceLinks } from '../../bindings/html/head';
import { getDirection } from '../../bindings/html/shims';
import { serializeContext } from './serialize';
import { serializeLegacyContext } from './legacy/serialize';

export class View {
  constructor(htmloptimizer, fetchResource) {
    this.htmloptimizer = htmloptimizer;
    this.doc = htmloptimizer.document;
    this.resLinks = getResourceLinks(this.doc.head);

    this.isEnabled = this.doc.querySelector('link[rel="localization"]');
    // XXX we should check if the app uses l10n.js instead, but due to lazy 
    // loading we can't rely on querySelector.
    this.isLegacy = !this.doc.querySelector('script[src*="l20n"]');

    const EnvClass = this.isLegacy ? LegacyEnv : Env;
    this.env = new EnvClass(
      htmloptimizer.config.GAIA_DEFAULT_LOCALE, fetchResource);
    this.sourceCtx = this.env.createContext(
      { code: 'en-US', src: 'app' }, this.resLinks);

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

  formatEntities(...keys) {
    return this.ctx.formatEntities(...keys);
  }

  translateDocument(code) {
    const dir = getDirection(code);
    const langs = [
      { code, src: 'app' },
      { code: 'en-US', src: 'app' }
    ];
    const setDocLang = () => {
      this.doc.documentElement.lang = code;
      this.doc.documentElement.dir = dir;
    };

    const ctx = this.env.createContext(langs, getResourceLinks(this.doc.head));
    return translateFragment(ctx, this.doc.documentElement)
      .then(setDocLang);
  }

  serializeResources(code) {
    const langCtx = this.env.createContext(
      { code, src: code in pseudo ? 'pseudo' : 'app' }, this.resLinks);

    return Promise.all(
      [this.sourceCtx, langCtx].map(ctx => ctx.fetch())
    ).then(() => {
      const [errors, entries] = this.isLegacy ?
        serializeLegacyContext(langCtx) :
        serializeContext(langCtx);

      if (errors.length) {
        const notFoundErrors = errors.filter(
          err => err.message.indexOf('not found') > -1).map(
          err => err.id);
        const malformedErrors = errors.filter(
          err => err.message.indexOf('malformed') > -1).map(
          err => err.id);

        if (notFoundErrors.length) {
          this.htmloptimizer.dump(
            '[l10n] [' + code + ']: ' + notFoundErrors.length +
            ' missing compared to en-US: ' + notFoundErrors.join(', '));
        }
        if (malformedErrors.length) {
          this.htmloptimizer.dump(
            '[l10n] [' + code + ']: ' + malformedErrors.length +
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
