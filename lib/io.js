(function() {
  'use strict';

  this.IO = {
    load: function(url, async) {
      var deferred = when.defer();
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
  }

}).call(L20n);
