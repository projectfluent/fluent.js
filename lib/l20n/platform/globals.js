if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('../events').EventEmitter;
  var RetranslationManager = require('../retranslation').RetranslationManager;

  function Global() {
    this.id = null;
    this._emitter = new EventEmitter();
  }

  Global.prototype.addEventListener = function(type, listener) {
    if (type !== 'change') {
      throw "Unknown event type";
    }
    this._emitter.addEventListener(type, listener);
  }


  function HourGlobal() {
    Global.call(this);
    this.id = 'hour';
    this.get = get;
    this.activate = activate;
    this.deactivate = deactivate;
    this.isActive = false;

    var self = this;
    var value = null;
    var interval = 60 * 60 * 1000;
    var I = null;

    function get() {
      if (!value) {
        var time = new Date();
        value = time.getHours();
      }
      return value;
    }

    function onchange() {
      var time = new Date();
      if (time.getHours() !== value) {
        value = time.getHours();
        self._emitter.emit('change', self.id);
      }
    }

    function activate() {
      if (!this.isActive) {
        var time = new Date();
        I = setTimeout(function() {
          onchange();
          I = setInterval(onchange, interval);
        }, interval - (time.getTime() % interval));
        this.isActive = true;
      }
    }

    function deactivate() {
      value = null;
      clearInterval(I);
      this.isActive = false;
    }

  }

  HourGlobal.prototype = Object.create(Global.prototype);
  HourGlobal.prototype.constructor = HourGlobal;

  RetranslationManager.registerGlobal(HourGlobal);

  exports.Global = Global;

});
