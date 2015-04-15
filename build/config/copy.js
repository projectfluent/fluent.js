'use strict';

module.exports = {
  gaia: {
    files: [
      {
        expand: true,
        cwd: 'build/dist/web',
        src: ['l10n.js', 'l10n3.js'],
        dest: 'build/dist/gaia/shared/js/'
      },
      {
        expand: true,
        cwd: 'build/dist/gaiabuild',
        src: ['l10n.js', 'qps.js'],
        dest: 'build/dist/gaia/build/l10n/'
      },
      {
        expand: true,
        cwd: 'tests/',
        src: '**',
        dest: 'build/dist/gaia/apps/sharedtest/test/unit/l10n/'
      }
    ]
  }
};
