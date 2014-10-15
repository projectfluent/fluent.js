'use strict';

module.exports = {
  options: {
    separator: '',
    banner: '' +
      '(function(window, undefined) {\n' +
      '  \'use strict\';\n' +
      '\n' +
      '  /* jshint validthis:true */',
    footer: '\n})(this);\n',
    process: function(src) {
      src = src.replace(
        /.*var .* = require.*;\n/g,
        '');
      src = src.replace(
        /.*exports.*;\n/g,
        '');
      src = src.replace(
        /.*'use strict';\n/g,
        '');
      src = src.replace(
        /.*\/\* global .*\*\/\n/g,
        '');
      src = src.replace(
        /.*\/\* exported .*\*\/\n/g,
        '');
      src = src.replace(
        /\n([^\n])/g, function(match, p1) {
          return '\n  ' + p1;
        });
      return src;
    }
  },
  runtime: {
    src: [
      'lib/l20n/debug.js',
      'lib/l20n/errors.js',
      'lib/client/l20n/platform/io.js',
      'lib/l20n/events.js',
      'lib/l20n/plurals.js',
      'lib/l20n/format/properties/parser.js',
      'lib/l20n/resolver.js',
      'lib/l20n/util.js',
      'lib/l20n/pseudo.js',
      'lib/l20n/intl.js',
      'lib/l20n/context.js',
      'lib/l20n/env.js',
      'bindings/l20n/runtime.js',
      'bindings/l20n/dom.js',
    ],
    dest: 'dist/runtime/l10n.js',
  },
  buildtime: {
    src: [
      'bindings/l20n/buildtime.js',
    ],
    dest: 'dist/buildtime/l10n.js',
  },
  shell: {
    src: [
      'lib/l20n/debug.js',
      'lib/l20n/errors.js',
      'lib/client/l20n/platform/io.js',
      'lib/l20n/events.js',
      'lib/l20n/plurals.js',
      'lib/l20n/format/properties/parser.js',
      'lib/l20n/resolver.js',
      'lib/l20n/util.js',
      'lib/l20n/pseudo.js',
      'lib/l20n/intl.js',
      'lib/l20n/context.js',
      'lib/l20n/env.js',
      'bindings/l20n/shell.js',
    ],
    dest: 'dist/shell/l10n.js',
  },
};
