define(function (require, exports, module) {
  'use strict';

  exports.load = function load(url, callback, sync) {
    if (sync) {
      return loadSync(url, callback);
    }
    var xhr = new XMLHttpRequest();
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.addEventListener('load', function() {
      if (xhr.status == 200 || xhr.status == 0) {
        callback(null, xhr.responseText);
      } else {
        var ex = new IOError('Not found: ' + url);
        callback(ex);
      }
    });
    xhr.addEventListener('abort', function(e) {
      callback(e);
    });
    xhr.open('GET', url, true);
    xhr.send('');
  };

  function loadSync(url, callback) {
    var xhr = new XMLHttpRequest();
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.open('GET', url, false);
    xhr.send('');
    if (xhr.status == 200 || xhr.status == 0) {
      callback(null, xhr.responseText);
    } else {
      callback(new IOError('Not found: ' + url));
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
