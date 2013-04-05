(function() {
  'use strict';

  var _bound = {};

  var IO = {
    load: function load(url, async) {
      var deferred = new L20n.Promise();
      if (_bound[url] !== undefined) {
        deferred.fulfill(_bound[url]);
        return deferred;
      }
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener('load', function() {
        if (xhr.status == 200) {
          deferred.fulfill(xhr.responseText);
        } else {
          deferred.reject();
        }
      });
      xhr.addEventListener('abort', function(e) {
        return deferred.reject(e);
      });
      xhr.open('GET', url, async);
      xhr.send('');
      return deferred;
    },
    bind: function bind(url, text) {
      _bound[url] = text;
    }
  }

  this.L20n.IO = IO;

}).call(this);
