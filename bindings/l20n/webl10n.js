define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var io = require('./platform/io');

  var ctx = L20n.getContext();

  var resources = {};

  webL10nBridge();

  var ctxPopulated = false;
  function populateCtx(lang) {
    if (!ctxPopulated) {
      ctx.addEventListener('ready', function() {
        print('ctx is ready');
        //var nodes = getNodes(document);
        print(lang);
        //print(nodes);
        //for (var i = 0; i < nodes.nodes.length; i++) {
        //  translateNode(nodes.nodes[i], nodes.ids[i]);
        //}
        fireLocalizedEvent();
      });
      indexResources(document, function() {
        ctx.registerLocales(lang);
        bindResources();
        ctxPopulated = true;
        print('requesting locale: '+lang);
        ctx.requestLocales(lang);
      });
    } else {
        print('requesting locale2: '+lang);
      ctx.requestLocales(lang);
    }
  }

  function webL10nBridge() {
    if (!navigator.mozL10n) {
      navigator.mozL10n = {
        get: ctx.get.bind(ctx),
        localize: function() {},
        language: {
          get code() { return ctx.supportedLocales[0] },
          set code(lang) {
            populateCtx(lang);
          },
        },
        getDictionary: getSubDictionary,
        ready: function() {},
      };
    }
  }

  function indexResources(doc, cb) {
    var headNode = doc.head;
    var links = headNode.querySelectorAll('link[type="application/l10n"]');

    var iniToLoad = links.length;
    if (iniToLoad === 0) {
      return cb();
    }
    for (var i = 0; i < links.length; i++) {
      loadINI(links[i].getAttribute('href'), iniLoaded);
    };

    function iniLoaded(err) {
      if (err) {
        throw err;
      }
      iniToLoad--;
      if (iniToLoad == 0) {
        cb();
      }
    }
  }

  function bindResources() {
    resources['en-US'].forEach(function (res) {
      ctx.linkResource(res);
    });
  }

  function loadINI(url, cb) {
    io.loadAsync(url).then(
        function iniLoaded(text) {
          var res = addResourcesFromINI(url, text);
          for (var loc in res) {
            if (!resources[loc]) {
              resources[loc] = [];
            }
            for (var r in res[loc]) {
              resources[loc].push(res[loc][r]);
            }
          }
          cb();
        }
    );
  }

  var patterns = {
    ini: {
      section: /^\s*\[(.*)\]\s*$/,
      import: /^\s*@import\s+url\((.*)\)\s*$/i,
      locale: /{{\s*locale\s*}}/,
    }
  }

  function addResourcesFromINI(iniPath, source) {
    var entries = source.split(/[\r\n]+/);
    var langs = ['en-US'];
    var currentLang = 'en-US';
    var resources = {'en-US': []};
    var match, uri;

    var genericSection = true;

    for (var i = 0; i < entries.length; i++) {
      var line = entries[i];
      if (patterns['ini']['section'].test(line)) {
        match = patterns['ini']['section'].exec(line);
        langs.push(match[1]);
        resources[match[1]] = [];
        currentLang = match[1];
        genericSection = false;
      }
      if (patterns['ini']['import'].test(line)) {
        match = patterns['ini']['import'].exec(line);
        uri = relativePath(iniPath, match[1]);
        resources[currentLang].push(uri);
      }
    }
    return resources;
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

  // return a sub-dictionary sufficient to translate a given fragment
  function getSubDictionary(fragment) {
    if (!fragment) { // by default, return a clone of the whole dictionary
      return ctx.getEntities();
    }

    var dict = {};
    var elements = getTranslatableChildren(fragment);

    function checkGlobalArguments(str) {
      var match = getL10nArgs(str);
      for (var i = 0; i < match.length; i++) {
        var arg = match[i].name;
        if (arg in gL10nData) {
          dict[arg] = gL10nData[arg];
        }
      }
    }

    for (var i = 0, l = elements.length; i < l; i++) {
      var id = getL10nAttributes(elements[i]).id;
      var data = ctx.getEntity(id);
      if (!id || !data) {
        continue;
      }

      dict[id] = {'_': data.value};
      for (var prop in data) {
        var str = data[prop];
        //checkGlobalArguments(str);

        /*if (reIndex.test(str)) { // macro index
          for (var j = 0; j < kPluralForms.length; j++) {
            var key = id + '[' + kPluralForms[j] + ']';
            if (key in gL10nData) {
              dict[key] = gL10nData[key];
              checkGlobalArguments(gL10nData[key]);
            }
          }
        }*/
      }
    }

    return dict;
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

  function getNodes(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    if (node.hasAttribute && node.hasAttribute('data-l10n-id')) {
      // include the root node in nodes (and ids)
      nodes = Array.prototype.slice.call(nodes);
      nodes.push(node);
    }
    for (var i = 0; i < nodes.length; i++) {
      ids.push(nodes[i].getAttribute('data-l10n-id'));
    }
    return {
      ids: ids,
      nodes: nodes
    };
  }

  function translateNode(node, id, entity) {
    if (!entity) {
      entity = ctx.getEntity(id);
    }
    for (var key in entity.attributes) {
      node.setAttribute(key, entity.attributes[key]);
    }
    if (entity.value) {
      node.textContent = entity.value;
    }
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('localized', false, false);
    event.langauge = ctx.supportedLocales[0];
    window.dispatchEvent(event);
  }

  return L20n;
});
