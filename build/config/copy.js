'use strict';

module.exports = {
  stage: {
    files: [
      {
        expand: true,
        cwd: 'build/dist/gaia',
        src: ['l10n.js', 'l20n.js'],
        dest: 'build/dist/stage/shared/js/'
      },
      {
        expand: true,
        cwd: 'build/dist/gaiabuild',
        src: ['l10n.js', 'qps.js'],
        dest: 'build/dist/stage/build/l10n/'
      },
      {
        expand: true,
        cwd: 'tests/',
        src: '**',
        dest: 'build/dist/stage/apps/sharedtest/test/unit/l10n/'
      }
    ]
  }
};
