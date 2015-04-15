'use strict';

import { L10nError } from '../../lib/errors';

function _load(type, url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType(type);
    }

    xhr.open('GET', url, true);

    if (type === 'application/json') {
      xhr.responseType = 'json';
    }

    xhr.addEventListener('load', function io_onload(e) {
      if (e.target.status === 200 || e.target.status === 0) {
        // Sinon.JS's FakeXHR doesn't have the response property
        resolve(e.target.response || e.target.responseText);
      } else {
        reject(new L10nError('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', reject);
    xhr.addEventListener('timeout', reject);

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_NOT_FOUND') {
        // the app: protocol throws on 404, see https://bugzil.la/827243
        reject(new L10nError('Not found: ' + url));
      } else {
        throw e;
      }
    }
  });
}

export default {
  load: function(url) {
    return _load('text/plain', url);
  },
  loadJSON: function(url) {
    return _load('application/json', url);
  }
};

