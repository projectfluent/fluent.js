(function(){
  'use strict';

  var ctx = L20n.getContext(document.location.host);
  HTMLDocument.prototype.__defineGetter__('l10n', function() {
    return ctx;
  });
  navigator.mozL10n = {
    'ready': function(cb) {
      ctx.addEventListener(cb);
    },
    'translate': function(node) {
      localizeNode(node);
    }
  };

  var headNode;

  function bootstrap() {
    headNode = document.head;
    var data = headNode.querySelector('script[type="application/l10n-data+json"]');

    if (data) {
      ctx.data = JSON.parse(data.textContent);
    }

    var script = headNode.querySelector('script[type="application/l20n"]');
    if (script) {
      if (script.hasAttribute('src')) {
        ctx.linkResource(script.getAttribute('src'));
      } else {
        ctx.addResource(script.textContent);
      }
      initializeDocumentContext();
    } else {
      var link = headNode.querySelector('link[rel="localization"]');
      if (link) {
        loadManifest(link.getAttribute('href')).then(
          initializeDocumentContext
        );
      }
    }
    return true;
  }

  bootstrap();

  function initializeDocumentContext() {
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
    var deferred = new Promise();
    L20n.IO.load(url, true).then(
      function(text) {
        var manifest = JSON.parse(text);
        var langList = L20n.Intl.prioritizeLocales(manifest.languages);
        ctx.registerLocales.apply(this, langList);
        ctx.linkResource(function(lang) {
          return manifest.resources[0].replace("{{lang}}", lang);
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

  function localizeDocument() {
    localizeNode(document);
    fireLocalizedEvent();
  }
  function localizeNode(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
      ids.push(nodes[i].getAttribute('data-l10n-id'));
    }
    ctx.localize(ids, {}, function(d) {
      for (var i = 0; i < nodes.length; i++) {
        var id = nodes[i].getAttribute('data-l10n-id');
        if (d[id].value) {
          nodes[i].textContent = d[id].value;
        }
        for (var key in d[id].attributes) {
          nodes[i].setAttribute(key, d[id].attributes[key]);
        }
      }
      // readd data-l10n-attrs
      // readd data-l10n-overlay
      // secure attribute access
    });
  }

})(this);
