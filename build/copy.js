'use strict';

module.exports = {
  stage: {
    files: [
      {
        expand: true,
        cwd: 'dist/web',
        src: ['l20n.js'],
        dest: 'dist/stage/shared/js/'
      },
      {
        expand: true,
        cwd: 'dist/gaiabuild',
        src: ['l20n.js'],
        dest: 'dist/stage/build/l10n/'
      },
    ]
  }
};
