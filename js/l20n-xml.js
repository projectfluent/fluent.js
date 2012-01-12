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
    for (var i=0;i<nodes.length;i++) {
      if (l10nId = nodes[i].getAttribute('l10n-id')) {
        var args = nodes[i].getAttribute('l10n-args');
        if (args) {
          args = JSON.parse(args);
        }
        nodes[i].innerHTML = ctx.get(l10nId, args);
        var attrs = ctx.getAttributes(l10nId, args);
        if (attrs) {
          for (var j in attrs)
            nodes[i].setAttribute(j, attrs[j]);
        }
      }
    }
  }

  ctx.freeze();
}, false);
