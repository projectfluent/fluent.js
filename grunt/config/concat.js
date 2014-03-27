'use strict';

module.exports = {
  options: {
    separator: '',
    banner: '' +
      '/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */\n' +
      '/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */\n' +
      '\n' +
      '(function(window, undefined) {\n' +
      '  \'use strict\';\n' +
      '\n',
    footer: '})(this);\n',
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
      'lib/client/l20n/platform/io.js',
      'lib/l20n/events.js',
      'lib/l20n/plurals.js',
      'lib/l20n/parser.js',
      'lib/l20n/compiler.js',
      'lib/l20n/locale.js',
      'lib/l20n/context.js',
      'bindings/l20n/buildtime.js',
      'bindings/l20n/ini.js',
      'bindings/l20n/dom.js',
    ],
    dest: 'dist/buildtime/l10n.js',
  },
};
