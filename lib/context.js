(function() {
  'use strict';

  var L20n = {
    Context: Context,
    getContext: function L20n_getContext(id) {
      return new Context(id);
    },
  };

  function Resource(id, parser) {
    var self = this;

    this.id = id;
    this.resources = [];
    this.source = null;
    this.isReady = false;
    this.ast = {
      type: 'LOL',
      body: [],
    };

    this.build = build;

    var _imports_positions = [];

    function build(nesting, async) {
      if (nesting >= 7) {
        throw new ContextError("Too many nested imports.");
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
        if (!self.source) {
          self.source = L20n.IO.loadSync(self.id);
        }
        return;
      }
      if (self.source) {
        var source = new L20n.Promise();
        source.fulfill();
        return source;
      }
      return L20n.IO.loadAsync(self.id).then(function load_success(text) {
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
        return L20n.Promise.all(imports_built);
      }
    }

    function flatten() {
      for (var i = self.resources.length-1; i >= 0; i--) {
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
      body: [],
    };
    this.isReady = false;

    this.build = build;
    this.getEntry = getEntry;

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
        return L20n.Promise.all(resources_built);
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
  }

  function Context(id) {

    this.id = id;
    this.data = {};

    this.addResource = addResource;
    this.linkResource = linkResource;
    this.registerLocales = registerLocales;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = getEntity;
    this.localize = localize;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    // all languages registered as available (list of codes)
    var _available = [];
    var _locales = {};
    // a special Locale for resources not associated with any other
    var _none;

    var _isFrozen = false;
    var _isReady = false;
    var _emitter = new L20n.EventEmitter();
    var _parser = new L20n.Parser(L20n.EventEmitter);
    var _compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
    var _globals = {
      get hour() {
        return new Date().getHours();
      },
    };
    var _listeners = [];

    _parser.addEventListener('error', echo);
    _compiler.addEventListener('error', echo);
    _compiler.setGlobals(_globals);

    function get(id, data, callback) {
      if (!_isReady) {
        if (!callback) {
          throw new ContextError("Context not ready");
        }
        return this.addEventListener('ready', 
                                     get.bind(this, id, data, callback));
      }
      var val = getFromLocale(0, id, data).value;
      if (callback) {
        callback(val);
      }
      return val;
    }

    function getEntity(id, data, callback) {
      if (!_isReady) {
        if (!callback) {
          throw new ContextError("Context not ready");
        }
        return this.addEventListener('ready', 
                                     getEntity.bind(this, id, data, callback));
      }
      var entity = getFromLocale(0, id, data);
      if (callback) {
        callback(entity);
      }
      return entity;
    }

    function localize(idsOrTuples, callback) {
      if (_isReady) {
        return getMany.call(this, idsOrTuples, callback);
      }
      this.addEventListener('ready', function() {
        getMany(this, idsOrTuples, data, callback);
      });
    }

    function getMany(idsOrTuples, callback) {
      var vals = {};
      for (var i = 0, iot; iot = idsOrTuples[i]; i++) {
        if (Array.isArray(iot)) {
          vals[iot[0]] = getEntity.call(this, iot[0], iot[1]);
        } else {
          vals[iot] = getEntity.call(this, iot);
        }
      }
      var retobj = {
        'entities': vals,
      };
      if (callback) {
        callback(retobj);
      }
      return retobj;
    }

    function getLocale(i) {
      // if we're out of locales from `_available`, resort to `_none`
      if (_available.length - i == 0) {
        return _none;
      }
      return  _locales[_available[i]];
    }

    function getFromLocale(cur, id, data, sourceString) {
      var locale = getLocale(cur);

      if (!locale) {
        var ex = new GetError("Entity couldn't be retrieved", id, _available);
        _emitter.emit('error', ex);
        // imitate the return value of Compiler.Entity.get
        return {
          value: sourceString ? sourceString : id,
          attributes: {},
          globals: {}
        };
      }

      if (!locale.isReady) {
        locale.build(false);
      }

      var entry = locale.getEntry(id);

      // if the entry is missing, just go to the next locale immediately
      if (entry === undefined) {
        _emitter.emit('error', new EntityError("Not found", id, locale.id));
        return getFromLocale(cur + 1, id, data, sourceString);
      }

      // otherwise, try to get the value of the entry
      try {
        return entry.get(getArgs.bind(this, data));
      } catch(e) {
        if (e instanceof L20n.Compiler.RuntimeError) {
          _emitter.emit('error', new EntityError(e.message, id, locale.id));
          return getFromLocale(cur + 1, id, data, sourceString || e.source);
        } else {
          throw e;
        }
      }
    }

    function getArgs(data) {
      if (!data) {
        return this.data;
      }
      var args = {};
      for (var i in this.data) {
        if (this.data.hasOwnProperty(i)) {
          args[i] = this.data[i];
        }
      }
      if (data) {
        for (i in data) {
          if (data.hasOwnProperty(i)) {
            args[i] = data[i];
          }
        }
      }
      return args;
    }

    function addResource(text) {
      if (_available.length === 0) {
        _none = new Locale(null, _parser, _compiler);
      } else {
        // XXX should addResource add the text to all locales in the multilocale 
        // mode?  or throw?
        throw new ContextError("Can't use addResource with registered languages");
      }
      var res = new Resource(null, _parser);
      res.source = text;
      _none.resources.push(res);
    }

    function linkResource(uri) {
      if (typeof uri === 'function') {
        return linkTemplate(uri);
      } else {
        return linkURI(uri);
      }
    }

    function linkTemplate(uriTemplate) {
      if (_available.length === 0) {
        throw new ContextError("No registered languages");
      }
      for (var lang in _locales) {
        var res = new Resource(uriTemplate(lang), _parser);
        // XXX detect if the resource has been already added?
        _locales[lang].resources.push(res);
      }
      return true;
    }

    function linkURI(uri) {
      var res = new Resource(uri, _parser);
      if (_available.length !== 0) {
        for (var lang in _locales) {
          _locales[lang].resources.push(res);
        }
        return true;
      }
      if (_none === undefined) {
        _none = new Locale(null, _parser, _compiler);
      }
      _none.resources.push(res);
      return true;
    }

    function registerLocales() {
      for (var i in arguments) {
        var lang = arguments[i];
        _available.push(lang);
        _locales[lang] = new Locale(lang, _parser, _compiler);
      }
    }

    function freeze() {
      _isFrozen = true;
      var locale = _available.length > 0 ? _locales[_available[0]] : _none;
      return locale.build(true).then(setReady);
    }

    function setReady() {
      _isReady = true;
      _emitter.emit('ready');
    }

    function addEventListener(type, listener) {
      _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      _emitter.removeEventListener(type, listener);
    }

    function echo(e) {
      _emitter.emit('error', e);
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

  function EntityError(message, id, lang) {
    ContextError.call(this, message);
    this.name = 'EntityError';
    this.id = id;
    this.lang = lang;
    this.message = '[' + lang + '] ' + id + ': ' + message;
  }
  EntityError.prototype = Object.create(ContextError.prototype);
  EntityError.prototype.constructor = EntityError;

  function GetError(message, id, langs) {
    ContextError.call(this, message);
    this.name = 'GetError';
    this.id = id;
    this.tried = langs;
    if (langs.length) {
      this.message = id + ': ' + message + '; tried ' + langs.join(', ');
    } else {
      this.message = id + ': ' + message;
    }
  }
  GetError.prototype = Object.create(ContextError.prototype);
  GetError.prototype.constructor = GetError;

  this.L20n = L20n;

}).call(this);
