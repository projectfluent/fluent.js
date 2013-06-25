if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var fs = require('fs');
  var Promise = require('../promise').Promise;

  exports.loadAsync = function loadAsync(url) {
    var deferred = new Promise();
    fs.readFile(url, function(err, data) {
      if (err) {
        var ex = new IOError(err.message);
        deferred.reject(ex);
      } else {
        deferred.fulfill(data.toString());
      }
    });
    return deferred;
  };

  exports.loadSync = function loadSync(url) {
    try {
      var data = fs.readFileSync(url);
    } catch (e) {
      throw new IOError(e.message);
    }
    return data.toString();
  };

  function IOError(message) {
    this.name = 'IOError';
    this.message = message;
  }
  IOError.prototype = Object.create(Error.prototype);
  IOError.prototype.constructor = IOError;

  exports.Error = IOError;

});
