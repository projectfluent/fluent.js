'use strict';

/* Buildtime optimizations logic
 *
 * Below are defined functions to perform buildtime optimizations in Gaia.
 * These include flattening all localization resources into a single JSON file
 * and embedding a subset of translations in HTML to reduce file IO.
 *
 */

/* jshint -W104 */

var DEBUG = false;

var L10n = navigator.mozL10n._getInternalAPI();

navigator.mozL10n.bootstrap = function(file, debug) {
  init.call(this);
};

function init() {
  /* jshint boss:true */
  var nodes = document.head
                      .querySelectorAll('link[rel="localization"],' +
                                        'link[rel="manifest"]');
  for (var i = 0, node; node = nodes[i]; i++) {
    var type = node.getAttribute('rel') || node.nodeName.toLowerCase();
    switch (type) {
      case 'manifest':
        navigator.mozL10n.env = new L10n.Env(
          window.document ? document.URL : null,
          L10n.io.loadJSON(node.getAttribute('href')));
        break;
      case 'localization':
        navigator.mozL10n.resources.push(node.getAttribute('href'));
        break;
    }
  }
}

navigator.mozL10n.translateDocument = L10n.translateDocument;

navigator.mozL10n.getAST = function(loc) {
  var ast = [];

  for (var i = 0; i < navigator.mozL10n.ctx._resIds.length; i++) {
    var resId = navigator.mozL10n.ctx._resIds[i];

    var res1
  }
  dump('---\n');
  return ast;
};

function loadJSON() {
}

function load() {
}
