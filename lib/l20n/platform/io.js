'use strict';

var fs = require('fs');
var L10nError = require('../errors').L10nError;

exports.load = function load(url, callback, sync) {
  if (sync) {
    return loadSync(url, callback);
  }
  fs.readFile(url, function(err, data) {
    if (err) {
      var ex = new L10nError(err.message);
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
    callback(new L10nError(e.message), null);
  }
  callback(null, data.toString());
}
