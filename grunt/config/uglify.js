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
      'dist/runtime/l10n.min.js': ['dist/runtime/l10n.js'],
      'dist/buildtime/l10n.min.js': ['dist/buildtime/l10n.js'],
    }
  },
};
