define(function (require, exports, module) {
  'use strict';

  exports.load = function load(url, callback, sync) {
    var xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }

    xhr.addEventListener('load', function l10nXHRLoad() {
      callback(null, xhr.responseText);
    });

    xhr.addEventListener('error', function l10nXHRError() {
      var ex = new IOError('Not found: ' + url);
      callback(ex);
    });

    xhr.open('GET', url, !sync);
    xhr.send('');
  };

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;

  exports.Error = IOError;

});
