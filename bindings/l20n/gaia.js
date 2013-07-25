define(function (require, exports, module) {
  'use strict';

  var L20n = require('../l20n');
  var Promise = require('./promise').Promise;
  var io = require('./platform/io');

  var localizeHandler;
  var ctx = L20n.getContext(document.location.host);

  // http://www.w3.org/International/questions/qa-scripts
  // XXX: bug 884308
  // each localization should decide which direction it wants to use
  var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

  var documentLocalized = false;

  bootstrap();

  function bootstrap() {
    var headNode = document.head;
    var data = 
      headNode.querySelector('script[type="application/l10n-data+json"]');
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
      ctx.freeze();
    } else {
      var metaLoc = headNode.querySelector('meta[name="locales"]');
      var metaDefLoc = headNode.querySelector('meta[name="default_locale"]');
      var metaRes = headNode.querySelector('meta[name="resources"]');
      if (metaLoc && metaDefLoc && metaRes) {
        initializeManifest({
          'locales': metaLoc.getAttribute('content').split(',')
                            .map(String.trim),
          'default_locale': metaDefLoc.getAttribute('content'),
          'resources': metaRes.getAttribute('content').split('|')
                              .map(String.trim)
        });
        ctx.freeze();
      } else {
        var link = headNode.querySelector('link[rel="localization"]');
        if (link) {
          // XXX add errback
          loadManifest(link.getAttribute('href')).then(ctx.freeze.bind(ctx));
        } else {
          console.warn('L20n: No resources found. (Put them above l20n.js.)');
        }
      }
    }

    if (document.readyState !== 'loading') {
      collectNodes();
    } else {
      document.addEventListener('readystatechange', collectNodes);
    }
    bindPublicAPI();
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

      // 'locales' in l10n.reason means that localize has been
      // called because of locale change
      if ('locales' in l10n.reason && l10n.reason.locales.length) {
        document.documentElement.lang = l10n.reason.locales[0];
        document.documentElement.dir =
          rtlLocales.indexOf(l10n.reason.locales[0]) === -1 ? 'ltr' : 'rtl';
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

  function bindPublicAPI() {
    ctx.addEventListener('error', console.warn.bind(console));
    ctx.addEventListener('debug', console.error.bind(console));

    ctx.localizeNode = function localizeNode(node) {
      var nodes = getNodes(node);
      var many = localizeHandler.extend(nodes.ids);
      for (var i = 0; i < nodes.nodes.length; i++) {
        translateNode(nodes.nodes[i], nodes.ids[i],
                      many.entities[nodes.ids[i]]);
      }
    };
    ctx.once = function once(callback) {
      if (documentLocalized) {
        callback();
      } else {
        var callAndRemove = function callAndRemove() {
          document.removeEventListener('DocumentLocalized', callAndRemove);
          callback();
        };
        document.addEventListener('DocumentLocalized', callAndRemove);
      }
    };
    document.l10n = ctx;
  }

  function initializeManifest(manifest) {
    var re = /{{\s*locale\s*}}/;
    var Intl = require('./intl').Intl;
    /**
     * For now we just take nav.language, but we'd prefer to get
     * a list of locales that the user can read sorted by user's preference
     **/
    var locList = Intl.prioritizeLocales(manifest.locales,
                                         [navigator.language],
                                         manifest.default_locale);
    ctx.registerLocales.apply(ctx, locList);
    manifest.resources.forEach(function(uri) {
      if (re.test(uri)) {
        ctx.linkResource(uri.replace.bind(uri, re));
      } else {
        ctx.linkResource(uri);
      }
    });
    navigator.mozSettings.addObserver('language.current', function(event) {
      var locList = Intl.prioritizeLocales(manifest.locales,
                                           [event.settingValue],
                                           manifest.default_locale);
      ctx.registerLocales.apply(ctx, locList);
    });
  }

  function relativeToManifest(manifestUrl, url) {
    if (url[0] == '/') {
      return url;
    }
    var dirs = manifestUrl.split('/')
                          .slice(0, -1)
                          .concat(url.split('/'))
                          .filter(function(elem) {
                            return elem !== '.';
                          });

    if (dirs[0] !== '' && dirs[0] !== '..') {
      // if the manifest path doesn't start with / or ..
      dirs.unshift('.');
    }

    return dirs.join('/');
  }

  function loadManifest(url) {
    var deferred = new Promise();
    io.loadAsync(url).then(
      function(text) {
        var manifest = JSON.parse(text);
        manifest.resources = manifest.resources.map(
                               relativeToManifest.bind(this, url));
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
    for (var key in entity.attributes) {
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
    var TYPE_ELEMENT = 1;

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
      if (sibling.nodeType === TYPE_ELEMENT && 
          sibling.tagName === element.tagName) {
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
