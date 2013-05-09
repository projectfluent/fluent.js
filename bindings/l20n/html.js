define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var Promise = require('./promise').Promise;
  var Intl = require('./platform/intl').Intl;
  var io = require('./platform/io');

  var ctx = L20n.getContext(document.location.host);

  function bootstrap() {
    var headNode = document.head;
    var data = headNode.querySelector('script[type="application/l10n-data+json"]');

    if (data) {
      ctx.data = JSON.parse(data.textContent);
    }

    var scripts = headNode.querySelectorAll('script[type="application/l20n"]');
    if (scripts.length) {
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].hasAttribute('src')) {
          ctx.linkResource(scripts[i].getAttribute('src'));
        } else {
          ctx.addResource(scripts[i].textContent);
        }
      }
      initializeDocumentContext();
    } else {
      var link = headNode.querySelector('link[rel="localization"]');
      if (link) {
        loadManifest(link.getAttribute('href')).then(
          initializeDocumentContext
        );
      } else {
        console.log("L20n error: You're using l20n without any resources! Please, link them above l20n.js");
      }
    }
    return true;
  }

  bootstrap();

  function initializeDocumentContext() {
    localizeDocument();

    ctx.addEventListener('ready', function() {
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      document.dispatchEvent(event);
    });

    ctx.addEventListener('error', function(e) {
      // XXX should we even emit this?
      if (false) {
        var event = document.createEvent('Event');
        event.initEvent('LocalizationFailed', false, false);
        document.dispatchEvent(event);
      }
    });

    ctx.freeze();
  }

  function loadManifest(url) {
    var deferred = new Promise();
    io.loadAsync(url).then(
      function(text) {
        var re = /{{\s*lang\s*}}/;
        var manifest = JSON.parse(text);
        var langList = Intl.prioritizeLocales(manifest.languages);
        ctx.registerLocales.apply(ctx, langList);
        manifest.resources.forEach(function(uri) {
          if (re.test(uri)) {
            ctx.linkResource(uri.replace.bind(uri, re));
          } else {
            ctx.linkResource(uri);
          }
        });
        deferred.fulfill();
      }
    );
    return deferred;
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
  }

  function onDocumentBodyReady() {
    if (document.readyState === 'interactive') {
      localizeNode(document);
      document.removeEventListener('readystatechange', onDocumentBodyReady);
    }
  }

  function localizeDocument() {
    if (document.body) {
      localizeNode(document);
    } else {
      document.addEventListener('readystatechange', onDocumentBodyReady);
    }
    HTMLDocument.prototype.__defineGetter__('l10n', function() {
      return ctx;
    });
  }

  function retranslate(node, l10n) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var entity, id, entity, node, i, key;

    for (i = 0; i < nodes.length; i++) {
      id = nodes[i].getAttribute('data-l10n-id');
      entity = l10n.entities[id];
      node = nodes[i];
      if (entity.value) {
        node.textContent = entity.value;
      }
      for (key in entity.attributes) {
        node.setAttribute(key, entity.attributes[key]);
      }
    }
    fireLocalizedEvent();
    // readd data-l10n-attrs
    // readd data-l10n-overlay
    // secure attribute access
  }

  function localizeNode(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
      ids.push(nodes[i].getAttribute('data-l10n-id'));
    }
    ctx.localize(ids, retranslate.bind(this, node));
  }

  // same as exports = L20n
  return L20n;

});
