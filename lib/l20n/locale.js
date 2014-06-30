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
}

exports.Locale = Locale;
