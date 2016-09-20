/* jshint node:true */

import { readFile } from 'fs';

function load(url) {
  return new Promise((resolve, reject) => {
    readFile(url, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString());
      }
    });
  });
}

export function fetchResource(res, { code }) {
  const url = res.replace('{locale}', code);
  return load(url).catch(() => null);
}
