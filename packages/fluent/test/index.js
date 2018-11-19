'use strict';

const fs = require('fs');
require('../../fluent-intl-polyfill/src');

exports.readfile = function readfile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, function(err, file) {
      return err ? reject(err) : resolve(file.toString());
    });
  });
};

exports.toObject = function toObject(map) {
  let obj = {};
  for (let [k, v] of map.entries()) {
    obj[k] = v;
  }
  return obj;
};
