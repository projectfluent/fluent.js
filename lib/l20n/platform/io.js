'use strict';

var fs = require('fs');
var Promise = require('rsvp').Promise;

var L10nError = require('../errors').L10nError;

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

exports.loadJSON = function(url) {
  return exports.load(url).then(JSON.parse);
};
