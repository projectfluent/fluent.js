'use strict';

export default {
  fetch: function(htmloptimizer, res, lang) {
    let url = res.replace('{locale}', lang.code);
    let content = htmloptimizer.getFileByRelativePath(url).content;
    return res.endsWith('.json') ?
      JSON.parse(content) : content;
  }
};
