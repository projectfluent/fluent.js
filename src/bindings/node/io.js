'use strict';

import fs from 'fs';
import { L10nError } from '../../lib/errors';

function load(url) {
  return new Promise(function(resolve, reject) {
    fs.readFile(url, function(err, data) {
      if (err) {
        reject(new L10nError(err.message));
      } else {
        resolve(data.toString());
      }
    });
  });
}

function loadJSON(url) {
  return load(url).then(JSON.parse);
}

export default { load, loadJSON };
