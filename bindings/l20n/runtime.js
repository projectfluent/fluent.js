'use strict';

/* global Env, io */
/* global translateFragment, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global PSEUDO_STRATEGIES */


// Public API
// XXX Rename to document.mozL10n

navigator.mozL10n = {
  env: null,
  ctx: null,
  observer: {
    _observer: null,
    start: function() {
      if (!this._observer) {
        this._observer =
          new MutationObserver(onMutations.bind(navigator.mozL10n));
      }
      return this._observer.observe(document, this.CONFIG);
    },
    stop: function() {
      return this._observer.disconnect();
    },
    CONFIG: {
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args']
    }
  },
  resources: [],
  rtlList: ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'],

  get: function get() {
    return 'xxx';
  },
  localize: function() {},
  translate: function() {},
  translateFragment: function(fragment) {
    return translateFragment.call(this, fragment);
  },
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,

  ready: function(callback) {
    return this.ctx.ready.then(callback);
  },
  once: function(callback) {
    return this.ctx.ready.then(callback);
  },

  request: function(langs) {
    this.ctx = this.env.require(langs, this.resources);
    return this.ctx.ready.then(translateDocument.bind(this));
  },

  readyState: 'complete',
  language: {},
  qps: PSEUDO_STRATEGIES
};

if (window.document) {
  init();
}

function init() {
  /* jshint boss:true */
  var nodes = document.head
                      .querySelectorAll('link[rel="localization"],' +
                                        'link[rel="manifest"]');
  for (var i = 0, node; node = nodes[i]; i++) {
    var type = node.getAttribute('rel') || node.nodeName.toLowerCase();
    switch (type) {
      case 'manifest':
        navigator.mozL10n.env = new Env(
          document.URL,
          io.loadJSON(node.getAttribute('href')));
        break;
      case 'localization':
        navigator.mozL10n.resources.push(node.getAttribute('href'));
        break;
    }
  }

  navigator.mozL10n.request(navigator.languages);
  navigator.mozL10n.observer.start();

  window.addEventListener('languagechange', function langchange() {
    navigator.mozL10n.request(navigator.languages);
  });
}

function translateDocument(supported) {
  document.documentElement.lang = supported[0];
  document.documentElement.dir = getDirection(supported[0]);
  return translateFragment.call(this, document.documentElement).then(
      fireLocalizedEvent.bind(this, supported));
}

function fireLocalizedEvent(supported) {
  // XXX rename to mozDOMLocalized
  var event = new CustomEvent('localized', {
    'bubbles': false,
      'cancelable': false,
      'detail': {
        'languages': supported
      }
  });
  window.dispatchEvent(event);
}

function getDirection(lang) {
  return (navigator.mozL10n.rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

function onMutations(mutations) {
  var mutation;

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    if (mutation.type === 'childList') {
      var addedNode;

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        addedNode = mutation.addedNodes[j];

        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (addedNode.childElementCount) {
          translateFragment.call(this, addedNode);
        } else if (addedNode.hasAttribute('data-l10n-id')) {
          translateElement.call(this, addedNode);
        }
      }
    }

    if (mutation.type === 'attributes') {
      translateElement.call(this, mutation.target);
    }
  }
}
