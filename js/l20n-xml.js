document.addEventListener("DOMContentLoaded", function() {
  if (!l20nlib)
    var l20nlib = "custom"; // system || custom


  if (l20nlib == "system") {
    Components.utils.import("resource://gre/modules/L20n.jsm");
  }

  var ctx = L20n.getContext();

  var headNode = null;
  var headNodes = document.getElementsByTagName('head');
  if (headNodes)
    headNode = headNodes[0];

  if (headNode == null)
    return;

  var linkNodes = headNode.getElementsByTagName('link')
  for (var i=0;i<linkNodes.length;i++) {
    if (linkNodes[i].getAttribute('type')=='intl/l20n')
      ctx.addResource(linkNodes[i].getAttribute('href'))
  }

  var scriptNodes = headNode.getElementsByTagName('script')
  for (var i=0;i<scriptNodes.length;i++) {
    if (scriptNodes[i].getAttribute('type')=='application/l20n') {
      var contextData = JSON.parse(scriptNodes[i].textContent);
      ctx.data = contextData;
    }
  }

  ctx.onReady = function() {
    var nodes = document.body.getElementsByTagName('*');
    var l10nId = null;
    for (var i=0, node; node = nodes[i]; i++) {
      if (l10nId = node.getAttribute('l10n-id')) {
        // deep-copy the original node
        var origNode = node.cloneNode(true);
        node.innerHTML = ctx.get(l10nId);
        // get attributes from the LO
        var attrs = ctx.getAttributes(l10nId);
        if (attrs) {
          for (var j in attrs)
            node.setAttribute(j, attrs[j]);
        }
        // overlay the attributes of descendant nodes
        var children = node.getElementsByTagName('*');
        for (var j=0, child; child = children[j]; j++) {
          var path = child.getAttribute('l10n-path');
          if ( ! path)
            path = getPathTo(child, node);
          console.log(path);
          // match the child node with the equivalent node in origNode
          var origChild = getElementByPath(path, origNode);
          for (var k=0, origAttr; origAttr = origChild.attributes[k]; k++) {
            // if ( ! origAttr.specified) continue;  // for IE?
            if ( ! child.hasAttribute(origAttr.name))
              child.setAttribute(origAttr.nodeName, origAttr.value);
          }
        }
      }
    }
  }

  ctx.freeze();
}, false);

function getPathTo(element, context) {
  if (element === context)
    return '.';
  if (element.id !== '')
    return 'id("' + element.id + '")';
  var localPath = element.getAttribute('l10n-path');
  if (localPath)
    return element.getAttribute('l10n-path');

  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i=0, sibling; sibling = siblings[i]; i++) {
    if (sibling === element) {
      var pathToParent = getPathTo(element.parentNode, context);
      return pathToParent + '/' + element.tagName + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
      ix++;
  }
}

function getElementByPath(path, context) {
  var xpe = document.evaluate(path, context, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return xpe.singleNodeValue;
}

// vim: tw=2 et sw=2 sts=2
