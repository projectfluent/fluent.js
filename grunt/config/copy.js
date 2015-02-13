'use strict';

module.exports = {
  gaia: {
    files: [
      {
        src: 'dist/runtime/l10n.js',
        dest: 'dist/gaia/shared/js/l10n.js'
      },
      {
        src: 'dist/buildtime/l10n.js',
        dest: 'dist/gaia/build/l10n.js'
      },
      {
        expand: true,
        cwd: 'tests/',
        src: '**',
        dest: 'dist/gaia/apps/sharedtest/test/unit/l10n/'
      }
    ]
  }
};
