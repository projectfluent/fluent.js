'use strict';

/* jshint browser:true */
/* exported io */

var io = {
  load: function load(url, callback, sync) {
    var xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }

    xhr.open('GET', url, !sync);

    xhr.addEventListener('load', function io_load(e) {
      if (e.target.status === 200 || e.target.status === 0) {
        callback(null, e.target.responseText);
      } else {
        callback(new Error('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', callback);
    xhr.addEventListener('timeout', callback);

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      callback(new Error('Not found: ' + url));
    }
  },

  loadJSON: function loadJSON(url, callback) {
    var xhr = new XMLHttpRequest();

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('application/json');
    }

    xhr.open('GET', url);

    xhr.responseType = 'json';
    xhr.addEventListener('load', function io_loadjson(e) {
      if (e.target.status === 200 || e.target.status === 0) {
        callback(null, e.target.response);
      } else {
        callback(new Error('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', callback);
    xhr.addEventListener('timeout', callback);

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      callback(new Error('Not found: ' + url));
    }
  }
};
