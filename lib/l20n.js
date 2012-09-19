(function() {
  'use strict';

  var DEBUG = false;

  function debug() {
    if (DEBUG) {
      console.log.apply(this, arguments);
    }
  }

  var L20n;

  if (typeof exports !== 'undefined') {
    L20n = exports;
    L20n.Parser = require('./parser.js');
    L20n.Compiler = require('./compiler.js');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    // node's XHR doesn't support overrideMimeType; make it no-op for now
    XMLHttpRequest.prototype.overrideMimeType = function() {};
  } else {
    L20n = this.L20n = {};
  }

  L20n.getContext = function L20n_getContext() {
    return new Context();
  };

  // clear the Resource cache which stores unprocessed LOL files and which is 
  // shared across all contexts;  additionally, each context also has its own 
  // cache for ProcessedResources, which needs to be invalidated independently.
  L20n.invalidateCache = function L20n_invalidateCache() {
    return resCache.invalidate();
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

  function Cache(ctx, ctor) {
    this.ctx = ctx;
    this.ctor = ctor;
    this.items = {};
  }
  
  Cache.prototype.get = function Cache_get(id) {
    if (!this.items[id]) {
      this.items[id] = new this.ctor(id, this.ctx, this);
    }
    return this.items[id];
  };

  Cache.prototype.invalidate = function Cache_invalidate() {
    this.items = {};
    return true;
  }

  // keep one cache of Resources for all created contexts
  var resCache = new Cache(null, Resource);


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

  function Resource(id) {
    var ast = null;
    var imports = null;
    var callbacks = [];
    var xhr;

    // when the resource is downloading, calling its get method will only add 
    // the specified callback to callbacks, without initiating a new XHR
    var isDownloading = false;
    // resource is corrupted when the XHR returned an error;  the resource 
    // must not be used.
    var isCorrupted = false;

    function getURL(url) {
      if (typeof exports !== undefined && process.env.L20N_TEST) {
        var localhost = 'http://localhost:8357';
        if (url[0] == '/') {
          url = localhost + url;
        } else if (!/localhost:8357/.test(url)) {
          url = localhost + '/locales/' + url;
        }
        return url;
      }
      // in DEBUG mode, bypass the server cache
      return DEBUG ? url + "?" + Date.now() : url;
    }

    function downloadAsync(url, callback, fallback) {
      debug('Async GET ', url);
      xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener('load', function() {
        if (xhr.status == 200) {
          debug(url, 'fetched');
          callback(xhr.responseText);
        } else {
          debug(url, 'failed to fetch');
          isCorrupted = true;
          fallback();
        }
      });
      xhr.addEventListener('abort', function() {
        debug('XHR aborted for ', url);
      });
      xhr.addEventListener('error', function() {
        debug('XHR error for ', url);
        fallback();
      });
      xhr.open('GET', getURL(url), true);
      xhr.send('');
    }

    function downloadSync(url, callback, fallback) {
      debug('Sync GET ', url);
      xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.open('GET', getURL(url), false);
      xhr.send('');
      if (xhr.status == 200) {
        debug(url, 'fetched');
        callback(xhr.responseText);
      } else {
        debug(url, 'failed to fetch');
        isCorrupted = true;
        fallback();
      }
    }

    function parse(data) {
      ast = L20n.Parser.parse(data).body;
      imports = ast.filter(function(elem) {
        return elem.type == 'ImportStatement';
      });
      _fire(callbacks, [ast, imports]);
    }

    this.abortXHR = function() {
      debug('aborting XHR for ', id);
      xhr.abort();
    };

    this.get = function r_get(callback, fallback, async) {
      if (ast) {
        callback(ast, imports);
      } else if (isCorrupted) {
        fallback();
      } else {
        callbacks.push(callback);
        if (!isDownloading) {
          isDownloading = true;
          if (async) {
            downloadAsync(id, parse, fallback);
          } else {
            downloadSync(id, parse, fallback);
          }
        }
      }
    }
  }

  function ProcessedResource(id, ctx, cache) {

    var rawast = [];
    var totalImports = 0;
    var callbacks = [];

    this.id = id;
    this.ctx = ctx;
    this.ast = [];
    this.importedResources = []; // imported resources in order

    // a preprocessed resource is ready when all its child resources are ready 
    // and it has been preprocessed to include their ASTs.
    this.isReady = false;
    // a preprocessed resource is corrupted when its resource is corrupted, or 
    // any of its child preprocessed resources is corrupted too;  a corrupted 
    // preprocessed resource must not be used.
    this.isCorrupted = false;

    this.dirname = id ? id.split('/').slice(0, -1).join('/') : null;
    this.resource = id ? resCache.get(id) : null;

    var self = this;

    function relativeToSelf(url) {
      if (url[0] == '/') {
        return url;
      } else if (self.dirname) {
        // strip the trailing slash if present
        if (self.dirname[self.dirname.length - 1] == '/') {
          self.dirname = self.dirname.slice(0, self.dirname.length - 1);
        }
        return self.dirname + '/' + url;
      } else {
        return './' + url;
      }
    }

    function normalizeURL(url) {
      var normalized = [];
      var parts = url.split('/');
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

    function _expandUrn(urn, vars) {
      return urn.replace(/(\{\{\s*(\w+)\s*\}\})/g,
        function(match, p1, p2, offset, string) {
          if (vars.hasOwnProperty(p2)) {
            return vars[p2];
          }
          return p1;
      });
    }

    function resolveURI(uri) {
      if (!/^l10n:/.test(uri)) {
        var url = normalizeURL(relativeToSelf(uri));
        return [url];
      }
      if (self.ctx.settings.locales === null) {
        throw "Can't use schema uris without settings.locales";
      }
      var match = uri.match(/^l10n:(?:([^:]+):)?([^:]+)/);
      if (match === null) {
        throw "Malformed resource scheme: " + uri;
      }
      var vars = {
        'locale': self.ctx.getLocale(),
        'app': '',
        'resource': match[2]
      };
      if (self.ctx.settings.schemes === null) {
        if (match[1] !== undefined) {
          throw "Can't use schema uris without settings.schemes";
        }
        uri = [normalizeURL(_expandUrn(match[2], vars))];
      } else {
        vars['app'] = match[1];
        uri = [];
        for (var i in self.ctx.settings.schemes) {
          var expanded = _expandUrn(self.ctx.settings.schemes[i], vars);
          uri.push(normalizeURL(expanded));
        }
      }
      return uri;
    }

    function preprocess() {
      if (this.isReady) {
        return;
      }
      rawast.forEach(function(node) {
        if (node.type == 'ImportStatement') {
          var importedAST = this.importedResources.shift().ast;
          this.ast = self.ast.concat(importedAST);
        } else {
          this.ast.push(node);
        }
      }, this);
      this.isReady = true;
      _fire(callbacks);
    }

    this.abortImports = function() {
      if (this.resource) {
        this.resource.abortXHR();
      }
      this.importedResources.forEach(function(imported) {
        imported.abortImports();
      });
    };

    this.load = function pr_load(callback, fallback, nesting, async) {
      if (this.isReady) {
        callback();
      } else if (this.isCorrupted) {
        fallback();
      } else {
        callbacks.push(callback);
        this.resource.get(function resolveImports(ast, imports) {
          rawast = ast;
          totalImports = imports.length;
          if (totalImports) {
            imports.forEach(function(node){
              debug('importing', node.uri.content)
              self.importResource(node.uri.content, 
                                  _ifComplete(self, preprocess), 
                                  fallback, nesting + 1, async);
            });
          } else {
            self.ast = rawast;
            self.isReady = true;
            _fire(callbacks);
          }
        }, fallback, async);
      }
    }

    function importFirstURL(urls, callback, fallback, nesting, async) {
      var url = urls.shift();
      var imported = cache.get(url);
      self.importedResources.push(imported);
      imported.load(
        function importSucceeded() {
          debug('calling callback,', url, ' loaded OK');
          callback();
        }, 
        // `importFailed` is the fallback function which is called when the 
        // imported resource couldn't be loaded.  There are two ways in which 
        // the load function can fail:
        // 1. the resource file could not be found at the specified URL and 
        // there are more locations to look for it in; in this case, look for 
        // the resource in a different location,
        // 2. the resource file could not be found and there are no more URLs 
        // to try;  in this case, the context cannot be integral and a subctx 
        // must be created
        // The second type of failure can happen for the resource that is 
        // currently being imported, as well as for any other nested import 
        // inside of it.  The `importFailed` fallback will be also called from 
        // this resource's `importResource` method (or this resource's 
        // children's `importResource` method) and the `integrityError` 
        // argument is a flag which, when `true`, indicates that the second 
        // type of failure has occurred somewhere deeper in the import tree.
        function importFailed(integrityError) {
          debug('calling fallback,', url, ' failed to load');
          if (integrityError || urls.length == 0) {
            debug('no more scheme URLs to try, creating a subcontext');
            // fallback to the subctx; true bubbles the integrityError up to 
            // the parent fallback
            fallback(true);
          } else {
            imported.isCorrupted = true;
            // remove the imported resource from imports, so that we don't 
            // check if it's ready anymore
            var pos = self.importedResources.indexOf(imported);
            if (pos > -1) {
              self.importedResources.splice(pos, 1);
            }
            importFirstURL(urls, callback, fallback, nesting, async);
          }
        }, nesting, async);
    }

    this.importResource = function pr_importResource(uri, 
                                                     callback, 
                                                     fallback, 
                                                     nesting, 
                                                     async) {
      nesting = nesting || 0;
      if (nesting > 7) {
        throw "Too many nested imports";
      }
      // in case the uri is defined in the l10n: scheme, resolve it
      var urls = resolveURI(uri);
      importFirstURL(urls, callback, fallback, nesting, async);
    }

    this.isComplete = function pr_isComplete() {
      if (this.importedResources.length != totalImports) {
        return false;
      }
      for (var i in this.importedResources) {
        if (!this.importedResources[i].isReady) {
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

    // when context is frozen, no more resources can be added to it
    var isFrozen = false;
    // context is integral when all the resources have been downloaded
    var isIntegral = false;
    // context is ready when it's integral and compiled
    var isReady = false;

    // a subcontext can be created when 1) the context is not integral, or 2) 
    // the context is ready, but an entity couldn't be found in it
    var subctx;

    // contrary to the resCache, the cache for processed resources is 
    // per-context, because ProcessedResources keep reference to their parent 
    // context
    var cache = new Cache(this, ProcessedResource);

    // Context is a top-level resource that imports other resources.  The only 
    // difference is that a regular resource is a file, and the EOF marks the 
    // moment when the resource no longer accepts new imports.  For the 
    // context's meta resource we need the `freeze` method to simulate this 
    // behavior.
    var meta = new ProcessedResource(null, this, cache);
    // the URIs of all resources that have been addResource'd;  used for 
    // creating a subctx
    var uris = [];
    // uris' length, basically;  used in m_isComplete to make sure we're 
    // checking all resources for readiness
    var totalResources = 0;

    var self = this;

    meta.isComplete = function m_isComplete() {
      if (!isFrozen) {
        return false;
      }
      if (meta.importedResources.length != totalResources) {
        return false;
      }
      for (var i in this.importedResources) {
        if (!this.importedResources[i].isReady) {
          return false;
        }
      }
      isIntegral = true;
      return true;
    }

    function compile() {
      if (isReady) {
        return;
      }
      // flatten the AST
      meta.ast = meta.importedResources.reduce(function(prev, curr) {
        return prev.concat(curr.ast);
      }, []);
      L20n.Compiler.compile(meta.ast, entries, globals);
      isReady = true;
      debug('context ready, current locale is ', self.getLocale());
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

    function createSubContext(async) {
      var subctx = new Context();
      subctx.settings.schemes = self.settings.schemes;
      subctx.settings.locales = self.settings.locales.slice(1);
      if (!subctx.getLocale()) {
        emitter.emit('error');
        throw "None of the requested locales was available.";
      }
      debug('subcontext\'s locale is ', subctx.getLocale());
      uris.forEach(function(uri) {
        subctx.addResource(uri, async);
      });
      subctx.freeze();
      return subctx;
    }

    function invalidateOnIntegrityError() {
      isIntegral = false;
      meta.abortImports();
      debug('invalidated context\'s locale was ', self.getLocale());
      subctx = createSubContext(true);
      subctx.addEventListener('ready', function() {
        isReady = true;
        emitter.emit('ready');
      });
    }

    function getSync(id, data) {
      if (!isReady) {
        throw "Error: context not ready";
      }
      if (!isIntegral) {
        return subctx.get(id, data);
      }
      var entity = entries[id];
      if (!entity) {
        debug('entity', id, 'not found, using subcontext');
        if (!subctx) {
          debug('creating subcontext');
          subctx = createSubContext(false);
        }
        return subctx.get(id, data);
      }
      if (!entity || entity.local) {
        throw "No such entity: " + id;
      }
      var args = getArgs(data);
      return entity.toString(args);
    };

    function getAsync(id, data, callback, defaultValue) {
      if (isReady) {
        callback(getSync(id, data));
        return;
      }
      var overdue = false;
      var timeout = setTimeout(function() {
        overdue = true;
        // defaultValue is just a string, can't interpolate context data
        callback(defaultValue);
      }, settings.timeout);

      self.addEventListener('ready', function(event) {
        // if the event fired too late, the default value has already been used
        if (overdue) {
          return;
        }
        clearTimeout(timeout);
        callback(getSync(id, data));
      });
    };

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
      if (!settings.locales || settings.locales.length == 0) {
        return null;
      }
      return settings.locales[0];
    };

    // clear this context's ProcessedResources cache
    this.invalidateCache = function ctx_invalidateCache() {
      return cache.invalidate();
    };

    this.addResource = function ctx_addResource(uri, async) {
      if (isFrozen) {
        throw "Context is frozen, can't add more resources";
      }
      if (async === undefined) {
        async = true;
      }
      uris.push(uri);
      meta.importResource(uri, _ifComplete(meta, compile), 
                          invalidateOnIntegrityError,  0, async);
      return true;
    };

    this.freeze = function ctx_freeze() {
      isFrozen = true;
      totalResources = uris.length;
      _ifComplete(meta, compile)();
      return true;
    };

    this.get = function ctx_get(id, data, callback, fallback) {
      if (callback === undefined) {
        return getSync(id, data);
      }
      getAsync(id, data, callback, fallback);
      return null;
    };

    this.getAttribute = function ctx_getAttribute(id, attr, data) {
      if (!isReady) {
        throw "Error: context not ready";
      }
      var entity = entries[id];
      if (!entity || entity.local) {
        throw "No such entity: " + id;
      }
      var attribute = entity.attributes[attr]
      if (!attribute || attribute.local) {
        throw "No such attribute: " + attr;
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
        throw "No such entity: " + id;
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
