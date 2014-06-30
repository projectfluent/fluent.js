'use strict';

var Entity = require('./compiler').Entity;

function Locale(id, ctx) {
  this.id = id;
  this.ctx = ctx;
  this.isReady = false;
  this.entries = Object.create(null);

  this.getEntry = function(id) {
    for (var url in this.entries) {
      var entry = this.entries[url][id];
      if (entry) {
        if (entry instanceof Entity) {
          return entry;
        }

        return this.entries[url][id] = new Entity(id, this.entries[url][id], this.entries);
      }
    }

    return undefined;
  }

  this.addResource = function(url, callback) {
    this.ctx.env.getResource(url, this.id, function() {
      this.entries[url] = this.ctx.env.resources[url][this.id];
      callback();
    }.bind(this));
  }

  this.getEntity = function(id, ctxdata) {
    var entry = this.getEntry(id);

    if (!entry) {
      return null;
    }
    return entry.valueOf(ctxdata);
  }

  this.build = function(callback) {
    var resToLoad = this.ctx.resLinks.length;

    if (resToLoad === 0) {
      callback();
      return;
    }
    function onResLoaded() {
      resToLoad--;
      if (resToLoad === 0) {
        callback();
        return;
      }
    }

    for (var i = 0; i < this.ctx.resLinks.length; i++) {
      var url = this.ctx.resLinks[i];
      this.ctx.env.getResource(url, this.id, function() {
        this.entries[url] = this.ctx.env.resources[url][this.id];
        onResLoaded();
      }.bind(this));
    }
  }
}

exports.Locale = Locale;
