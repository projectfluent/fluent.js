(function() {
  'use strict';

  var DEBUG = true

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

  function Cache() {
    this.resources = {};
    this.preprocessed = {};
  }
  
  Cache.prototype.getResource = function Cache_getResource(id) {
    if (!this.resources[id]) {
      this.resources[id] = new Resource(id);
    }
    return this.resources[id];
  };

  Cache.prototype.getProcessedResource = function Cache_getProcessedResource(id, ctx) {
    if (!this.preprocessed[id]) {
      this.preprocessed[id] = new ProcessedResource(id, ctx);
    }
    return this.preprocessed[id];
  };

  // keep one cache for all created contexts
  var cache = new Cache();


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
    var isDownloading = false;
    var isCorrupted = false;

    var xhr;

    function download(url, callback, fallback) {
      debug('GET ', url)
      xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener('load', function() {
        if (xhr.status == 200) {
          debug('200 ', url);
          callback(xhr.responseText);
        } else {
          debug('404 ', url);
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
      if (DEBUG) {
        xhr.open('GET', url + ((/\?/).test(url) ? "&" : "?") + Date.now(), true);
      } else {
        xhr.open('GET', url, true);
      }
      xhr.send('');
    }

    function parse(data) {
      ast = L20n.Parser.parse(data).body;
      imports = ast.filter(function(elem) {
        return elem.type == 'ImportStatement';
      });
      _fire(callbacks, [ast, imports]);
    }

    this.abortXHR = function() {
      xhr.abort();
    };

    this.get = function r_get(callback, fallback) {
      if (ast) {
        callback(ast, imports);
      } else if (isCorrupted) {
        fallback();
      } else {
        callbacks.push(callback);
        if (!isDownloading) {
          isDownloading = true;
          download(id, parse, fallback);
        }
      }
    }
  }

  function ProcessedResource(id, ctx) {

    var rawast = [];
    var callbacks = [];

    this.id = id;
    this.ctx = ctx;
    this.ast = [];
    this.imports = []; // imported resources in order
    // a preprocessed resource is ready when all its child resources are ready 
    // and it has been preprocessed to include their ASTs.
    this.isReady = false;
    // if trying to download this resource fails, this is set to `true`, so 
    // that other resources importing this resource can bail out early
    this.isCorrupted = false;

    this.dirname = id ? id.split('/').slice(0, -1).join('/') : null;
    this.resource = id ? cache.getResource(id, this.ctx) : null;

    var self = this;

    function normalizeURL(url) {
      var parts;
      if (url[0] == '/') {
        parts = url.split('/');
      } else if (self.dirname) {
        // strip the trailing slash if present
        if (self.dirname[self.dirname.length - 1] == '/') {
          self.dirname = self.dirname.slice(0, self.dirname.length - 1);
        }
        parts = (self.dirname + '/' + url).split('/');
      } else {
        parts = ('./' + url).split('/');
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
      if (/^l10n:/.test(uri)) {
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
          uri = [_expandUrn(match[2], vars)];
        } else {
          vars['app'] = match[1];
          uri = [];
          for (var i in self.ctx.settings.schemes) {
            uri.push(_expandUrn(self.ctx.settings.schemes[i], vars));
          }
        }
        return uri;
      }
      return [uri];
    }

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

    this.abortImports = function() {
      debug('aborting XHR for ', this.id);
      if (this.resource) {
        this.resource.abortXHR();
      }
      this.imports.forEach(function(imported) {
        imported.abortImports();
      });
    };

    this.load = function pr_load(callback, nesting, fallback) {
      if (this.isReady) {
        callback();
      } else if (this.isCorrupted) {
        fallback();
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
        }, fallback);
      }
    }

    function importFirstURL(urls, callback, nesting) {
      var url = normalizeURL(urls.shift());
      var imported = cache.getProcessedResource(url, self.ctx);
      self.imports.push(imported);
      imported.load(function() {
        debug('calling callback ', url, ' loaded OK');
        callback();
      }, nesting, function importFailed() {
        debug('calling fallback, ', url, ' failed to load');
        if (urls.length) {
          imported.isCorrupted = true;
          // remove the imported resource from imports, so that we don't check 
          // if it's ready anymore
          self.imports.splice(self.imports.indexOf(imported), 1);
          importFirstURL(urls, callback, nesting);
        } else {
          // fallback to the next locale
          debug('no more scheme URLs to try, resetting the context');
          self.ctx.reset();
        }
      });
    }

    this.importResource = function pr_importResource(uri, callback, nesting) {
      nesting = nesting || 0;
      if (nesting > 7) {
        throw "Too many nested imports";
      }
      // in case the uri is defined in the l10n: scheme, resolve it
      var urls = resolveURI(uri);
      importFirstURL(urls, callback, nesting);
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

    // Context is a top-level resource that imports other resources.  The only 
    // difference is that a regular resource is a file, and the EOF marks the 
    // moment when the resource no longer accepts new imports.  For the 
    // context's meta resource we need the `freeze` method to simulate this 
    // behavior.
    var meta = new ProcessedResource(null, this);
    var uris = [];

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
      fireReadyEvent();
    }

    function fireReadyEvent() {
      debug('context ready, current locale is ', self.getLocale());
      var event = document.createEvent('Event');
      event.initEvent('LocalizationReady', false, false);
      event.ctx = self;
      document.dispatchEvent(event);
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

      document.addEventListener('LocalizationReady', function(event) {
        if (overdue || event.ctx !== self) {
          return;
        }
        window.clearTimeout(ttl);
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
            // TODO ctx_reset needs to be able to shift the locales array
            //Object.freeze(settings.locales);
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

    this.reset = function ctx_reset() {
      meta.abortImports();
      var oldLocale = this.settings.locales.shift();
      debug('old locale was ', oldLocale);
      if (this.settings.locales.length == 0) {
        throw "None of the requested locales was available";
      }
      debug('current locale is ', this.settings.locales[0])
      meta = new ProcessedResource(null, this);
      uris.forEach(function(uri) {
        meta.importResource(uri, _ifComplete(meta, compile));
      });
    };

    this.addResource = function ctx_addResource(uri) {
      if (isFrozen) {
        throw "Context is frozen, can't add more resources";
      }
      uris.push(uri);
      meta.importResource(uri, _ifComplete(meta, compile));
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
  }
}).call(this);
