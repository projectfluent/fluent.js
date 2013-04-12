(function() {
  'use strict';

  var IO = {
    load: function load(url, async) {
      if (async) {
        return this.loadAsync(url);
      }
      return this.loadSync(url);
    },
    loadAsync: function(url) {
      var deferred = new L20n.Promise();
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
      xhr.open('GET', url, true);
      xhr.send('');
      return deferred;
    },

    loadSync: function(url) {
      var deferred = new L20n.Promise();
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.open('GET', url, false);
      xhr.send('');
      if (xhr.status == 200) {
        return xhr.responseText;
      } else {
        // XXX should this fail more horribly?
        return '';
      }
    },
  }

  this.L20n.IO = IO;

}).call(this);
