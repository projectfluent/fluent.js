'use strict';

module.exports = {
  gaia: {
    files: [
      {
        expand: true,
        cwd: 'dist/web',
        src: ['l10n.js', 'l10n3.js'],
        dest: 'dist/gaia/shared/js/'
      },
      {
        expand: true,
        cwd: 'dist/gaiabuild',
        src: ['l10n.js', 'qps.js'],
        dest: 'dist/gaia/build/l10n/'
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
