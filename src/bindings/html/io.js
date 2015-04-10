'use strict';

/* jshint browser:true */
/* global L10nError */
/* exported io */

var io = {

  _load: function(type, url, callback, sync) {
    var xhr = new XMLHttpRequest();
    var needParse;

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType(type);
    }

    xhr.open('GET', url, !sync);

    if (type === 'application/json') {
      //  Gecko 11.0+ forbids the use of the responseType attribute when
      //  performing sync requests (NS_ERROR_DOM_INVALID_ACCESS_ERR).
      //  We'll need to JSON.parse manually.
      if (sync) {
        needParse = true;
      } else {
        xhr.responseType = 'json';
      }
    }

    xhr.addEventListener('load', function io_onload(e) {
      if (e.target.status === 200 || e.target.status === 0) {
        // Sinon.JS's FakeXHR doesn't have the response property
        var res = e.target.response || e.target.responseText;
        callback(null, needParse ? JSON.parse(res) : res);
      } else {
        callback(new L10nError('Not found: ' + url));
      }
    });
    xhr.addEventListener('error', callback);
    xhr.addEventListener('timeout', callback);

    // the app: protocol throws on 404, see https://bugzil.la/827243
    try {
      xhr.send(null);
    } catch (e) {
      if (e.name === 'NS_ERROR_FILE_NOT_FOUND') {
        // the app: protocol throws on 404, see https://bugzil.la/827243
        callback(new L10nError('Not found: ' + url));
      } else {
        throw e;
      }
    }
  },

  load: function(url, callback, sync) {
    return io._load('text/plain', url, callback, sync);
  },

  loadJSON: function(url, callback, sync) {
    return io._load('application/json', url, callback, sync);
  }

};
