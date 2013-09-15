if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports) {
  'use strict';

  function RetranslationManager() {
    var _usage = [];
    var _counter = {};
    var _callbacks = [];

    this.bindGet = bindGet;
    this.unbindGet = unbindGet;
    this.all = all;
    this.globals = {};

    RetranslationManager._constructors.forEach(function(ctor) {
      initGlobal.call(this, ctor);
    }, this);

    function initGlobal(GlobalCtor) {
      /* jshint validthis: true */
      var global = new GlobalCtor();
      this.globals[global.id] = global;
      if (!global.activate) {
        return;
      }
      _counter[global.id] = 0;
      global.addEventListener('change', function(id) {
        for (var i = 0; i < _usage.length; i++) {
          if (_usage[i] && _usage[i].globals.indexOf(id) !== -1) {
            // invoke the callback with the reason
            _usage[i].callback({
              global: global.id
            });
          }
        }
      });
    }

    function bindGet(get, isRebind) {
      /* jshint validthis: true */
      var i;
      // store the callback in case we want to retranslate the whole context
      var inCallbacks;
      for (i = 0; i < _callbacks.length; i++) {
        if (_callbacks[i].id === get.id) {
          inCallbacks = true;
          break;
        }
      }
      if (!inCallbacks) {
        _callbacks.push(get);
      } else if (isRebind) {
        _callbacks[i] = get;
      }

      // handle the global usage
      var bound;
      for (i = 0; i < _usage.length; i++) {
        if (_usage[i] && _usage[i].id === get.id) {
          bound = _usage[i];
          break;
        }
      }

      var added;
      if (!bound) {
        // it's the first time we see this get
        if (get.globals.length !== 0) {
          _usage.push(get);
          get.globals.forEach(function(id) {
            if (!this.globals[id].activate) {
              return;
            }
            _counter[id]++;
            this.globals[id].activate();
          }, this);
        }
      } else if (isRebind) {
        // if we rebinding the callback, don't remove globals
        // because we're just adding new entities to the bind
        bound.callback = get.callback;
        added = get.globals.filter(function(id) {
          return this.globals[id].activate && bound.globals.indexOf(id) === -1;
        }, this);
        added.forEach(function(id) {
          _counter[id]++;
          this.globals[id].activate();
        }, this);
        bound.globals = bound.globals.concat(added);
      } else if (get.globals.length === 0) {
        // after a retranslation, no globals were used; remove the callback
        delete _usage[i];
      } else {
        // see which globals were added and which ones were removed
        added = get.globals.filter(function(id) {
          return this.globals[id].activate && bound.globals.indexOf(id) === -1;
        }, this);
        added.forEach(function(id) {
          _counter[id]++;
          this.globals[id].activate();
        }, this);
        var removed = bound.globals.filter(function(id) {
          return this.globals[id].activate && get.globals.indexOf(id) === -1;
        }, this);
        removed.forEach(function(id) {
          _counter[id]--;
          if (_counter[id] === 0) {
            this.globals[id].deactivate();
          }
        }, this);
        bound.globals = get.globals;
      }
    }

    function unbindGet(id) {
      /* jshint validthis: true */
      var bound;
      var usagePos = -1;
      for (var i = 0; i < _usage.length; i++) {
        if (_usage[i] && _usage[i].id === id) {
          bound = _usage[i];
          usagePos = i;
          break;
        }
      }
      if (bound) {
        bound.globals.forEach(function(id) {
          if (this.globals[id].activate) {
            _counter[id]--;
            if (_counter[id] === 0) {
              this.globals[id].deactivate();
            }
          }
        }, this);
        _usage.splice(usagePos, 1);
        for (i = 0; i < _callbacks.length; i++) {
          if (_callbacks[i].id === id) {
            _callbacks.splice(i, 1);
            break;
          }
        }
      }
    }

    function all(locales) {
      for (var i = 0; i < _callbacks.length; i++) {
        // invoke the callback with the reason
        _callbacks[i].callback({
          locales: locales
        });
      }
    }
  }

  RetranslationManager._constructors = [];

  RetranslationManager.registerGlobal = function(ctor) {
    RetranslationManager._constructors.push(ctor);
  };

  RetranslationManager.deregisterGlobal = function(ctor) {
    var pos = RetranslationManager._constructors.indexOf(ctor);
    if (pos !== -1) {
      RetranslationManager._constructors.splice(pos, 1);
    }
  };

  exports.RetranslationManager = RetranslationManager;

});
