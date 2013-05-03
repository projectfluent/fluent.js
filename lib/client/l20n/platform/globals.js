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


  // XXX: https://bugzilla.mozilla.org/show_bug.cgi?id=865226
  // We want to have @screen.width, but since we can't get it from compiler, we 
  // call it @screen and in order to keep API forward-compatible with 1.0 we 
  // return an object with key width to
  // make it callable as @screen.width
  function ScreenGlobal() {
    Global.call(this);
    this.id = 'screen';
    this.get = get;
    this.activate = activate;
    this.isActive = false;

    var value = null;
    var self = this;

    function get() {
      if (!value) {
        value = document.body.clientWidth;
      }
      return {'width': value};
    }

    function activate() {
      if (!this.isActive) {
        window.addEventListener('resize', onchange);
        this.isActive = true;
      }
    }

    function deactivate() {
      window.removeEventListener('resize', onchange);
    }

    function onchange() {
      value = document.body.clientWidth;
      self._emitter.emit('change', self.id);
    }
  }

  ScreenGlobal.prototype = Object.create(Global.prototype);
  ScreenGlobal.prototype.constructor = ScreenGlobal;


  function OSGlobal() {
    Global.call(this);
    this.id = 'os';
    this.get = get;

    function get() {
      if (/^MacIntel/.test(navigator.platform)) {
        return 'mac';
      }
      if (/^Linux/.test(navigator.platform)) {
        return 'linux';
      }
      if (/^Win/.test(navigatgor.platform)) {
        return 'win';
      }
      return 'unknown';
    }

  }

  OSGlobal.prototype = Object.create(Global.prototype);
  OSGlobal.prototype.constructor = OSGlobal;

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

  RetranslationManager.registerGlobal(ScreenGlobal);
  RetranslationManager.registerGlobal(OSGlobal);
  RetranslationManager.registerGlobal(HourGlobal);

  exports.Global = Global;

});
