(function() {
  'use strict';

  var L20n;

  if (typeof exports !== 'undefined') {
    L20n = exports;
    L20n.Parser = require('./parser.js');
    L20n.Compiler = require('./compiler.js');
  } else {
    L20n = this.L20n = {};
  }

  L20n.getContext = function L20n_getContext() {
    return new Context();
  };

  var globals = {
    get hour() {
      return new Date().getHours();
    },
    get os() {
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
    },
  };

  function EventEmitter() {
    this._listeners = {};
  }

  EventEmitter.prototype.emit = function ee_emit() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var typeListeners = this._listeners[type];
    if (!typeListeners || !typeListeners.length) {
      return false;
    }
    typeListeners.forEach(function(listener) {
      listener.apply(this, args);
    }, this);
    return true;
  }

  EventEmitter.prototype.addEventListener = function ee_add(type, listener) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
    return this;
  }

  EventEmitter.prototype.removeEventListener = function ee_remove(type, listener) {
    var typeListeners = this._listeners[type];
    var pos = typeListeners.indexOf(listener);
    if (pos === -1) {
      return this;
    }
    listeners.splice(pos, 1);
    return this;
  }

  function Cache() {
    this.resources = {};
    this.preprocessed = {};
  }
  
  Cache.prototype.getResource = function Cache_getResource(uri) {
    if (!this.resources[uri]) {
      this.resources[uri] = new Resource(uri);
    }
    return this.resources[uri];
  };

  Cache.prototype.getProcessedResource = function Cache_getProcessedResource(relpath, basepath) {
    var uri = this.normalizeURL(relpath, basepath);
    if (!this.preprocessed[uri]) {
      this.preprocessed[uri] = new ProcessedResource(this, uri);
    }
    return this.preprocessed[uri];
  };

  Cache.prototype.normalizeURL = function Cache_normalizeURL(relpath, basepath) {
    var parts;
    if (relpath[0] == '/') {
      parts = relpath.split('/');
    } else if (basepath) {
      // strip the trailing slash if present
      if (basepath[basepath.length - 1] == '/') {
        basepath = basepath.slice(0, basepath.length - 1);
      }
      parts = (basepath + '/' + relpath).split('/');
    } else {
      parts = ('./' + relpath).split('/');
    }
    var normalized = [];
    parts.forEach(function(part, i) {
      if (part == '.') {
        // don't do anything
      } else if (part == '..' && normalized[normalized.length - 1]) {
        // remove the last element of `normalized`
        normalized.splice(normalized.length - 1, 1);
      } else {
        normalized.push(part);
      }
    });
    return normalized.join('/');
  };

  function _ifComplete(self, fn) {
    return function ifComplete() {
      if (self.isComplete()) {
        fn.apply(self, arguments);
      }
    }
  }

  function _fire(callbacks, args) {
    callbacks.forEach(function(callback) {
      callback.apply(this, args);
    });
    callbacks.length = 0;
  }

  function Resource(uri) {
    //var uri = uri;
    var ast = null;
    var imports = null;
    var callbacks = [];
    var isDownloading = false;

    function download(uri, callback) {
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener("load", function() {
        callback(xhr.responseText)
      });
      xhr.open('GET', uri, true);
      xhr.send('');
    }

    function parse(data) {
      ast = L20n.Parser.parse(data).body;
      imports = ast.filter(function(elem) {
        return elem.type == 'ImportStatement';
      });
      _fire(callbacks, [ast, imports]);
    }

    this.get = function r_get(callback) {
      if (ast) {
        callback(ast, imports);
      } else {
        callbacks.push(callback);
        if (!isDownloading) {
          isDownloading = true;
          download(uri, parse);
        }
      }
    }
  }

  function ProcessedResource(cache, uri) {

    var rawast = [];
    var callbacks = [];

    this.ast = [];
    this.imports = []; // imported resources in order
    // a preprocessed resource is ready when all its child resources are ready 
    // and it has been preprocessed to include their ASTs.
    this.isReady = false;

    this.cache = cache;
    this.dirname = uri ? uri.split('/').slice(0, -1).join('/') : null;
    this.resource = uri ? this.cache.getResource(uri) : null;

    var self = this;

    function preprocess() {
      if (this.isReady) {
        return;
      }
      rawast.forEach(function(node) {
        if (node.type == 'ImportStatement') {
          var importedAST = this.imports.shift().ast;
          this.ast = self.ast.concat(importedAST);
        } else {
          this.ast.push(node);
        }
      }, this);
      this.isReady = true;
      _fire(callbacks);
    }

    this.load = function pr_load(callback, nesting) {
      if (this.isPreprocessed) {
        callback();
      } else {
        callbacks.push(callback);
        this.resource.get(function resolveImports(ast, imports) {
          rawast = ast;
          if (imports.length) {
            imports.forEach(function(node){
              self.importResource(node.uri.content, _ifComplete(self, preprocess),
                nesting + 1);
            });
          } else {
            self.ast = rawast;
            self.isReady = true;
            _fire(callbacks);
          }
        });
      }
    }

    this.importResource = function pr_importResource(relpath, callback, nesting) {
      nesting = nesting || 0;
      if (nesting > 7) {
        throw "Too many nested imports";
      }
      var imported = this.cache.getProcessedResource(relpath, self.dirname);
      this.imports.push(imported);
      imported.load(callback, nesting);
    }

    this.isComplete = function pr_isComplete() {
      for (var i in this.imports) {
        if (!this.imports[i].isReady) {
          return false;
        }
      }
      return true;
    }
  }

  function Context() {

    var entries = {};     // resource entries
    var ctxdata = {};     // context variables
    var emitter = new EventEmitter();
    var settings = {
      'schemes': null,    // path schemes
      'locales': null,    // list of locale codes in priority order
      'timeout': 500,     // timeout for asynchronous resource loading
    };

    var isFrozen = false;
    // context is ready when all the resources have been downloaded, 
    // preprocessed and compiled
    var isReady = false;

    var self = this;

    var cache = new Cache();

    // Context is a top-level resource that imports other resources.  The only 
    // difference is that a regular resource is a file, and the EOF marks the 
    // moment when the resource no longer accepts new imports.  For the 
    // context's meta resource we need the `freeze` method to simulate this 
    // behavior.
    var meta = new ProcessedResource(cache);

    meta.isComplete = function m_isComplete() {
      if (!isFrozen) {
        return false;
      }
      for (var i in this.imports) {
        if (!this.imports[i].isReady) {
          return false;
        }
      }
      return true;
    }

    function compile() {
      if (isReady) {
        return;
      }
      // flatten the AST
      meta.ast = meta.imports.reduce(function(prev, curr) {
        return prev.concat(curr.ast);
      }, []);
      L20n.Compiler.compile(meta.ast, entries, globals);
      isReady = true;
      emitter.emit('ready');
    }

    function getArgs(data) {
      var args = Object.create(ctxdata);
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function getSync(id, data) {
      if (!isReady) {
        throw "Error: context not ready";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var args = getArgs(data);
      return entity.toString(args);
    };

    function getAsync(id, data, callback, fallback) {
      if (isReady) {
        callback(getSync(id, data));
      }
      var overdue = false;
      var ttl = window.setTimeout(function() {
        overdue = true;
        // fallback is just a string, can't interpolate context data
        callback(fallback);
      }, settings.timeout);

      self.addEventListener('ready', function(event) {
        // if the event fired too late, the default value has already been used
        if (overdue) {
          return;
        }
        window.clearTimeout(ttl);
        callback(getSync(id, data));
      });
    };

    function _expandUrn(urn, vars) {
      return urn.replace(/(\{\{\s*(\w+)\s*\}\})/g,
        function(match, p1, p2, offset, string) {
          if (vars.hasOwnProperty(p2)) {
            return vars[p2];
          }
          return p1;
      });
    }

    function resolveUrl(url) {
      if (/^l10n:/.test(url)) {
        if (settings.locales === null) {
          throw "Can't use schema urls without settings.locales";
        }
        var vars = {
          'locale': self.getLocale()
        }
        var match = url.match(/^l10n:(?:([^:]+):)?([^:]+)/);
        if (match === null) {
          throw "Malformed resource scheme: "+url;
        }
        vars['app'] = '';
        vars['resource'] = match[2];
        if (settings.schemes === null) {
          if (match[1] !== undefined) {
            throw "Can't use schema urls without settings.schemes";
          }
          url = [_expandUrn(match[2], vars)];
        } else {
          vars['app'] = match[1];
          url = []
          for (var i in settings.schemes) {
            url.push(_expandUrn(settings.schemes[i], vars));
          }
        }
        return url;
      }
      return [url];
    }

    this.__defineSetter__('data', function(data) {
      ctxdata = data;
    });

    this.__defineGetter__('data', function() {
      return ctxdata;
    });

    Object.defineProperty(this, 'settings', {
      value: Object.create(Object.prototype, {
        locales: {
          get: function() { return settings.locales },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Locales must be a list";
            }
            if (val.length == 0) {
              throw "Locales list must not be empty";
            }
            if (settings.locales !== null) {
              throw "Can't overwrite locales";
            }
            settings.locales = val;
            Object.freeze(settings.locales);
          },
          configurable: false,
          enumerable: true,
        },
        schemes: {
          get: function() { return settings.schemes },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Schemes must be a list";
            }
            if (val.length == 0) {
              throw "Scheme list must not be empty";
            }
            if (settings.schemes !== null) {
              throw "Can't overwrite schemes";
            }
            settings.schemes = val;
            Object.freeze(settings.schemes);
          },
          configurable: false,
          enumerable: true,
        },
        timeout: {
          get: function() { return settings.timeout },
          set: function(val) {
            if (typeof(val) !== 'number') {
              throw "Timeout must be a number";
            }
            settings.timeout = val;
          },
          configurable: false,
          enumerable: true,
        },
      }),
      writable: false,
      enumerable: false,
      configurable: false,
    });

    this.getLocale = function ctx_getLocale() {
      if (settings.locales.length == 0) {
        return null;
      }
      return settings.locales[0];
    };

    this.addResource = function ctx_addResource(url) {
      if (isFrozen) {
        throw "Context is frozen, can't add more resources";
      }
      meta.importResource(resolveUrl(url), _ifComplete(meta, compile));
    };

    this.freeze = function ctx_freeze() {
      isFrozen = true;
      _ifComplete(meta, compile);
    };

    this.get = function ctx_get(id, data, callback, fallback) {
      if (isReady || callback === undefined) {
        return getSync(id, data);
      } else {
        getAsync(id, data, callback, fallback);
        return null;
      }
    };

    this.getAttribute = function ctx_getAttribute(id, attr, data) {
      if (!isReady) {
        throw "Error: context not ready";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var attribute = entity.attributes[attr]
      if (!attribute || attribute.local) {
        console.warn("No such attribute: " + attr);
        return null;
      }
      var args = getArgs(data);
      return attribute.toString(args);
    };

    this.getAttributes = function ctx_getAttributes(id, data) {
      if (!isReady) {
        throw "Error: context not ready";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        console.warn("No such entity: " + id);
        return null;
      }
      var args = getArgs(data);
      var attributes = {};
      for (var attr in entity.attributes) {
        var attribute = entity.attributes[attr];
        if (!attribute.local) {
          attributes[attr] = attribute.toString(args);
        }
      }
      return attributes;
    }

    this.addEventListener = function ctx_addEventListener(type, listener) {
      return emitter.addEventListener(type, listener);
    }

    this.removeEventListener = function ctx_removeEventListener(type, listener) {
      return emitter.removeEventListener(type, listener)
    }
  }
}).call(this);
