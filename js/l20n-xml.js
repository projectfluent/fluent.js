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

  ctx.onReady = function() {
    var nodes = document.body.getElementsByTagName('*');
    var l10nId = null;
    for (var i=0;i<nodes.length;i++) {
      if (l10nId = nodes[i].getAttribute('l10n-id')) {
        nodes[i].innerHTML = ctx.get(l10nId);
        var attrs = ctx.getAttributes(l10nId);
        if (attrs) {
          for (var j in attrs)
            nodes[i].setAttribute(j, attrs[j]);
        }
      }
    }
  }

  ctx.freeze();
}, false);
