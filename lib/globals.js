(function(){
  'use strict';

function GlobalsManager() {
  var _entries = {};
  var _usage = [];
  var _counter = {};

  this.registerGlobal = registerGlobal;
  this.bindGet = bindGet;
  this.globals = _entries;

  for (var i in GlobalsManager._constructors) {
    registerGlobal(GlobalsManager._constructors[i]);
  }

  function registerGlobal(globalCtor) {
    var global = new globalCtor();
    _entries[global.id] = global;
    _counter[global.id] = 0; 
    global.addEventListener('change', function(id) {
      for (var i = 0; i < _usage.length; i++) {
        if (_usage[i].globals.indexOf(id) !== -1) {
          _usage[i].callback();
        }  
      }
    });
  };

  function bindGet(get) {
    var inUsage = null;
    for (var usageInc = 0; usageInc < _usage.length; usageInc++) {
      if (_usage[usageInc].id === get.id) {
        inUsage = _usage[usageInc];
        break;
      }
    }
    if (!inUsage) {
      if (get.globals.length != 0) {
        _usage.push(get);
        get.globals.forEach(function(id) {
          _counter[id]++;
          _entries[id].activate();
        });
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
          _entries[id].activate();
        });
        var removed = inUsage.globals.filter(function(id) {
          return get.globals.indexOf(id) === -1;
        });
        removed.forEach(function(id) {
          _counter[id]--;
          if (_counter[id] == 0) {
            _entries[id].deactivate();
          }
        });
        inUsage.globals = get.globals;
      }
    }
  }
}

GlobalsManager._constructors = [];

GlobalsManager.registerGlobal = function(ctor) {
  GlobalsManager._constructors.push(ctor);
}

function Global() {
  this.id = null;
  this._emitter = new L20n.EventEmitter();
}

Global.prototype.addEventListener = function(type, listener) {
  if (type !== 'change') {
    throw "Unknown event type";
  }
  this._emitter.addEventListener(type, listener);
}

Global.prototype.activate = function() {}
Global.prototype.deactivate = function() {}

GlobalsManager.Global = Global;

L20n.GlobalsManager = GlobalsManager;



// XXX: Warning, we're cheating here for now. We want to have @screen.width,
// but since we can't get it from compiler, we call it @screen and in order to
// keep API forward-compatible with 1.0 we return an object with key width to
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

GlobalsManager.registerGlobal(ScreenGlobal);
GlobalsManager.registerGlobal(OSGlobal);
GlobalsManager.registerGlobal(HourGlobal);

}).call(this);
