'use strict';

const fs = require('fs');
require('intl-pluralrules');

exports.readfile = function readfile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, function(err, file) {
      return err ? reject(err) : resolve(file.toString());
    });
  });
};
