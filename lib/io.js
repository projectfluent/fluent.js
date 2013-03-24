(function() {
  'use strict';

  var _bound = {};

  this.IO = {
    load: function load(url, async) {
      var deferred = when.defer();
      if (_bound[url] !== undefined) {
        deferred.resolve(_bound[url]);
        return deferred.promise;
      }
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener('load', function() {
        if (xhr.status == 200) {
          deferred.resolve(xhr.responseText);
        } else {
          deferred.reject();
        }
      });
      xhr.addEventListener('abort', function(e) {
        return deferred.reject(e);
      });
      xhr.open('GET', url, async);
      xhr.send('');
      return deferred.promise;
    },
    bind: function bind(url, text) {
      _bound[url] = text;
    }
  }

}).call(L20n);
