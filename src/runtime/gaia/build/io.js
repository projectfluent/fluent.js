'use strict';
import { L10nError } from '../../../lib/errors';

export function fetchResource(htmloptimizer, res, { code }) {
  // We need to decode URI because build system DOM reader
  // may replace `{locale}` with `%7Blocale%7D`. See bug 1098188
  const url = decodeURI(res).replace('{locale}', code);
  const {file, content} = htmloptimizer.getFileByRelativePath(url);
  if (!file) {
    return Promise.reject(new L10nError('Not found: ' + url));
  }

  const parsed = res.endsWith('.json') ?
    JSON.parse(content) : content;
  return Promise.resolve(parsed);
}
