  /* jshint browser:true */
  /* exported io */

  'use strict';

  var io = {
    load: function load(url, callback, sync) {
      var xhr = new XMLHttpRequest();

      if (xhr.overrideMimeType) {
        xhr.overrideMimeType('text/plain');
      }

      xhr.open('GET', url, !sync);

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) {
            callback(null, xhr.responseText);
          } else {
            var ex = new IOError('Not found: ' + url);
            callback(ex);
          }
        }
      };

      xhr.onerror = callback;
      xhr.ontimeout = callback;

      // the app: protocol throws on 404, see https://bugzil.la/827243
      try {
        xhr.send(null);
      } catch (e) {
        callback(e);
      }
    },

    loadJSON: function loadJSON(url, callback) {
      var xhr = new XMLHttpRequest();

      if (xhr.overrideMimeType) {
        xhr.overrideMimeType('application/json');
      }

      xhr.open('GET', url);

      xhr.responseType = 'json';
      xhr.onload = function(e) {
        callback(null, e.target.response);
      };
      xhr.onerror = callback;
      xhr.ontimeout = callback;

      // the app: protocol throws on 404, see https://bugzil.la/827243
      try {
        xhr.send(null);
      } catch (e) {
        callback(e);
      }
    }
  };

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;
