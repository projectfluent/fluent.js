if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports) {
  'use strict';

  var fs = require('fs');

  exports.load = function load(url, callback, sync) {
    if (sync) {
      return loadSync(url, callback);
    }
    fs.readFile(url, function(err, data) {
      if (err) {
        var ex = new IOError(err.message);
        callback(ex);
      } else {
        callback(null, data.toString());
      }
    });
  };

  function loadSync(url, callback) {
    var data;
    try {
      data = fs.readFileSync(url);
    } catch (e) {
      callback(new IOError(e.message), null);
    }
    callback(null, data.toString());
  }

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;

  exports.Error = IOError;

});
