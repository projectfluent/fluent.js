'use strict';

/* global Env, io */
/* global translateFragment, translateElement */
/* global setL10nAttributes, getL10nAttributes */
/* global PSEUDO_STRATEGIES */

// Public API

navigator.mozL10n = {
  get env() {
    return env;
  },
  get ctx() {
    return ctx;
  },

  get: function get() {
    return 'xxx';
  },
  localize: function() {},
  translate: function() {},
  translateFragment: function(fragment) {
    return translateFragment.call(ctx, nodeObserver, fragment);
  },
  setAttributes: setL10nAttributes,
  getAttributes: getL10nAttributes,

  ready: function(callback) {
    return ctx.ready.then(callback);
  },
  once: function(callback) {
    return ctx.ready.then(callback);
  },

  request: function(langs) {
    ctx = env.require(langs, resLinks);
    ctx.ready.then(translateDocument.bind(ctx));
  },

  readyState: 'complete',
  language: {},
  qps: PSEUDO_STRATEGIES
};


var resLinks = [];
var env;
var ctx;

var nodeObserver = null;
var moConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

var rtlList = ['ar', 'he', 'fa', 'ps', 'qps-plocm', 'ur'];
function getDirection(lang) {
  return (rtlList.indexOf(lang) >= 0) ? 'rtl' : 'ltr';
}

var readyStates = {
  'loading': 0,
  'interactive': 1,
  'complete': 2
};

function waitFor(state, callback) {
  state = readyStates[state];
  if (readyStates[document.readyState] >= state) {
    callback();
    return;
  }

  document.addEventListener('readystatechange', function l10n_onrsc() {
    if (readyStates[document.readyState] >= state) {
      document.removeEventListener('readystatechange', l10n_onrsc);
      callback();
    }
  });
}

if (window.document) {
  waitFor('interactive', init);
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
        env = new Env(
          document.URL,
          io.loadJSON(node.getAttribute('href')));
        break;
      case 'localization':
        resLinks.push(node.getAttribute('href'));
        break;
    }
  }

  navigator.mozL10n.request(navigator.languages);

  nodeObserver = new MutationObserver(onMutations);
  nodeObserver.observe(document, moConfig);


  window.addEventListener('languagechange', function langchange() {
    navigator.mozL10n.request(navigator.languages);
  });
}

function translateDocument(supported) {
  document.documentElement.lang = supported[0];
  document.documentElement.dir = getDirection(supported[0]);
  translateFragment.call(this, nodeObserver, document.documentElement);
}

function onMutations(mutations, self) {
  var mutation;

  for (var i = 0; i < mutations.length; i++) {
    mutation = mutations[i];
    console.log(mutation);
    if (mutation.type === 'childList') {
      var addedNode;

      for (var j = 0; j < mutation.addedNodes.length; j++) {
        addedNode = mutation.addedNodes[j];

        if (addedNode.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (addedNode.childElementCount) {
          translateFragment.call(ctx, self, addedNode);
        } else if (addedNode.hasAttribute('data-l10n-id')) {
          translateElement.call(ctx, self, addedNode);
        }
      }
    }

    if (mutation.type === 'attributes') {
      translateElement.call(ctx, self, mutation.target);
    }
  }
}


