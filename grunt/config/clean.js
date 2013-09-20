'use strict';

module.exports = {
  dist: {
    files: [
      {
        dot: true,
        src: [
          'dist/**/*',
          'build/cov/**/*',
        ],
      },
    ],
  },
};
