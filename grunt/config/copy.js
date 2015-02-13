'use strict';

module.exports = {
  gaia: {
    files: [
      {
        expand: true,
        cwd: 'dist/runtime',
        src: '**',
        dest: 'dist/gaia/shared/js/'
      },
      {
        expand: true,
        cwd: 'dist/buildtime',
        src: '**',
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
