define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var Promise = require('./promise').Promise;
  var io = require('./platform/io');

  var localizeHandler;
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

    if (document.readyState !== 'loading') {
      collectNodes();
    } else {
      document.addEventListener('readystatechange', collectNodes);
    }
  }

  function collectNodes() {
    var nodes = getNodes(document.body);
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
        documentLocalized = true;
        fireLocalizedEvent();
      }
    });

    // TODO this might fail; silence the error
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
    /**
     * For now we just take nav.language, but we'd prefer to get
     * a list of locales that the user can read sorted by user's preference
     **/
    var langList = Intl.prioritizeLocales(manifest.languages,
                                          [navigator.language]);
    ctx.registerLocales.apply(ctx, langList);
    manifest.resources.forEach(function(uri) {
      if (re.test(uri)) {
        ctx.linkResource(uri.replace.bind(uri, re));
      } else {
        ctx.linkResource(uri);
      }
    });
    navigator.mozSettings.addObserver('language.current', function(event) {
      var langList = Intl.prioritizeLocales(manifest.languages,
                                            [event.settingValue]);
      ctx.registerLocales.apply(ctx, langList);
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
    for (key in entity.attributes) {
      node.setAttribute(key, entity.attributes[key]);
    }
    if (entity.value) {
      if (node.hasAttribute('data-l10n-overlay')) {
        overlayNode(node, entity.value);
      } else {
        node.textContent = entity.value;
      }
    }
    // readd data-l10n-attrs
    // secure attribute access
  }

  function overlayNode(node, value) {
    // This code operates on three DOMFragments:
    //
    // node - the fragment that is currently attached to the document
    //
    // sourceNode - in retranslation case, we need to store the original
    // node from before translation, in order to properly apply path matchings
    //
    // l10nNode - new fragment that takes the l10n value and applies attributes
    // from the sourceNode for matching nodes

    var sourceNode = node._l20nSourceNode || node;
    var l10nNode = sourceNode.cloneNode(false);

    l10nNode.innerHTML = value;

    var children = l10nNode.getElementsByTagName('*');
    for (var i = 0, child; child = children[i]; i++) {
      var path = getPathTo(child, l10nNode);
      var sourceChild = getElementByPath(path, sourceNode);
      if (!sourceChild) {
        continue;
      }

      for (var k = 0, sourceAttr; sourceAttr = sourceChild.attributes[k]; k++) {
        if (!child.hasAttribute(sourceAttr.name)) {
          child.setAttribute(sourceAttr.nodeName, sourceAttr.value);
        }
      }
    }

    l10nNode._l20nSourceNode = sourceNode;
    node.parentNode.replaceChild(l10nNode, node);
    return;
  }


  function getPathTo(element, context) {
    const TYPE_ELEMENT = 1;

    if (element === context) {
      return '.';
    }

    var id = element.getAttribute('id');
    if (id) {
      return '*[@id="' + id + '"]';
    }

    var l10nPath = element.getAttribute('data-l10n-path');
    if (l10nPath) {
      element.removeAttribute('data-l10n-path');
      return l10nPath;
    }

    var index = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0, sibling; sibling = siblings[i]; i++) {
      if (sibling === element) {
        var pathToParent = getPathTo(element.parentNode, context);
        return pathToParent + '/' + element.tagName + '[' + (index + 1) + ']';
      }
      if (sibling.nodeType === TYPE_ELEMENT && sibling.tagName === element.tagName) {
        index++;
      }
    }

    throw "Can't find the path to element " + element;
  }

  function getElementByPath(path, context) {
    var xpe = document.evaluate(path, context, null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xpe.singleNodeValue;
  }

  // same as exports = L20n;
  return L20n;

});
