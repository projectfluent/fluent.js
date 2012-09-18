(function(){
  var ctx = L20n.getContext();
  HTMLDocument.prototype.__defineGetter__('l10nCtx', function() {
    return ctx;
  });
})();

document.addEventListener("DOMContentLoaded", function() {
  var headNode = document.getElementsByTagName('head')[0];

  if (!headNode)
    return;


  var links = headNode.getElementsByTagName('link')
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/manifest') {
      download(links[i].getAttribute('href'), function(manifest) {
        var ctx = document.l10nCtx;

        var langList = L20n.Intl.prioritizeLocales(manifest.locales.supported);
        ctx.settings.locales = langList;
        ctx.settings.schemes = manifest.schemes;

        initializeDocumentContext();
      });
      return;
    }
  }

  initializeDocumentContext();
});

function download(uri, callback) {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType("application/json");
  xhr.addEventListener("load", function() {
    callback(JSON.parse(xhr.responseText))
  });
  xhr.open('GET', uri, true);
  xhr.send('');
}

function initializeDocumentContext() {
  var headNode = document.getElementsByTagName('head')[0];
  var ctx = document.l10nCtx;

  if (ctx.settings.locales === null) {
    var metas = headNode.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('http-equiv') == 'Content-Language') {
        var locales = metas[i].getAttribute('Content').split(',');
        for(i in locales) {
          locales[i] = locales[i].trim()
        }
        var langList = L20n.Intl.prioritizeLocales(locales);
        ctx.settings.locales = langList;
        break;
      }
    }
  }

  var links = headNode.getElementsByTagName('link')
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/l20n')
      ctx.addResource(links[i].getAttribute('href'))
  }

  ctx.freeze();

  var scriptNodes = headNode.getElementsByTagName('script')
  for (var i=0;i<scriptNodes.length;i++) {
    if (scriptNodes[i].getAttribute('type')=='application/l20n') {
      var contextData = JSON.parse(scriptNodes[i].textContent);
      ctx.data = contextData;
    }
  }
  
  ctx.addEventListener('ready', function() {
    var event = document.createEvent('Event');
    event.initEvent('LocalizationReady', false, false);
    document.dispatchEvent(event);

    var nodes = document.querySelectorAll('[l10n-id]');
    for (var i = 0, node; node = nodes[i]; i++) {
      localizeNode(ctx, node);
    }
    fireLocalizedEvent();
  });

  HTMLElement.prototype.retranslate = function() {
    if (this.hasAttribute('l10n-id')) {
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

function getPathTo(element, context, ignoreL10nPath) {
  const TYPE_ELEMENT = 1;

  if (element === context)
    return '.';

  var id = element.getAttribute('id');
  if (id)
    return '*[@id="' + id + '"]';

  var l10nPath = !ignoreL10nPath && element.getAttribute('l10n-path');
  if (l10nPath)
    return l10nPath;

  var index = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0, sibling; sibling = siblings[i]; i++) {
    if (sibling === element) {
      var pathToParent = getPathTo(element.parentNode, context, ignoreL10nPath);
      return pathToParent + '/' + element.tagName + '[' + (index + 1) + ']';
    }
    if (sibling.nodeType === TYPE_ELEMENT && sibling.tagName === element.tagName)
      index++;
  }

  throw "Can't find the path to element " + element;
}

function getElementByPath(path, context) {
  var xpe = document.evaluate(path, context, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return xpe.singleNodeValue;
}

function localizeNode(ctx, node) {
  var l10nId = node.getAttribute('l10n-id');
  var args;

  // node.nodeData must not be exposed
  if (node.nodeData) {
    args = node.nodeData;
  } else if (node.hasAttribute('l10n-args')) {
    args = JSON.parse(node.getAttribute('l10n-args'));
    node.nodeData = args;
  }
  // get attributes from the LO
  try {
    var attrs = ctx.getAttributes(l10nId, args);
  } catch (e) {
    console.warn("Failed to localize node: "+l10nId);
    return false;
  }
  var l10nAttrs;
  if (node.hasAttribute('l10n-attrs'))
    l10nAttrs = node.getAttribute('l10n-attrs').split(" ");
  else
    l10nAttrs = null;
  if (attrs) {
    for (var j in attrs) {
      if (!l10nAttrs || l10nAttrs.indexOf(j) !== -1)
        node.setAttribute(j, attrs[j]);
    }
  }
  var valueFromCtx = ctx.get(l10nId, args);
  if (valueFromCtx === null)
    return;

  // Deep-copy the original node.  Note that `origNode` isn't attached anywhere 
  // in the DOM, thus making it impossible for a malevolent XPath expression to 
  // step outside of it.
  var origNode = node.cloneNode(true);
  var origL10nStatus = origNode.getAttribute('l10n-status');
  node.innerHTML = valueFromCtx;
  node.setAttribute('l10n-status', 'translated');

  // overlay the attributes of descendant nodes
  var children = node.getElementsByTagName('*');
  for (var i = 0, child; child = children[i]; i++) {
    // Match the `child` node with the equivalent node in `origNode`.
    // If `origNode` has a non-empty `l10n-status`, it has already been 
    // translated once.  `getPathTo` will follow the closest `l10n-path` it can 
    // find on `child` or its ancestors in order to find the path to the true 
    // source equivalent of `child` in `origNode`.
    var  path = getPathTo(child, node, origL10nStatus);
    var origChild = getElementByPath(path, origNode);
    if (!origChild)
      continue;

    for (var k = 0, origAttr; origAttr = origChild.attributes[k]; k++) {
      if (!child.hasAttribute(origAttr.name)) {
        child.setAttribute(origAttr.nodeName, origAttr.value);
      }
    }
  }
  return true;
}
