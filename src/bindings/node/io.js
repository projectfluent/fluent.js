'use strict';

var fs = require('fs');
var L10nError = require('../../lib/errors').L10nError;

exports.load = function(url) {
  return new Promise(function(resolve, reject) {
    fs.readFile(url, function(err, data) {
      if (err) {
        reject(new L10nError(err.message));
      } else {
        resolve(data.toString());
      }
    });
  });
};

exports.loadJSON = function loadJSON(url) {
  return exports.load(url).then(JSON.parse);
};
