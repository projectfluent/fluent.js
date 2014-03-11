'use strict';

module.exports = {
  options: {
    compress: {
      screw_ie8: true,
    },
    mangle: {
      screw_ie8: true,
    },
  },
  webl10n: {
    files: {
      'dist/webl10n/l10n.min.js': ['dist/webl10n/l10n.js'],
    }
  },
};
