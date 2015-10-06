'use strict';
import { L10nError } from '../../../lib/errors';

export default {
  fetch: function(htmloptimizer, res, lang) {
    const url = res.replace('{locale}', lang.code);
    const {file, content} = htmloptimizer.getFileByRelativePath(url);
    if (!file) {
      return Promise.reject(new L10nError('Not found: ' + url));
    }

    const parsed = res.endsWith('.json') ?
      JSON.parse(content) : content;
    return Promise.resolve(parsed);
  }
};
