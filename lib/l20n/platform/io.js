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

exports.loadJSON = function loadJSON(url, callback) {
  exports.load(url, function(err, data) {
    callback(err, JSON.parse(data));
  }, false);
};

function loadSync(url, callback) {
  var data;
  try {
    data = fs.readFileSync(url);
  } catch (e) {
    callback(new Error(e.message), null);
  }
  callback(null, data.toString());
}
