if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var Promise = require('../../promise').Promise;

  var IO = {
    load: function load(url, async) {
      if (async) {
        return this.loadAsync(url);
      }
      return this.loadSync(url);
    },
    loadAsync: function(url) {
      var deferred = new Promise();
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

  exports.IO = IO;

});
