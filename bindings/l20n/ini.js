'use strict';

function loadINI(url, cb) {
  io.load(url, function(err, source) {
    if (!source) {
      cb();
      return;
    }

    var ini = parseINI(source, url);
    var pos = ctx.resLinks.indexOf(url);

    var patterns = ini.resources.map(function(x) {
      return x.replace('en-US', '{{locale}}');
    });
    var args = [pos, 1].concat(patterns);
    ctx.resLinks.splice.apply(ctx.resLinks, args);
    cb();
  });
}

function relativePath(baseUrl, url) {
  if (url[0] === '/') {
    return url;
  }

  var dirs = baseUrl.split('/')
    .slice(0, -1)
    .concat(url.split('/'))
    .filter(function(path) {
      return path !== '.';
    });

  return dirs.join('/');
}

var iniPatterns = {
  'section': /^\s*\[(.*)\]\s*$/,
  'import': /^\s*@import\s+url\((.*)\)\s*$/i,
  'entry': /[\r\n]+/
};

function parseINI(source, iniPath) {
  var entries = source.split(iniPatterns.entry);
  var locales = ['en-US'];
  var genericSection = true;
  var uris = [];
  var match;

  for (var line of entries) {
    // we only care about en-US resources
    if (genericSection && iniPatterns['import'].test(line)) {
      match = iniPatterns['import'].exec(line);
      var uri = relativePath(iniPath, match[1]);
      uris.push(uri);
      continue;
    }

    // but we need the list of all locales in the ini, too
    if (iniPatterns.section.test(line)) {
      genericSection = false;
      match = iniPatterns.section.exec(line);
      locales.push(match[1]);
    }
  }
  return {
    locales: locales,
    resources: uris
  };
}
