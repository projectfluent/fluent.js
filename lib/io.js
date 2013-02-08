(function() {
  'use strict';

  this.IO = {
    loadAsync: function(url) {
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
        return when.reject(e);
      });
      xhr.open('GET', url, true);
      xhr.send('');
      return deferred.promise;
    },

    loadSync: function(url) {
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.open('GET', url, false);
      xhr.send('');
      if (xhr.status == 200) {
        return xhr.responseText;
      } else {
        return false;
      }
    }
  }

}).call(L20n);
