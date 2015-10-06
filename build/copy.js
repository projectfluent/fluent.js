'use strict';

module.exports = {
  gaia: {
    files: [
      {
        expand: true,
        cwd: 'dist/bundle/gaia',
        src: ['l20n.js'],
        dest: 'dist/gaia/shared/js/'
      },
      {
        expand: true,
        cwd: 'dist/compat/gaia/build',
        src: ['l20n.js'],
        dest: 'dist/gaia/build/l10n/'
      },
    ]
  }
};
