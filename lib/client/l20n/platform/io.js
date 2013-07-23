define(function (require, exports, module) {
  'use strict';

  var Promise = require('../promise').Promise;

  exports.loadAsync = function loadAsync(url) {
    var deferred = new Promise();
    var xhr = new XMLHttpRequest();
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.addEventListener('load', function() {
      if (xhr.status == 200 || xhr.status == 0) {
        deferred.fulfill(xhr.responseText);
      } else {
        var ex = new IOError('Not found: ' + url);
        deferred.reject(ex);
      }
    });
    xhr.addEventListener('abort', function(e) {
      return deferred.reject(e);
    });
    xhr.open('GET', url, true);
    xhr.send('');
    return deferred;
  };

  exports.loadSync = function loadSync(url) {
    var xhr = new XMLHttpRequest();
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.open('GET', url, false);
    xhr.send('');
    if (xhr.status == 200 || xhr.status == 0) {
      return xhr.responseText;
    } else {
      throw new IOError('Not found: ' + url);
    }
  };

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;

  exports.Error = IOError;

});
