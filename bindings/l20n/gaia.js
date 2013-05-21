define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var Promise = require('./promise').Promise;
  var io = require('./platform/io');

  var localizeHandler;
  var localizeBodyHandler;
  var ctx = L20n.getContext(document.location.host);

  var documentLocalized = false;

  bootstrap();

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
      loadResources();
    } else {
      var metaLang = headNode.querySelector('meta[name="languages"]');
      var metaRes = headNode.querySelector('meta[name="resources"]');
      if (metaLang && metaRes) {
        initializeManifest({
          'languages': metaLang.getAttribute('content').split(',').map(String.trim),
          'resources': metaRes.getAttribute('content').split('|').map(String.trim)
        });
        loadResources();
      } else {
        var link = headNode.querySelector('link[rel="localization"]');
        if (link) {
          // XXX add errback
          loadManifest(link.getAttribute('href')).then(loadResources);
        } else {
          console.warn("L20n: No resources found. (Put them above l20n.js.)");
        }
      }
    }
    document.addEventListener('readystatechange', collectNodes);
  }

  function localizeBody(nodes) {
    localizeHandler = ctx.localize(nodes.ids, function(l10n) {
      if (!nodes) {
        nodes = getNodes(document.body);
      }
      for (var i = 0; i < nodes.nodes.length; i++) {
        translateNode(nodes.nodes[i],
          nodes.ids[i],
          l10n.entities[nodes.ids[i]]);
      }
      nodes = null;
      if (!documentLocalized) {
        fireLocalizedEvent();
        documentLocalized = true;
      }
    });
    ctx.removeEventListener('ready', localizeBodyHandler);
  }

  function collectNodes() {
    // this function is fired right when we have document.body available
    //
    // We collect the nodes and then we check if the l10n context is ready.
    // If it is ready, we create localize block for it, if not
    // we set an event listener on context and add it when it's ready.
    var nodes = getNodes(document.body);


    if (ctx.isReady) {
      localizeBody(nodes);
    } else {
      localizeBodyHandler = localizeBody.bind(this, nodes);
      ctx.addEventListener('ready', localizeBodyHandler);
    }
    document.removeEventListener('readystatechange', collectNodes);
  }

  function loadResources() {
    ctx.freeze();

    ctx.addEventListener('error', console.warn);
    document.l10n = ctx;
    document.l10n.localizeNode = function localizeNode(node) {
      var nodes = getNodes(node);
      var many = localizeHandler.extend(nodes.ids);
      for (var i = 0; i < nodes.nodes.length; i++) {
        translateNode(nodes.nodes[i], nodes.ids[i],
                      many.entities[nodes.ids[i]]);
      }
    };
  }

  function initializeManifest(manifest) {
    var re = /{{\s*lang\s*}}/;
    var Intl = require('./platform/intl').Intl;
    var langList = Intl.prioritizeLocales(manifest.languages);
    ctx.registerLocales.apply(ctx, langList);
    manifest.resources.forEach(function(uri) {
      if (re.test(uri)) {
        ctx.linkResource(uri.replace.bind(uri, re));
      } else {
        ctx.linkResource(uri);
      }
    });
  }

  function loadManifest(url) {
    var deferred = new Promise();
    io.loadAsync(url).then(
      function(text) {
        var manifest = JSON.parse(text);
        initializeManifest(manifest);
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

  function getNodes(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    if (node.hasAttribute('data-l10n-id')) {
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
      return;
    }
    if (entity.value) {
      node.textContent = entity.value;
    }
    for (key in entity.attributes) {
      node.setAttribute(key, entity.attributes[key]);
    }
    // readd data-l10n-attrs
    // readd data-l10n-overlay
    // secure attribute access
  }

  // same as exports = L20n;
  return L20n;

});
