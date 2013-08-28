define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var io = require('./platform/io');

  var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

  var ctx = L20n.getContext();

  bindPublicAPI();

  var bootstrapped = false;
  if (typeof(document) !== 'undefined') {
    bootstrap();
  }


  function bootstrap(lang) {
    bootstrapped = true;
    ctx.addEventListener('warning', console.warn.bind(console));
    ctx.addEventListener('info', console.warn.bind(console));

    var availableLocales = [];
    var localePlaceable = /\{\{\s*locale\s*\}\}/;

    var head = document.head;
    var iniLinks = head.querySelectorAll('link[type="application/l10n"]' + 
                                         '[href$=".ini"]');
    var jsonLinks = head.querySelectorAll('link[type="application/l10n"]' + 
                                          '[href$=".json"]');

    for (var i = 0; i < jsonLinks.length; i++) {
      var parts = jsonLinks[i].getAttribute('href').split(localePlaceable);
      ctx.linkResource(function(locale) {
        return parts[0] + locale + parts[1];
      });
    }

    var scripts = head.querySelectorAll('script[type="application/l10n"]');
    for (var i = 0; i < scripts.length; i++) {
      // pass the node to save memory
      ctx.addDictionary(scripts[i], scripts[i].getAttribute('lang'));
    }

    if (document.readyState !== 'loading') {
      ctx.ready(translateDocument);
    } else {
      document.addEventListener('readystatechange', function() {
        ctx.ready(translateDocument);
      });
    }

    var iniToLoad = iniLinks.length;
    if (iniToLoad === 0) {
      return freeze(lang);
    }
    for (var i = 0; i < iniLinks.length; i++) {
      var url = iniLinks[i].getAttribute('href');
      io.load(url, iniLoaded.bind(null, url));
    }

    function iniLoaded(url, err, text) {
      if (err) {
        throw err;
      }
      var ini = parseINI(text, url);
      availableLocales.push.apply(availableLocales, ini.locales);
      for (var i = 0; i < ini.resources.length; i++) {
        var parts = ini.resources[i].split('en-US');
        ctx.linkResource(function(locale) {
          return parts[0] + locale + parts[1];
        });
      }
      iniToLoad--;
      if (iniToLoad == 0) {
        freeze(lang, availableLocales);
      }
    }

  }

  function freeze(lang, available) {
    if (!available) {
      var metaLocs = document.head.querySelector('meta[name="locales"]');
      if (metaLocs) {
        available = metaLocs.getAttribute('content').split(',')
                                                    .map(String.trim);
      } else {
        available = [];
      }
    }
    ctx.registerLocales('en-US', available);
    ctx.requestLocales(lang || navigator.language);

    // listen to language change events
    if ('mozSettings' in navigator && navigator.mozSettings) {
      navigator.mozSettings.addObserver('language.current', function(event) {
        ctx.requestLocales(event.settingValue);
      });
    }
  }

  var patterns = {
    ini: {
      section: /^\s*\[(.*)\]\s*$/,
      import: /^\s*@import\s+url\((.*)\)\s*$/i
    }
  };

  function parseINI(source, iniPath) {
    var entries = source.split(/[\r\n]+/);
    var locales = ['en-US'];
    var genericSection = true;
    var uris = [];

    for (var i = 0; i < entries.length; i++) {
      var line = entries[i];
      // we only care about en-US resources
      if (genericSection && patterns['ini']['import'].test(line)) {
        var match = patterns['ini']['import'].exec(line);
        var uri = relativePath(iniPath, match[1]);
        uris.push(uri);
        continue;
      }
      // but we need the list of all locales in the ini, too
      if (patterns['ini']['section'].test(line)) {
        genericSection = false;
        var match = patterns['ini']['section'].exec(line);
        locales.push(match[1]);
      }
    }
    return {
      locales: locales,
      resources: uris
    };
  }

  function relativePath(baseUrl, url) {
    if (url[0] == '/') {
      return url;
    }
    var dirs = baseUrl.split('/')
      .slice(0, -1)
      .concat(url.split('/'))
      .filter(function(elem) {
        return elem !== '.';
      });

    if (dirs[0] !== '' && dirs[0] !== '..') {
      // if the base path doesn't start with / or ..
      dirs.unshift('.');
    }

    return dirs.join('/');
  }

  function bindPublicAPI() {
    navigator.mozL10n = ctx;
    ctx.localize = function() {};
    ctx.language = {
      get code() { 
        return ctx.supportedLocales[0];
      },
      set code(lang) {
        if (!bootstrapped) {
          bootstrap(lang);
        } else {
          ctx.requestLocales(lang);
        }
      },
      get direction() {
        if (rtlLocales.indexOf(ctx.supportedLocales[0]) >= 0) {
          return 'rtl';
        } else {
          return 'ltr';
        }
      }
    };
    ctx.getDictionary = getSubDictionary;
  }

  // return a sub-dictionary sufficient to translate a given fragment
  function getSubDictionary(fragment) {
    var ast = {
      type: 'WebL10n',
      body: []
    };

    if (!fragment) {
      ast.body = ctx.getSources();
      return ast;
    }

    var elements = getTranslatableChildren(fragment);

    for (var i = 0, l = elements.length; i < l; i++) {
      var id = elements[i].getAttribute('data-l10n-id');
      var source = ctx.getSource(id);
      ast.body.push(source);
      // check for any dependencies
      // XXX should this be recursive?
      if (source.value.type === 'ComplexString') {
        source.value.body.forEach(function (chunk) {
          if (chunk.type == 'Identifier') {
            ast.body.push(ctx.getSource(chunk.name));
          }
        });
      }
    }
    return ast;
  }

  function getTranslatableChildren(element) {
    return element ? element.querySelectorAll('*[data-l10n-id]') : [];
  }


  function getL10nAttributes(element) {
    if (!element) {
      return {};
    }

    var l10nId = element.getAttribute('data-l10n-id');
    var l10nArgs = element.getAttribute('data-l10n-args');
    var args = {};
    if (l10nArgs) {
      try {
        args = JSON.parse(l10nArgs);
      } catch (e) {
        consoleWarn('could not parse arguments for #' + l10nId);
      }
    }
    return { id: l10nId, args: args };
  }

  function translateDocument() {
    var nodes = document.querySelectorAll('[data-l10n-id]');
    for (var i = 0; i < nodes.length; i++) {
      translateNode(nodes[i]);
    }
    fireLocalizedEvent();
  }

  function translateNode(node) {
    var attrs = getL10nAttributes(node);
    var entity = navigator.mozL10n.getEntity(attrs.id, attrs.args);
    node.textContent = entity.value;

    for (var i in entity.attributes) {
      node.setAttribute(i, entity.attributes[i]);
    }
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('localized', false, false);
    event.language = ctx.supportedLocales[0];
    window.dispatchEvent(event);
  }

  return L20n;
});
