if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}
define(function (require, exports, module) {
  'use strict';

  var EventEmitter = require('./events').EventEmitter;
  var Parser = require('./parser').Parser;
  var Compiler = require('./compiler').Compiler;
  var Promise = require('./promise').Promise;
  var RetranslationManager = require('./retranslation').RetranslationManager;

  // register globals with RetranslationManager
  require('./platform/globals');
  var io = require('./platform/io');

  function Resource(id, parser) {
    var self = this;

    this.id = id;
    this.resources = [];
    this.source = null;
    this.isReady = false;
    this.ast = {
      type: 'LOL',
      body: []
    };

    this.build = build;

    var _imports_positions = [];

    function build(nesting, async) {
      if (nesting >= 7) {
        throw new ContextError('Too many nested imports.');
      }
      if (!async) {
        fetch(async);
        parse();
        buildImports(nesting + 1, async);
        flatten();
        return;
      }
      return fetch(async)
        .then(parse)
        .then(buildImports.bind(this, nesting + 1, async))
        .then(flatten);
    }

    function fetch(async) {
      if (!async) {
        if (self.source) {
          return self.source;
        }
        try {
          return self.source = io.loadSync(self.id);
        } catch (e) {
          if (e instanceof io.Error) {
            return self.source = '';
          } else {
            throw e;
          }
        }
      }
      if (self.source) {
        var source = new Promise();
        source.fulfill();
        return source;
      }
      return io.loadAsync(self.id).then(function load_success(text) {
        self.source = text;
      });
    }

    function parse() {
      self.ast = parser.parse(self.source);
    }

    function buildImports(nesting, async) {
      var imports = self.ast.body.filter(function(elem, i) {
        if (elem.type == 'ImportStatement') {
          _imports_positions.push(i);
          return true;
        }
        return false;
      });

      imports.forEach(function(imp) {
        var uri = relativeToSelf(imp.uri.content);
        var res = new Resource(uri, parser);
        self.resources.push(res);
      });

      var imports_built = [];
      self.resources.forEach(function(res) {
        imports_built.push(res.build(nesting, async));
      });

      if (async) {
        return Promise.all(imports_built);
      }
    }

    function flatten() {
      for (var i = self.resources.length - 1; i >= 0; i--) {
        var pos = _imports_positions[i] || 0;
        Array.prototype.splice.apply(self.ast.body,
          [pos, 1].concat(self.resources[i].ast.body));
      }
      self.isReady = true;
    }

    function relativeToSelf(url) {
      if (self.id === null || url[0] == '/') {
        return url;
      } 
      var dirname = self.id.split('/').slice(0, -1).join('/');
      if (dirname) {
        // strip the trailing slash if present
        if (dirname[dirname.length - 1] == '/') {
          dirname = dirname.slice(0, dirname.length - 1);
        }
        return dirname + '/' + url;
      } else {
        return './' + url;
      }
    }

  }

  function Locale(id, parser, compiler) {
    this.id = id;
    this.resources = [];
    this.entries = null;
    this.ast = {
      type: 'LOL',
      body: []
    };
    this.isReady = false;

    this.build = build;
    this.getEntry = getEntry;
    this.hasResource = hasResource;

    var self = this;

    function build(async) {
      if (!async) {
        buildResources(async);
        flatten();
        compile();
        return this;
      }
      return buildResources(async)
        .then(flatten)
        .then(compile);
    }

    function buildResources(async) {
      var resources_built = [];
      self.resources.forEach(function(res) {
        resources_built.push(res.build(0, async));
      });
      if (async) {
        return Promise.all(resources_built);
      }
    }

    function flatten() {
      self.ast.body = self.resources.reduce(function(prev, curr) {
        return prev.concat(curr.ast.body);
      }, self.ast.body);
    }

    function compile() {
      self.entries = compiler.compile(self.ast);
      self.isReady = true;
    }

    function getEntry(id) { 
      if (this.entries.hasOwnProperty(id)) {
        return this.entries[id];
      }
      return undefined;
    }

    function hasResource(uri) { 
      return this.resources.some(function(res) {
        return res.id === uri;
      });
    }
  }

  function Context(id) {

    this.id = id;

    this.registerLocales = registerLocales;
    this.registerLocaleNegotiator = registerLocaleNegotiator;
    this.requestLocales = requestLocales;
    this.addResource = addResource;
    this.linkResource = linkResource;
    this.updateData = updateData;

    this.get = get;
    this.getEntity = getEntity;
    this.localize = localize;
    this.ready = ready;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    Object.defineProperty(this, 'supportedLocales', {
      get: function() { return _fallbackChain.slice(); },
      enumerable: true
    });

    var _data = {};

    // language negotiator function
    var _negotiator;

    // registered and available languages
    var _default = 'i-default';
    var _registered = [_default];
    var _requested = [];
    var _fallbackChain = [];
    // Locale objects corresponding to the registered languages
    var _locales = {};

    // URLs or text of resources (with information about the type) added via 
    // linkResource and addResource
    var _reslinks = [];

    var _isReady = false;
    var _isFrozen = false;
    var _emitter = new EventEmitter();
    var _parser = new Parser();
    var _compiler = new Compiler();

    var _retr = new RetranslationManager();

    var _listeners = [];
    var self = this;

    _parser.addEventListener('error', echo.bind(null, 'error'));
    _compiler.addEventListener('error', echo.bind(null, 'error'));
    _compiler.setGlobals(_retr.globals);

    function extend(dst, src) {
      for (var i in src) {
        if (src[i] === undefined) {
          // un-define (remove) the property from dst
          delete dst[i];
        } else if (typeof src[i] !== 'object') {
          // if the source property is a primitive, just copy it overwriting 
          // whatever the destination property is
          dst[i] = src[i];
        } else {
          // if the source property is an object, deep-copy it recursively
          if (typeof dst[i] !== 'object') {
            dst[i] = {};
          }
          extend(dst[i], src[i]);
        }
      }
    }

    function updateData(obj) {
      if (!obj || typeof obj !== 'object') {
        throw new ContextError('Context data must be a non-null object');
      }
      extend(_data, obj);
    }

    function get(id, data) {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      return getFromLocale.call(self, 0, id, data).value;
    }

    function getEntity(id, data) {
      if (!_isReady) {
        throw new ContextError('Context not ready');
      }
      return getFromLocale.call(self, 0, id, data);
    }

    function localize(ids, callback) {
      if (!callback) {
        throw new ContextError('No callback passed');
      }
      return bindLocalize.call(self, ids, callback);
    }

    function ready(callback) {
      if (_isReady) {
        setTimeout(callback);
      }
      addEventListener('ready', callback);
    }

    function bindLocalize(ids, callback, reason) {

      var bound = {
        // stop: fn
        extend: function extend(newIds) { 
          for (var i = 0; i < newIds.length; i++) {
            if (ids.indexOf(newIds[i]) === -1) {
              ids.push(newIds[i]);
            }
          }
          if (!_isReady) {
            return;
          }
          var newMany = getMany.call(this, newIds);
          // rebind the callback in `_retr`: append new globals seen used in 
          // `newIds` and overwrite the callback with a new one which has the 
          // updated `ids`
          _retr.bindGet({
            id: callback,
            callback: bindLocalize.bind(this, ids, callback),
            globals: Object.keys(newMany.globalsUsed)
          }, true);
          return newMany;
        }.bind(this),
        stop: function stop() {
          _retr.unbindGet(callback);
        }.bind(this)
      };


      // if the ctx isn't ready, bind the callback and return
      if (!_isReady) {
        _retr.bindGet({
          id: callback,
          callback: bindLocalize.bind(this, ids, callback),
          globals: []
        });
        return bound;
      }

      // if the ctx is ready, retrieve the entities
      var many = getMany.call(this, ids);
      var l10n = {
        entities: many.entities,
        // `reason` might be undefined if context was ready before `localize` 
        // was called;  in that case, we pass `locales` so that this scenario 
        // is transparent for the callback
        reason: reason || { locales: _fallbackChain.slice() },
        stop: function() {
          _retr.unbindGet(callback);
        }
      };
      _retr.bindGet({
        id: callback,
        callback: bindLocalize.bind(this, ids, callback),
        globals: Object.keys(many.globalsUsed)
      });
      // callback may call bound.extend which will rebind it if needed;  for 
      // this to work it needs to be called after _retr.bindGet above;  
      // otherwise bindGet would listen to globals passed initially in 
      // many.globalsUsed
      callback(l10n);
      return bound;
    }

    function getMany(ids) {
      var many = {
        entities: {},
        globalsUsed: {}
      };
      for (var i = 0, id; id = ids[i]; i++) {
        many.entities[id] = getEntity.call(this, id);
        for (var global in many.entities[id].globals) {
          many.globalsUsed[global] = true;
        }
      }
      return many;
    }

    function getFromLocale(cur, id, data, sourceString) {
      var loc = _fallbackChain[cur];
      if (!loc) {
        var ex = new GetError("Entity couldn't be retrieved", id, 
                              _fallbackChain.slice());
        _emitter.emit('error', ex);
        // imitate the return value of Compiler.Entity.get
        return {
          value: sourceString ? sourceString : id,
          attributes: {},
          globals: {},
          locale: null
        };
      }
      var locale = getLocale(loc);

      if (!locale.isReady) {
        locale.build(false);
      }

      var entry = locale.getEntry(id);

      // if the entry is missing, just go to the next locale immediately
      if (entry === undefined) {
        _emitter.emit('error', new EntityError('Not found', id, locale.id));
        return getFromLocale.call(this, cur + 1, id, data, sourceString);
      }

      // otherwise, try to get the value of the entry
      try {
        var value = entry.get(getArgs.call(this, data));
      } catch (e) {
        if (e instanceof Compiler.RuntimeError) {
          _emitter.emit('error', new EntityError(e.message, id, locale.id));
          return getFromLocale.call(this, cur + 1, id, data, 
                                    sourceString || e.source);
        } else {
          throw e;
        }
      }
      value.locale = locale.id;
      return value;
    }

    function getArgs(extra) {
      if (!extra) {
        return _data;
      }
      var args = {};
      // deep-clone _data first
      extend(args, _data);
      // overwrite args with the extra args passed to the `get` call
      extend(args, extra);
      return args;
    }

    function addResource(text) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push(['text', text]);
    }

    function add(text, locale) {
      var res = new Resource(null, _parser);
      res.source = text;
      locale.resources.push(res);
    }

    function linkResource(uri) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _reslinks.push([typeof uri === 'function' ? 'template' : 'uri', uri]);
    }

    function link(uri, locale) {
      if (!locale.hasResource(uri)) {
        var res = new Resource(uri, _parser);
        locale.resources.push(res);
      }
    }

    function registerLocales(defLocale, available) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }

      if (defLocale === undefined) {
        return;
      }

      _default = defLocale;
      _registered = [];

      if (!available) {
        available = [];
      }
      available.push(defLocale);

      // uniquify `available` into `_registered`
      for (var i in available) {
        var loc = available[i];
        if (typeof loc !== 'string') {
          throw new ContextError('Language codes must be strings');
        }
        if (_registered.indexOf(loc) === -1) {
          _registered.push(loc);
        }
      }
    }

    function registerLocaleNegotiator(negotiator) {
      if (_isFrozen) {
        throw new ContextError('Context is frozen');
      }
      _negotiator = negotiator;
    }

    function getLocale(loc) {
      if (_locales[loc]) {
        return _locales[loc];
      }
      var locale = _locales[loc] = new Locale(loc, _parser, _compiler);
      // populate the locale with resources
      for (var j = 0; j < _reslinks.length; j++) {
        var res = _reslinks[j];
        if (res[0] === 'text') {
          // a resource added via addResource(String)
          add(res[1], locale);
        } else if (res[0] === 'uri') {
          // a resource added via linkResource(String)
          link(res[1], locale);
        } else {
          // a resource added via linkResource(Function);  the function 
          // passed is a URL template and it takes the current locale's code 
          // as an argument
          link(res[1](locale.id), locale);
        }
      }
      return locale;
    }

    function requestLocales() {
      if (_isFrozen && !_isReady) {
        throw new ContextError('Context not ready');
      }

      _isFrozen = true;
      _requested = Array.prototype.slice.call(arguments);

      if (_reslinks.length == 0) {
        throw new ContextError('Context has no resources');
      }

      // the whole language negotiation process can be asynchronous;  for now 
      // we just use _registered as the list of all available locales, but in 
      // the future we might asynchronously try to query a language pack 
      // service of sorts for its own list of locales supported for this 
      // context;  hence the allLocales promise.
      var allLocales = new Promise();
      allLocales.then(function(available) {
        if (!_negotiator) {
          var Intl = require('./intl').Intl;
          _negotiator = Intl.prioritizeLocales;
        }
        return _negotiator(available, _requested, _default);
      }).then(function(chain) {
        _fallbackChain = chain;
        return getLocale(_fallbackChain[0]);
      }).then(function(locale) {
        if (locale.isReady) {
          return setReady();
        } else {
          return locale.build(true);
        }
      }, echo.bind(null, 'error')).then(setReady)
        // if setReady throws, don't silence the error but emit it instead
        .then(null, echo.bind(null, 'debug'));
      allLocales.fulfill(_registered);
    }

    function setReady() {
      _isReady = true;
      _retr.all(_fallbackChain.slice());
      _emitter.emit('ready');
    }

    function addEventListener(type, listener) {
      _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      _emitter.removeEventListener(type, listener);
    }

    function echo(type, e) {
      _emitter.emit(type, e);
    }
}

  Context.Error = ContextError;
  Context.EntityError = EntityError;

  function ContextError(message) {
    this.name = 'ContextError';
    this.message = message;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  function EntityError(message, id, loc) {
    ContextError.call(this, message);
    this.name = 'EntityError';
    this.id = id;
    this.locale = loc;
    this.message = '[' + loc + '] ' + id + ': ' + message;
  }
  EntityError.prototype = Object.create(ContextError.prototype);
  EntityError.prototype.constructor = EntityError;

  function GetError(message, id, locs) {
    ContextError.call(this, message);
    this.name = 'GetError';
    this.id = id;
    this.tried = locs;
    this.message = id + ': ' + message + '; tried ' + locs.join(', ');
  }
  GetError.prototype = Object.create(ContextError.prototype);
  GetError.prototype.constructor = GetError;

  exports.Context = Context;

});
