'use strict';

export default {
  fetch: function(htmloptimizer, res, lang) {
    let url = res.replace('{locale}', lang.code);
    let content = htmloptimizer.getFileByRelativePath(url).content;
    let parsed = res.endsWith('.json') ?
      JSON.parse(content) : content;
    return Promise.resolve(parsed);
  }
};
