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
      'lib/client/l20n/platform/io.js',
      'lib/l20n/events.js',
      'lib/l20n/plurals.js',
      'lib/l20n/parser.js',
      'lib/l20n/compiler.js',
      'lib/l20n/locale.js',
      'lib/l20n/context.js',
      'bindings/l20n/runtime.js',
      'bindings/l20n/ini.js',
      'bindings/l20n/dom.js',
    ],
    dest: 'dist/runtime/l10n.js',
  },
  buildtime: {
    src: [
      'lib/l20n/util.js',
      'lib/l20n/pseudo.js',
      'bindings/l20n/buildtime.js',
    ],
    dest: 'dist/buildtime/l10n.js',
  },
  shell: {
    src: [
      'lib/client/l20n/platform/io.js',
      'lib/l20n/events.js',
      'lib/l20n/plurals.js',
      'lib/l20n/parser.js',
      'lib/l20n/compiler.js',
      'lib/l20n/locale.js',
      'lib/l20n/context.js',
      'bindings/l20n/shell.js',
    ],
    dest: 'dist/shell/l10n.js',
  },
};
