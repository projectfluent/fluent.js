(function(){
  'use strict';
  var ctx = this.L20n.getContext(document.location.host);
  var headNode;
  if (document.body) {
    document.body.style.visibility = 'hidden';
  }

  function bootstrap() {
    headNode = document.head;
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
    localizeDocument();

    ctx.addEventListener('ready', function() {
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      document.dispatchEvent(event);
    });

    ctx.addEventListener('error', function(e) {
      if (e.code & L20n.NOVALIDLOCALE_ERROR) {
        var event = document.createEvent('Event');
        event.initEvent('LocalizationFailed', false, false);
        document.dispatchEvent(event);
      }
    });

    ctx.freeze();
  }

  function loadManifest(url) {
    var deferred = new L20n.Promise();
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
    document.body.style.visibility = 'visible';
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
  }

  function onDocumentBodyReady() {
    if (document.readyState === 'interactive') {
      localizeNode(document);
      fireLocalizedEvent();
      document.removeEventListener('readystatechange', onDocumentBodyReady);
    }
  }

  function localizeDocument() {
    if (document.body) {
      localizeNode(document);
      fireLocalizedEvent();
    } else {
      document.addEventListener('readystatechange', onDocumentBodyReady);
    }
    HTMLDocument.prototype.__defineGetter__('l10n', function() {
      return ctx;
    });
  }

  function retranslate(node, l10n) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var entity;
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute('data-l10n-id');
      var entity = l10n.entities[id];
      var node = nodes[i];
      if (entity.value) {
        node.textContent = entity.value;
      }
      for (var key in entity.attributes) {
        node.setAttribute(key, entity.attributes[key]);
      }
    }
    // readd data-l10n-attrs
    // readd data-l10n-overlay
    // secure attribute access
  }

  function localizeNode(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].hasAttribute('data-l10n-args')) {
        ids.push([nodes[i].getAttribute('data-l10n-id'),
                  JSON.parse(nodes[i].getAttribute('data-l10n-args'))]);
      } else {
        ids.push(nodes[i].getAttribute('data-l10n-id'));
      }
    }
    ctx.localize(ids, retranslate.bind(this, node));
  }

}).call(this);
