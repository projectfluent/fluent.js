define(function (require) {
  'use strict';

  var DEBUG = false;

  var L20n = require('../l20n');
  var io = require('./platform/io');

  // absolute URLs start with a slash or contain a colon (for schema)
  var reAbsolute = /^\/|:/;

  // http://www.w3.org/International/questions/qa-scripts
  // XXX: Bug 884308: this should be defined by each localization independently
  var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

  var whitelist = {
    elements: [
      'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data',
      'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u',
      'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'
    ],
    attributes: {
      global: [ 'title', 'aria-label' ],
      a: [ 'download' ],
      area: [ 'download', 'alt' ],
      // value is special-cased in isAttrAllowed
      input: [ 'alt', 'placeholder' ],
      menuitem: [ 'label' ],
      menu: [ 'label' ],
      optgroup: [ 'label' ],
      option: [ 'label' ],
      track: [ 'label' ],
      img: [ 'alt' ],
      textarea: [ 'placeholder' ],
      th: [ 'abbr']
    }
  };

  // Start-up logic (pre-bootstrap)
  // =========================================================================

  var ctx = L20n.getContext(document.location.host);
  bindPublicAPI(ctx);

  var localizeHandler;
  var documentLocalized = false;

  // if the DOM is loaded, bootstrap now to fire 'DocumentLocalized'
  if (document.readyState === 'complete') {
    window.setTimeout(bootstrap);
  } else {
    // or wait for the DOM to be interactive to try to pretranslate it 
    // using the inline resources
    waitFor('interactive', bootstrap);
  }

  function waitFor(state, callback) {
    if (document.readyState === state) {
      return callback();
    }
    document.addEventListener('readystatechange', function() {
      if (document.readyState === state) {
        callback();
      }
    });
  }

  function bindPublicAPI(ctx) {
    if (DEBUG) {
      ctx.addEventListener('error', console.error.bind(console));
      ctx.addEventListener('warning', console.warn.bind(console));
    }
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


  // Bootstrap: set up the context and call requestLocales()
  // ==========================================================================

  function bootstrap() {
    var headNode = document.head;
    var data =
      headNode.querySelector('script[type="application/l10n-data+json"]');
    if (data) {
      ctx.updateData(JSON.parse(data.textContent));
    }

    var link = headNode.querySelector('link[rel="localization"]');
    if (link) {
      loadManifest(link.href);
      return collectNodes();
    }

    var scripts = headNode.querySelectorAll('script[type="application/l20n"]');
    if (scripts.length) {
      for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].hasAttribute('src')) {
          ctx.linkResource(scripts[i].src);
        } else {
          ctx.addResource(scripts[i].textContent);
        }
      }
      ctx.requestLocales();
      return collectNodes();
    }

    console.error('L20n: No resources found. (Put them above l20n.js.)');
  }

  function loadManifest(url) {
    io.load(url, function(err, text) {
      var manifest = parseManifest(text, url);
      setupCtxFromManifest(manifest);
    });
  }

  function parseManifest(text, url) {
    var manifest = JSON.parse(text);
    manifest.resources = manifest.resources.map(
      relativeToManifest.bind(this, url));
    return manifest;
  }

  function setDocumentLanguage(loc) {
    document.documentElement.lang = loc;
    document.documentElement.dir =
      rtlLocales.indexOf(loc) === -1 ? 'ltr' : 'rtl';
  }

  function setupCtxFromManifest(manifest) {
    // register available locales
    ctx.registerLocales(manifest.default_locale, manifest.locales);
    ctx.registerLocaleNegotiator(function(available, requested, defLoc) {
      // lazy-require Intl
      var Intl = require('./intl').Intl;
      var fallbackChain = Intl.prioritizeLocales(available, requested, defLoc);
      setDocumentLanguage(fallbackChain[0]);
      return fallbackChain;
    });

    // add resources
    var re = /{{\s*locale\s*}}/;
    manifest.resources.forEach(function(uri) {
      if (re.test(uri)) {
        ctx.linkResource(uri.replace.bind(uri, re));
      } else {
        ctx.linkResource(uri);
      }
    });

    // For now we just take navigator.language, but we'd prefer to get a list 
    // of locales that the user can read sorted by user's preference, see:
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=889335
    // For IE we use navigator.browserLanguage, see:
    //   http://msdn.microsoft.com/en-us/library/ie/ms533542%28v=vs.85%29.aspx
    ctx.requestLocales(navigator.language || navigator.browserLanguage);

    return manifest;
  }

  function relativeToManifest(manifestUrl, url) {
    if (reAbsolute.test(url)) {
      return url;
    }
    var dirs = manifestUrl.split('/')
      .slice(0, -1)
      .concat(url.split('/'))
      .filter(function(elem) {
        return elem !== '.';
      });
    return dirs.join('/');
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
  }


  // DOM Localization
  // ==========================================================================

  function collectNodes() {
    var nodes = getNodes(document);
    localizeHandler = ctx.localize(nodes.ids, function localizeHandler(l10n) {
      if (!nodes) {
        nodes = getNodes(document);
      }
      for (var i = 0; i < nodes.nodes.length; i++) {
        translateNode(nodes.nodes[i],
                      nodes.ids[i],
                      l10n.entities[nodes.ids[i]]);
      }

      // 'locales' in l10n.reason means that localize has been
      // called because of locale change
      if ('locales' in l10n.reason && l10n.reason.locales.length) {
        setDocumentLanguage(l10n.reason.locales[0]);
      }

      nodes = null;
      if (!documentLocalized) {
        documentLocalized = true;
        fireLocalizedEvent();
      }
    });
  }

  function getNodes(node) {
    var nodes = node.querySelectorAll('[data-l10n-id]');
    var ids = [];
    if (node.hasAttribute && node.hasAttribute('data-l10n-id')) {
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

  function camelCaseToDashed(string) {
    return string
      .replace(/[A-Z]/g, function (match) {
        return '-' + match.toLowerCase();
      })
      .replace(/^-/, '');
  }

  function translateNode(node, id, entity) {
    if (!entity) {
      return;
    }
    if (entity.value) {
      // if there is no HTML in the translation nor no HTML entities are used, 
      // just replace the textContent
      if (entity.value.indexOf('<') === -1 &&
          entity.value.indexOf('&') === -1) {
        node.textContent = entity.value;
      } else {
        // otherwise, start with an inert template element and move its 
        // children into `node` but such that `node`'s own children are not 
        // replaced
        var translation = document.createElement('template');
        translation.innerHTML = entity.value;
        // overlay the node with the DocumentFragment
        overlayElement(node, translation.content);
      }
    }
    Object.keys(entity.attributes).forEach(function(key) {
      var attrName = camelCaseToDashed(key);
      if (isAttrAllowed({ name: attrName }, node)) {
        node.setAttribute(attrName, entity.attributes[key]);
      }
    });
  }

  // The goal of overlayElement is to move the children of `translationElement` 
  // into `sourceElement` such that `sourceElement`'s own children are not 
  // replaced, but onle have their text nodes and their attributes modified.
  //
  // We want to make it possible for localizers to apply text-level semantics to
  // the translations and make use of HTML entities.  At the same time, we 
  // don't trust translations so we need to filter unsafe elements and 
  // attribtues out and we don't want to break the Web by replacing elements to 
  // which third-party code might have created references (e.g. two-way 
  // bindings in MVC frameworks).
  function overlayElement(sourceElement, translationElement) {
    var result = document.createDocumentFragment();

    // take one node from translationElement at a time and check it against the 
    // whitelist or try to match it with a corresponding element in the source
    var childElement;
    while (childElement = translationElement.childNodes[0]) {
      translationElement.removeChild(childElement);

      if (childElement.nodeType === Node.TEXT_NODE) {
        result.appendChild(childElement);
        continue;
      }

      var sourceChild = getElementOfType(sourceElement, childElement);
      if (sourceChild) {
        // there is a corresponding element in the source, let's use it
        overlayElement(sourceChild, childElement);
        result.appendChild(sourceChild);
        continue;
      }

      if (isElementAllowed(childElement)) {
        result.appendChild(childElement);
        for (var k = 0, attr; attr = childElement.attributes[k]; k++) {
          if (!isAttrAllowed(attr, childElement)) {
            childElement.removeAttribute(attr.name);
          }
        }
        continue;
      }

      // otherwise just take this child's textContent
      var text = new Text(childElement.textContent);
      result.appendChild(text);
    }

    // clear `sourceElement` and append `result` which by this time contains 
    // `sourceElement`'s original children, overlayed with translation
    sourceElement.textContent = '';
    sourceElement.appendChild(result);

    // if we're overlaying a nested element, translate the whitelisted 
    // attributes; top-level attributes are handled in `translateNode`
    // XXX attributes previously set here for another language should be 
    // cleared if a new language doesn't use them; https://bugzil.la/922577
    if (translationElement.attributes) {
      for (var k = 0, attr; attr = translationElement.attributes[k]; k++) {
        if (isAttrAllowed(attr, sourceElement)) {
          sourceElement.setAttribute(attr.name, attr.value);
        }
      }
    }
  }

  // XXX the whitelist should be amendable; https://bugzil.la/922573
  function isElementAllowed(element) {
    return whitelist.elements.indexOf(element.tagName.toLowerCase()) !== -1;
  }

  function isAttrAllowed(attr, element) {
    var attrName = attr.name.toLowerCase();
    var tagName = element.tagName.toLowerCase();
    // is it a globally safe attribute?
    if (whitelist.attributes.global.indexOf(attrName) !== -1) {
      return true;
    }
    // are there no whitelisted attributes for this element?
    if (!whitelist.attributes[tagName]) {
      return false;
    }
    // is it allowed on this element?
    // XXX the whitelist should be amendable; https://bugzil.la/922573
    if (whitelist.attributes[tagName].indexOf(attrName) !== -1) {
      return true;
    }
    // special case for value on inputs with type button, reset, submit
    if (tagName === 'input' && attrName === 'value') {
      var type = element.type.toLowerCase();
      if (type === 'submit' || type === 'button' || type === 'reset') {
        return true;
      }
    }
    return false;
  }

  // ideally, we'd use querySelector(':scope > ELEMENT:nth-of-type(index)'),
  // but 1) :scope is not widely supported yet and 2) it doesn't work with 
  // DocumentFragments.  :scope is needed to query only immediate children
  // https://developer.mozilla.org/en-US/docs/Web/CSS/:scope
  function getElementOfType(context, element) {
    var index = getIndexOfType(element);
    var nthOfType = 0;
    for (var i = 0, child; child = context.children[i]; i++) {
      if (child.nodeType === Node.ELEMENT_NODE &&
          child.tagName === element.tagName) {
        if (nthOfType === index) {
          return child;
        }
        nthOfType++;
      }
    }
    return null;
  }

  function getIndexOfType(element) {
    var index = 0;
    var child;
    while (child = element.previousElementSibling) {
      if (child.tagName === element.tagName) {
        index++;
      }
    }
    return index;
  }

  // same as exports = L20n;
  return L20n;

});
