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
  web: {
    files: {
      'dist/web/l10n.min.js': ['dist/web/l10n.js'],
    }
  },
};
