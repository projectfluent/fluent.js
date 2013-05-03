if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;

  function RetranslationManager() {
    var _usage = [];
    var _counter = {};
    var _callbacks = [];

    this.bindGet = bindGet;
    this.retranslate = retranslate;
    this.globals = {};

    for (var i in RetranslationManager._constructors) {
      initGlobal.call(this, RetranslationManager._constructors[i]);
    }

    function initGlobal(globalCtor) {
      var global = new globalCtor();
      this.globals[global.id] = global;
      _counter[global.id] = 0; 
      global.addEventListener('change', function(id) {
        for (var i = 0; i < _usage.length; i++) {
          if (_usage[i] && _usage[i].globals.indexOf(id) !== -1) {
            _usage[i].callback();
          }  
        }
      });
    };

    function bindGet(get) {
      // store the callback in case we want to retranslate the whole context
      var inCallbacks;
      for (var i = 0; i < _callbacks.length; i++) {
        if (_callbacks[i].id === get.id) {
          inCallbacks = true;
          break;
        }
      }
      if (!inCallbacks) {
        _callbacks.push(get);
      }

      // handle the global usage
      var inUsage = null;
      for (var usageInc = 0; usageInc < _usage.length; usageInc++) {
        if (_usage[usageInc] && _usage[usageInc].id === get.id) {
          inUsage = _usage[usageInc];
          break;
        }
      }
      if (!inUsage) {
        if (get.globals.length != 0) {
          _usage.push(get);
          get.globals.forEach(function(id) {
            _counter[id]++;
            this.globals[id].activate();
          }, this);
        }
      } else {
        if (get.globals.length == 0) {
          delete(_usage[usageInc]);
        } else {
          var added = get.globals.filter(function(id) {
            return inUsage.globals.indexOf(id) === -1;
          });
          added.forEach(function(id) {
            _counter[id]++;
            this.globals[id].activate();
          }, this);
          var removed = inUsage.globals.filter(function(id) {
            return get.globals.indexOf(id) === -1;
          });
          removed.forEach(function(id) {
            _counter[id]--;
            if (_counter[id] == 0) {
              this.globals[id].deactivate();
            }
          });
          inUsage.globals = get.globals;
        }
      }
    }

    function retranslate() {
      for (var i = 0; i < _callbacks.length; i++) {
        _callbacks[i].callback();
      }
    }
  }

  RetranslationManager._constructors = [];

  RetranslationManager.registerGlobal = function(ctor) {
    RetranslationManager._constructors.push(ctor);
  }

  exports.RetranslationManager = RetranslationManager;

});
