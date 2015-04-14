'use strict';

function strip(src) {
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

function buildtimify(src) {
  return src.replace(
    /Runtime/g,
    'Packaged');
}

var clientsideOpts = {
  separator: '',
  banner: '' +
    '(function(window, undefined) {\n' +
    '  \'use strict\';\n' +
    '\n' +
    '  /* jshint validthis:true */',
  footer: '\n})(this);\n',
  process: strip
};

var buildtimeOpts = {
  process: buildtimify
};

module.exports = {
  web: {
    options: clientsideOpts,
    src: [
      'src/lib/debug.js',
      'src/lib/errors.js',
      'src/lib/events.js',
      'src/lib/plurals.js',
      'src/lib/format/properties/parser.js',
      'src/lib/resolver.js',
      'src/lib/util.js',
      'src/lib/pseudo.js',
      'src/lib/view.js',
      'src/lib/env.js',
      'src/bindings/html/io.js',
      'src/bindings/html/allowed.js',
      'src/bindings/html/observer.js',
      'src/bindings/html/index.js',
      'src/bindings/html/dom.js',
      'src/runtime/web/index.js',
    ],
    dest: 'dist/web/l10n3.js',
  },
  gaiabuild: {
    options: buildtimeOpts,
    files: {
      'dist/gaiabuild/l10n.js': [
        'src/bindings/gaiabuild/index.js'
      ],
      'dist/gaiabuild/qps.js': [
        'src/lib/util.js',
        'src/lib/pseudo.js'
      ]
    }
  },
};
