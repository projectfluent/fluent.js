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

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          callback(null, xhr.responseText);
        } else {
          callback(new Error('Not found: ' + url));
        }
      }
    };

    xhr.onerror = callback;
    xhr.ontimeout = callback;

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
    xhr.onload = function(e) {
      callback(null, e.target.response);
    };
    xhr.onerror = callback;
    xhr.ontimeout = callback;

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      callback(new Error('Not found: ' + url));
    }
  }
};
