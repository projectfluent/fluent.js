(function(){
  'use strict';

  var ctx = L20n.getContext();
  HTMLDocument.prototype.__defineGetter__('l10n', function() {
    return ctx;
  });

  var headNode;

  function bootstrap() {
    headNode = document.head;
    var link = headNode.querySelector('link[rel~="localization][rel~="manifest"]');
    if (link) {
      loadManifest(link.getAttribute('href')).then(
        initializeDocumentContext
      );
    } else {
      initializeDocumentContext();
    }
    return true;
  }

  bootstrap();

  function initializeDocumentContext() {
    setMetadata();

    var data = headNode.querySelector('script[type="application/l10n-data+json"]');
    if (data) {
      ctx.data = JSON.parse(data.textContent);
    }

    var res;
    var resources = headNode.querySelectorAll('script[type="application/l10n"]');
    for (var i = 0; i < resources.length; i++) {
      res = resources[i];
      if (res.hasAttribute('pathspec')) {
        ctx.addResource(res.getAttribute('pathspec'));
      } else if (res.hasAttribute('src')) {
        ctx.addResource(res.getAttribute('src'));
      } else {
        ctx.injectResource(null, res.textContent);
      }
    } 

    ctx.addEventListener('ready', function() {
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      document.dispatchEvent(event);
      if (document.body) {
        localizeDocument();
      } else {
        document.addEventListener('readystatechange', function() {
          if (document.readyState === 'interactive') {
            localizeDocument();
          }
        });
      }
    });

    ctx.addEventListener('error', function(e) {
      if (e.code & L20n.NOVALIDLOCALE_ERROR) {
        var event = document.createEvent('Event');
        event.initEvent('LocalizationFailed', false, false);
        document.dispatchEvent(event);
      }
    });

    ctx.freeze();

    HTMLElement.prototype.retranslate = function() {
      if (this.hasAttribute('data-l10n-id')) {
        localizeNode(ctx, this);
        return true;
      }
      throw Exception("Node not localizable");
    }
  }

  function loadManifest(url) {
    var deferred = when.defer();
    L20n.IO.loadAsync(url).then(
      function(text) {
        var manifest = JSON.parse(text);
        var langList = L20n.Intl.prioritizeLocales(Object.keys(manifest.locales));
        ctx.settings.locales = langList;
        ctx.settings.resources = manifest.locales;
        deferred.resolve();
      }
    );
    return deferred.promise;
  }

  function setMetadata() {
    var meta, metas;
    if (ctx.settings.locales.length == 0) {
      meta = headNode.querySelector('meta[name="content-languages"]');
      if (meta) {
        var locales = meta.content.split(',').map(String.trim);
        ctx.settings.locales = L20n.Intl.prioritizeLocales(locales);
      }
    }
    if (ctx.settings.schemes.length == 0) {
      metas = headNode.querySelectorAll('meta[name="pathspec"]');
      for (var i = 0; i < metas.length; i++) {
        ctx.settings.schemes.push(metas[i].content);
      }
    }
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
  }

  function localizeDocument() {
    var nodes = document.querySelectorAll('[data-l10n-id]');
    for (var i = 0; i < nodes.length; i++) {
      localizeNode(ctx, nodes[i]);
    }
    fireLocalizedEvent();
  }

  function localizeNode(ctx, node) {
    var l10nId = node.getAttribute('data-l10n-id');
    var args;

    if (node.hasAttribute('data-l10n-data')) {
      args = JSON.parse(node.getAttribute('data-l10n-data'));
    }
    try {
      var entity = ctx.getEntity(l10nId, args);
    } catch (e) {
      console.warn("Failed to localize node: "+l10nId);
      return false;
    }
    var l10nAttrs = null;
    if (node.hasAttribute('data-l10n-attrs')) {
      l10nAttrs = node.getAttribute('data-l10n-attrs').split(" ");
    }

    if (entity.attributes) {
      for (var i in entity.attributes) {
        if (!l10nAttrs || l10nAttrs.indexOf(i) !== -1)
          node.setAttribute(i, entity.attributes[i]);
      }
    }

    var l10nOverlay = node.hasAttribute('data-l10n-overlay');

    if (!l10nOverlay) {
      node.textContent = entity.value;
      return true;
    }
    var origNode = node.l10nSource;
    if (!origNode) {
      origNode = node.cloneNode(true);
      node.l10nSource = origNode;
    }
    node.innerHTML = entity.value;
    var children = node.getElementsByTagName('*');
    var origChild;
    for (var i = 0, child; child = children[i]; i++) {
      var path = getPathTo(child, node);
      origChild = getElementByPath(path, origNode);
      if (!origChild) {
        continue;
      }

      for (var k = 0, origAttr; origAttr = origChild.attributes[k]; k++) {
        if (!child.hasAttribute(origAttr.name)) {
          child.setAttribute(origAttr.nodeName, origAttr.value);
        }
      }
    }
    return true;
  }

  function getElementByPath(path, context) {
    var xpe = document.evaluate(path, context, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xpe.singleNodeValue;
  }


  function getPathTo(element, context) {
    var TYPE_ELEMENT = 1;

    if (element === context)
      return '.';

    var id = element.getAttribute('id');
    if (id)
      return '*[@id="' + id + '"]';

    var l10nPath = element.getAttribute('l10n-path');
    if (l10nPath)
      return l10nPath;

    var index = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0, sibling; sibling = siblings[i]; i++) {
      if (sibling === element) {
        var pathToParent = getPathTo(element.parentNode, context);
        return pathToParent + '/' + element.tagName + '[' + (index + 1) + ']';
      }
      if (sibling.nodeType === TYPE_ELEMENT && sibling.tagName === element.tagName)
        index++;
    }

    throw "Can't find the path to element " + element;
  }
})(this);
