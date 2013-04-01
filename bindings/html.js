(function(){
  'use strict';

  var ctx = L20n.getContext(document.location.host);
  HTMLDocument.prototype.__defineGetter__('l10n', function() {
    return ctx;
  });

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
      } else {
        initializeDocumentContext();
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
    var deferred = when.defer();
    L20n.IO.loadAsync(url).then(
      function(text) {
        var manifest = JSON.parse(text);
        var langList = L20n.Intl.prioritizeLocales(Object.keys(manifest.locales));
        ctx.settings.locales = langList;
        for (var loc in manifest.locales) {
          // res can be a list of resources
          ctx.addResource(manifest.locales[loc], loc);
        }
        deferred.resolve();
      }
    );
    return deferred.promise;
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
  }

  function localizeDocument() {
    var nodes = document.querySelectorAll('[data-l10n-id]');
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
      ids.push(nodes[i].getAttribute('data-l10n-id'));
    }
    ctx.localize(ids, {}, function(d) {
      for (var i = 0; i < nodes.length; i++) {
        var id = nodes[i].getAttribute('data-l10n-id');
        nodes[i].textContent = d[id].value;
        for (var key in d[id].attributes) {
          nodes[i].setAttribute(key, d[id].attributes[key]);
        }
      }
      console.log('localizing');
      // readd data-l10n-attrs
      // readd data-l10n-overlay
    });
    fireLocalizedEvent();
  }

})(this);
