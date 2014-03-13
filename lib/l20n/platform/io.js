  'use strict';

  var fs = require('fs');

  exports.load = function load(url, callback, sync) {
    if (sync) {
      return loadSync(url, callback);
    }
    fs.readFile(url, function(err, data) {
      if (err) {
        var ex = new Error(err.message);
        callback(ex);
      } else {
        callback(null, data.toString());
      }
    });
  };

  function loadSync(url, callback) {
    try {
      var data = fs.readFileSync(url);
    } catch (e) {
      callback(new Error(e.message), null);
    }
    callback(null, data.toString());
  };

