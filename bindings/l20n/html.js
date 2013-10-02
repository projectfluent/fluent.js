define(function (require) {
  'use strict';

  var L20n = require('../l20n');
  var io = require('./platform/io');

  var localizeHandler;
  var ctx = L20n.getContext(document.location.host);

  // http://www.w3.org/International/questions/qa-scripts
  // XXX: bug 884308
  // each localization should decide which direction it wants to use
  var rtlLocales = ['ar', 'fa', 'he', 'ps', 'ur'];

  // absolute URLs start with a slash or contain a colon (for schema)
  var reAbsolute = /^\/|:/;

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

  var documentLocalized = false;

  bootstrap();

  function bootstrap() {
    var headNode = document.head;
    var data =
      headNode.querySelector('script[type="application/l10n-data+json"]');
    if (data) {
      ctx.updateData(JSON.parse(data.textContent));
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
    } else {
      var link = headNode.querySelector('link[rel="localization"]');
      if (link) {
        // XXX add errback
        loadManifest(link.href);
      } else {
        console.warn('L20n: No resources found. (Put them above l20n.js.)');
      }
    }

    if (document.readyState !== 'loading') {
      collectNodes();
    } else {
      document.addEventListener('readystatechange', collectNodes);
    }
    bindPublicAPI();
  }

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

    // TODO this might fail; silence the error
    document.removeEventListener('readystatechange', collectNodes);
  }

  function bindPublicAPI() {
    ctx.addEventListener('error', console.error.bind(console));
    ctx.addEventListener('warning', console.warn.bind(console));
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

  function loadManifest(url) {
    io.load(url, function manifestLoaded(err, text) {
      var manifest = JSON.parse(text);
      manifest.resources = manifest.resources.map(
                             relativeToManifest.bind(this, url));
      setupCtxFromManifest(manifest);
    });
  }

  function fireLocalizedEvent() {
    var event = document.createEvent('Event');
    event.initEvent('DocumentLocalized', false, false);
    document.dispatchEvent(event);
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

    var childElement;
    while (childElement = sourceElement.children[0]) {
      // for each child element, try to find a corresponding element in the 
      // translation and 1) move all nodes preceding it into `result` and 2) 
      // move the child element from `sourceElement` into `result` and modify 
      // its text nodes and attributes (see `insertUntil` for details);
      // the original child into `result` 
      // XXX sadly, this assumes a specific order of child elements in the 
      // transaltion; https://bugzil.la/922576
      insertUntil(childElement, translationElement, result);
    }

    // also handle the nodes in `translationElement` which are directly before 
    // the end of it
    insertUntil(null, translationElement, result);

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

  function insertUntil(sourceChild, translationElement, result) {
    var untilElement;
    if (sourceChild) {
      // try to find an element in the translation node corresponding to the 
      // sourceChild in the source
      untilElement = getElementOfType(translationElement, sourceChild,
                                      getIndexOfType(sourceChild));
    }
    var child;
    while (child = translationElement.childNodes[0]) {
      if (child === untilElement) {
        // we want to reuse the existing sourceChild instead of replacing it 
        // with the translation element
        overlayElement(sourceChild, translationElement.removeChild(child));
        result.insertBefore(sourceChild, null);
        // we've reached the untilElement, we're done
        return;
      } else if (!child.tagName) {
        // it's a text node
        result.insertBefore(translationElement.removeChild(child), null);
      } else {
        // XXX the whitelist should be amendable; https://bugzil.la/922573
        if (whitelist.elements.indexOf(child.tagName.toLowerCase()) !== -1) {
          // if it's one of the safe whitelisted elements
          result.insertBefore(translationElement.removeChild(child), null);
          for (var k = 0, attr; attr = child.attributes[k]; k++) {
            if (!isAttrAllowed(attr, child)) {
              child.removeAttribute(attr.name);
            }
          }
        } else {
          // otherwise just take this child's textContent
          translationElement.removeChild(child);
          var text = new Text(child.textContent);
          result.insertBefore(text, null);
        }
      }
    }
    // no more children in the translation, but untilElement hasn't been found;
    // remove the sourceChild from its parent;  the translation doesn't need 
    // it, or is broken
    if (sourceChild) {
      sourceChild.parentNode.removeChild(sourceChild);
    }
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

  // ideally, we'd use querySelector(':scope > ELEMENT:nth-of-type(index)'),
  // but 1) :scope is not widely supported yet and 2) it doesn't work with 
  // DocumentFragments.  :scope is needed to query only immediate children
  // https://developer.mozilla.org/en-US/docs/Web/CSS/:scope
  function getElementOfType(context, element, index) {
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

  // same as exports = L20n;
  return L20n;

});
