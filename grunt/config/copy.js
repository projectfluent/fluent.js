'use strict';

module.exports = {
  'install-git-hook': {
    files: [
      {
        dest: '.git/hooks/',
        src: [
          'tools/hooks/pre-commit',
        ],
      },
    ],
  },
};
