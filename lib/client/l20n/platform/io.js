'use strict';

/* jshint browser:true */
/* global L10nError, Promise */
/* exported io */

var io = {
  load: function(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();

      if (xhr.overrideMimeType) {
        xhr.overrideMimeType('text/plain');
      }

      xhr.open('GET', url, true);

      xhr.addEventListener('load', function io_load(e) {
        if (e.target.status === 200 || e.target.status === 0) {
          resolve(e.target.responseText);
        } else {
          reject(new L10nError(e.target.statusText));
        }
      });
      xhr.addEventListener('error', reject);
      xhr.addEventListener('timeout', reject);

      // the app: protocol throws on 404, see https://bugzil.la/827243
      try {
        xhr.send(null);
      } catch (e) {
        reject(new L10nError('Not found: ' + url));
      }
    });
  },

  loadJSON: function loadJSON(url ) {
    return io.load(url).then(JSON.parse);
  }
};
