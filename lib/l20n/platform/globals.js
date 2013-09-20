if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports) {
  'use strict';

  var EventEmitter = require('../events').EventEmitter;
  var RetranslationManager = require('../retranslation').RetranslationManager;

  function Global() {
    this.id = null;
    this._emitter = new EventEmitter();
    this.value = null;
    this.isActive = false;
  }

  Global.prototype._get = function _get() {
    throw new Error('Not implemented');
  };

  Global.prototype.get = function get() {
    // invalidate the cached value if the global is not active;  active 
    // globals handle `value` automatically in `onchange()`
    if (!this.value || !this.isActive) {
      this.value = this._get();
    }
    return this.value;
  };

  Global.prototype.addEventListener = function(type, listener) {
    if (type !== 'change') {
      throw 'Unknown event type';
    }
    this._emitter.addEventListener(type, listener);
  };


  function HourGlobal() {
    Global.call(this);
    this.id = 'hour';
    this._get = _get;

    this.activate = function activate() {
      if (!this.isActive) {
        var time = new Date();
        I = setTimeout(function() {
          onchange();
          I = setInterval(onchange, interval);
        }, interval - (time.getTime() % interval));
        this.isActive = true;
      }
    };

    this.deactivate = function deactivate() {
      clearInterval(I);
      this.value = null;
      this.isActive = false;
    };

    var self = this;
    var interval = 60 * 60 * 1000;
    var I = null;

    function _get() {
      var time = new Date();
      return time.getHours();
    }

    function onchange() {
      var time = new Date();
      if (time.getHours() !== self.value) {
        self.value = time.getHours();
        self._emitter.emit('change', self.id);
      }
    }
  }

  HourGlobal.prototype = Object.create(Global.prototype);
  HourGlobal.prototype.constructor = HourGlobal;

  RetranslationManager.registerGlobal(HourGlobal);

  exports.Global = Global;

});
