(function(){
  var ctx = L20n.getContext();
  HTMLDocument.prototype.__defineGetter__('l10nCtx', function() {
    return ctx;
  });
})();

var headNode, ctx, links;

function bootstrap() {
  headNode = document.head;
  ctx = document.l10nCtx;
  links = headNode.getElementsByTagName('link')
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/manifest') {
      IO.loadAsync(links[i].getAttribute('href')).then(
        function(text) {
          var manifest = JSON.parse(text);
          var langList = L20n.Intl.prioritizeLocales(manifest.locales.supported);
          ctx.settings.locales = langList;
          ctx.settings.schemes = manifest.schemes;
          initializeDocumentContext();
        }
      );
      return;
    }
  }
  initializeDocumentContext();
}

bootstrap();

function initializeDocumentContext() {
  if (ctx.settings.locales.length === 0) {
    var metas = headNode.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('http-equiv') == 'Content-Language') {
        var locales = metas[i].getAttribute('content').split(',');
        for(i in locales) {
          locales[i] = locales[i].trim()
        }
        var langList = L20n.Intl.prioritizeLocales(locales);
        ctx.settings.locales = langList;
        break;
      }
    }
  }

  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/l20n')
      ctx.addResource(links[i].getAttribute('href'))
  }


  var scriptNodes = headNode.getElementsByTagName('script')
  for (var i=0;i<scriptNodes.length;i++) {
    if (scriptNodes[i].getAttribute('type')=='intl/l20n-data') {
      var contextData = JSON.parse(scriptNodes[i].textContent);
      ctx.data = contextData;
    } else if (scriptNodes[i].getAttribute('type')=='intl/l20n') {
      ctx.injectResource(null, scriptNodes[i].textContent);
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

  function localizeDocument() {
    var nodes = document.querySelectorAll('[data-l10n-id]');
    for (var i = 0, node; node = nodes[i]; i++) {
      localizeNode(ctx, node);
    }
    fireLocalizedEvent();
  }


  HTMLElement.prototype.retranslate = function() {
    if (this.hasAttribute('data-l10n-id')) {
      localizeNode(ctx, this);
      return;
    }
    throw Exception("Node not localizable");
  }

  HTMLElement.prototype.__defineGetter__('l10nData', function() {
    return this.nodeData || (this.nodeData = {});
  });

  HTMLDocument.prototype.__defineGetter__('l10nData', function() {
    return ctx.data || (ctx.data = {});
  });
}

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('DocumentLocalized', false, false);
  document.dispatchEvent(event);
}

function localizeNode(ctx, node) {
  var l10nId = node.getAttribute('data-l10n-id');
  var args;

  if (node.hasAttribute('data-l10n-args')) {
    args = JSON.parse(node.getAttribute('data-l10n-args'));
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
    for (var j in entity.attributes) {
      if (!l10nAttrs || l10nAttrs.indexOf(j) !== -1)
        node.setAttribute(j, entity.attributes[j]);
    }
  }

  var l10nOverlay = node.hasAttribute('data-l10n-overlay');

  if (!l10nOverlay) {
    node.textContent = entity.value;
    return true;
  }
  var origNode = node.l20nOrigNode;
  if (!origNode) {
    origNode = node.cloneNode(true);
    node.l20nOrigNode = origNode;
  }
  node.innerHTML = entity.value;

  var children = node.getElementsByTagName('*');
  for (var i=0,child;child  = children[i]; i++) {
    var path = getPathTo(child, node);
    origChild = getElementByPath(path, origNode);
    if (!origChild) {
      continue;
    }

    for (var k=0, origAttr; origAttr = origChild.attributes[k]; k++) {
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
  const TYPE_ELEMENT = 1;

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
