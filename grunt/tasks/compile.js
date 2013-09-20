'use strict';

module.exports = function (grunt) {
  grunt.registerMultiTask('compile', function () {
    var path = require('path');
    var fs = require('fs');
    var copy = require('dryice').copy;

    var root = path.join.bind(path, __dirname, '..', '..');

    function removeAmdefine(src) {
      src = String(src).replace(
        new RegExp('if\\s*\\(typeof\\s*define\\s*!==\\s*\'function\'\\)\\s*' +
          '{\\s*var\\s*define\\s*=\\s*require\\(\'amdefine\'\\)' +
          '\\(module\\);\\s*}\\s*',
          'g'),
        '');
      src = src.replace(
        'define(\'amdefine\', [], { /* dummy amdefine */ });\n',
        '');
      return src;
    }

    removeAmdefine.onRead = true;

    function removeDependencies(src) {
      return src.replace(
        /\b(define\(.*)\[.*\], /gm,
        '$1');
    }

    removeDependencies.onRead = true;

    function buildL20n(bindings) {
      console.log('\nCreating dist/' + bindings + '/l20n.js');

      var project = copy.createCommonJsProject({
        roots: [
          root('bindings') ,
          root('lib', 'client') ,
          root('lib'),
          // Look for dummy amdefine in build/ to make
          // the output prettier (bug 869210).
          root('build')
        ]
      });

      copy({
        source: [
          root('build', 'prefix', 'microrequire.js'),
          {
            project: project,
            require: ['l20n/' + bindings]
          },
          root('build', 'suffix', bindings + '.js')
        ],
        filter: [
          copy.filter.moduleDefines,
          removeAmdefine,
          removeDependencies
        ],
        dest: root('dist', bindings, '/l20n.js')
      });
    }

    function ensureDir(name) {
      var dirExists = false;
      try {
        dirExists = fs.statSync(name).isDirectory();
      } catch (err) {
      }

      if (!dirExists) {
        fs.mkdirSync(name, parseInt('0777', 8));
      }
    }

    var bindings = this.options().bindings;
    ensureDir(root('dist'));
    ensureDir(root('dist', bindings));
    buildL20n(bindings);
  });
};
