/* jshint node:true */

module.exports = {
  node: {
    options: {
      format: 'cjs',
      external: [
        'fs',
        'string.prototype.startswith',
        'string.prototype.endswith',
      ],
    },
    files: {
      'dist/bundle/node/l20n.js': 'src/runtime/node/index.js'
    }
  },
};
