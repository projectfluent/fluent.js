'use strict';

module.exports = {
  stage: {
    files: [
      {
        expand: true,
        cwd: 'build/dist/gaia',
        src: ['l20n.js'],
        dest: 'build/dist/stage/shared/js/'
      },
      {
        expand: true,
        cwd: 'build/dist/gaiabuild',
        src: ['l20n.js', 'qps.js'],
        dest: 'build/dist/stage/build/l10n/'
      },
    ]
  }
};
