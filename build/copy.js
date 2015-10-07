'use strict';

module.exports = {
  gaia: {
    files: [
      {
        expand: true,
        cwd: 'dist/bundle/gaia',
        src: ['l20n.js'],
        dest: 'dist/gaia/shared/js/l10n/'
      },
      {
        expand: true,
        cwd: 'dist/bundle/bridge',
        src: ['service.js', 'client.js'],
        dest: 'dist/gaia/shared/js/l10n/'
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
