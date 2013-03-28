self.addEventListener('message', function(msg) {
  self[msg.data.type](msg.data);
}, false);

var resources = {
  "http://browser.gaiamobile.org": ["pl", "de"],
  "http://calendar.gaiamobile.org": ["de", "fr"],
};

self.getLocales = function getLocales(req) {
  self.postMessage({
    type: 'getLocales',
    domain: req.domain,
    locales: resources[req.domain] || [],
  });
}

self.getResource = function getResource(req) {
  // XXX check req.id to get the right resource
  self.postMessage({
    type: 'getResources',
    domain: msg.domain,
    locale: msg.locale,
    resource: "<bar 'Bar'>"
  });
}
