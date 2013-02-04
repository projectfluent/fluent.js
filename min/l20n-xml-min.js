/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 1.7.1
 */

(function(define) { 'use strict';
define(function () {
	var reduceArray, slice, undef;

	//
	// Public API
	//

	when.defer     = defer;     // Create a deferred
	when.resolve   = resolve;   // Create a resolved promise
	when.reject    = reject;    // Create a rejected promise

	when.join      = join;      // Join 2 or more promises

	when.all       = all;       // Resolve a list of promises
	when.map       = map;       // Array.map() for promises
	when.reduce    = reduce;    // Array.reduce() for promises

	when.any       = any;       // One-winner race
	when.some      = some;      // Multi-winner race

	when.chain     = chain;     // Make a promise trigger another resolver

	when.isPromise = isPromise; // Determine if a thing is a promise

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
	 * promiseOrValue is a foreign promise, or a new, already-fulfilled {@link Promise}
	 * whose value is promiseOrValue if promiseOrValue is an immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @returns Guaranteed to return a trusted Promise.  If promiseOrValue is a when.js {@link Promise}
	 *   returns promiseOrValue, otherwise, returns a new, already-resolved, when.js {@link Promise}
	 *   whose resolution value is:
	 *   * the resolution value of promiseOrValue if it's a foreign promise, or
	 *   * promiseOrValue if it's a value
	 */
	function resolve(promiseOrValue) {
		var promise, deferred;

		if(promiseOrValue instanceof Promise) {
			// It's a when.js promise, so we trust it
			promise = promiseOrValue;

		} else {
			// It's not a when.js promise. See if it's a foreign promise or a value.
			if(isPromise(promiseOrValue)) {
				// It's a thenable, but we don't know where it came from, so don't trust
				// its implementation entirely.  Introduce a trusted middleman when.js promise
				deferred = defer();

				// IMPORTANT: This is the only place when.js should ever call .then() on an
				// untrusted promise. Don't expose the return value to the untrusted promise
				promiseOrValue.then(
					function(value)  { deferred.resolve(value); },
					function(reason) { deferred.reject(reason); },
					function(update) { deferred.progress(update); }
				);

				promise = deferred.promise;

			} else {
				// It's a value, not a promise.  Create a resolved promise for it.
				promise = fulfilled(promiseOrValue);
			}
		}

		return promise;
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @return {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @name Promise
	 */
	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a callback that will be called when a promise is
		 * fulfilled or rejected.  Optionally also register a progress handler.
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress)
		 * @param {function?} [onFulfilledOrRejected]
		 * @param {function?} [onProgress]
		 * @return {Promise}
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		yield: function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.spread(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @return {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		}
	};

	/**
	 * Create an already-resolved promise for the supplied value
	 * @private
	 *
	 * @param {*} value
	 * @return {Promise} fulfilled promise
	 */
	function fulfilled(value) {
		var p = new Promise(function(onFulfilled) {
			// TODO: Promises/A+ check typeof onFulfilled
			try {
				return resolve(onFulfilled ? onFulfilled(value) : value);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Create an already-rejected {@link Promise} with the supplied
	 * rejection reason.
	 * @private
	 *
	 * @param {*} reason
	 * @return {Promise} rejected promise
	 */
	function rejected(reason) {
		var p = new Promise(function(_, onRejected) {
			// TODO: Promises/A+ check typeof onRejected
			try {
				return onRejected ? resolve(onRejected(reason)) : rejected(reason);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Creates a new, Deferred with fully isolated resolver and promise parts,
	 * either or both of which may be given out safely to consumers.
	 * The Deferred itself has the full API: resolve, reject, progress, and
	 * then. The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @return {Deferred}
	 */
	function defer() {
		var deferred, promise, handlers, progressHandlers,
			_then, _progress, _resolve;

		/**
		 * The promise for the new deferred
		 * @type {Promise}
		 */
		promise = new Promise(then);

		/**
		 * The full Deferred object, with {@link Promise} and {@link Resolver} parts
		 * @class Deferred
		 * @name Deferred
		 */
		deferred = {
			then:     then, // DEPRECATED: use deferred.promise.then
			resolve:  promiseResolve,
			reject:   promiseReject,
			// TODO: Consider renaming progress() to notify()
			progress: promiseProgress,

			promise:  promise,

			resolver: {
				resolve:  promiseResolve,
				reject:   promiseReject,
				progress: promiseProgress
			}
		};

		handlers = [];
		progressHandlers = [];

		/**
		 * Pre-resolution then() that adds the supplied callback, errback, and progback
		 * functions to the registered listeners
		 * @private
		 *
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 */
		_then = function(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			var deferred, progressHandler;

			deferred = defer();

			progressHandler = typeof onProgress === 'function'
				? function(update) {
					try {
						// Allow progress handler to transform progress event
						deferred.progress(onProgress(update));
					} catch(e) {
						// Use caught value as progress
						deferred.progress(e);
					}
				}
				: function(update) { deferred.progress(update); };

			handlers.push(function(promise) {
				promise.then(onFulfilled, onRejected)
					.then(deferred.resolve, deferred.reject, progressHandler);
			});

			progressHandlers.push(progressHandler);

			return deferred.promise;
		};

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @private
		 * @param {*} update progress event payload to pass to all listeners
		 */
		_progress = function(update) {
			processQueue(progressHandlers, update);
			return update;
		};

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the resolution or rejection
		 * @private
		 * @param {*} value the value of this deferred
		 */
		_resolve = function(value) {
			value = resolve(value);

			// Replace _then with one that directly notifies with the result.
			_then = value.then;
			// Replace _resolve so that this Deferred can only be resolved once
			_resolve = resolve;
			// Make _progress a noop, to disallow progress for the resolved promise.
			_progress = noop;

			// Notify handlers
			processQueue(handlers, value);

			// Free progressHandlers array since we'll never issue progress events
			progressHandlers = handlers = undef;

			return value;
		};

		return deferred;

		/**
		 * Wrapper to allow _then to be replaced safely
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 * @return {Promise} new promise
		 */
		function then(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			return _then(onFulfilled, onRejected, onProgress);
		}

		/**
		 * Wrapper to allow _resolve to be replaced
		 */
		function promiseResolve(val) {
			return _resolve(val);
		}

		/**
		 * Wrapper to allow _reject to be replaced
		 */
		function promiseReject(err) {
			return _resolve(rejected(err));
		}

		/**
		 * Wrapper to allow _progress to be replaced
		 */
		function promiseProgress(update) {
			return _progress(update);
		}
	}

	/**
	 * Determines if promiseOrValue is a promise or not.  Uses the feature
	 * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
	 * promiseOrValue is a promise.
	 *
	 * @param {*} promiseOrValue anything
	 * @returns {boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
	 * rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, progress, len, i;

			len = promisesOrValues.length >>> 0;

			toResolve = Math.max(0, Math.min(howMany, len));
			values = [];

			toReject = (len - toResolve) + 1;
			reasons = [];

			deferred = defer();

			// No items in the input, resolve immediately
			if (!toResolve) {
				deferred.resolve(values);

			} else {
				progress = deferred.progress;

				rejectOne = function(reason) {
					reasons.push(reason);
					if(!--toReject) {
						fulfillOne = rejectOne = noop;
						deferred.reject(reasons);
					}
				};

				fulfillOne = function(val) {
					// This orders the values based on promise resolution order
					// Another strategy would be to use the original position of
					// the corresponding promise.
					values.push(val);

					if (!--toResolve) {
						fulfillOne = rejectOne = noop;
						deferred.resolve(values);
					}
				};

				for(i = 0; i < len; ++i) {
					if(i in promisesOrValues) {
						when(promisesOrValues[i], fulfiller, rejecter, progress);
					}
				}
			}

			return deferred.then(onFulfilled, onRejected, onProgress);

			function rejecter(reason) {
				rejectOne(reason);
			}

			function fulfiller(val) {
				fulfillOne(val);
			}

		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} promise array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promise, mapFunc) {
		return when(promise, function(array) {
			var results, len, toResolve, resolve, i, d;

			// Since we know the resulting length, we can preallocate the results
			// array to avoid array expansions.
			toResolve = len = array.length >>> 0;
			results = [];
			d = defer();

			if(!toResolve) {
				d.resolve(results);
			} else {

				resolve = function resolveOne(item, i) {
					when(item, mapFunc).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							d.resolve(results);
						}
					}, d.reject);
				};

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolve(array[i], i);
					} else {
						--toResolve;
					}
				}

			}

			return d.promise;

		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = slice.call(arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	/**
	 * Ensure that resolution of promiseOrValue will trigger resolver with the
	 * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
	 *
	 * @param promiseOrValue
	 * @param {Object} resolver
	 * @param {function} resolver.resolve
	 * @param {function} resolver.reject
	 * @param {*} [resolveValue]
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var useResolveValue = arguments.length > 2;

		return when(promiseOrValue,
			function(val) {
				val = useResolveValue ? resolveValue : val;
				resolver.resolve(val);
				return val;
			},
			function(reason) {
				resolver.reject(reason);
				return rejected(reason);
			},
			resolver.progress
		);
	}

	//
	// Utility functions
	//

	/**
	 * Apply all functions in queue to value
	 * @param {Array} queue array of functions to execute
	 * @param {*} value argument passed to each function
	 */
	function processQueue(queue, value) {
		var handler, i = 0;

		while (handler = queue[i++]) {
			handler(value);
		}
	}

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}

	/**
	 * No-Op function used in method replacement
	 * @private
	 */
	function noop() {}

	slice = [].slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.
	reduceArray = [].reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/

			// ES5 dictates that reduce.length === 1

			// This implementation deviates from ES5 spec in the following ways:
			// 1. It does not check if reduceFunc is a Callable

			var arr, args, reduced, len, i;

			i = 0;
			// This generates a jshint warning, despite being valid
			// "Missing 'new' prefix when invoking a constructor."
			// See https://github.com/jshint/jshint/issues/392
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				// Skip holes
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	return when;
});
})(typeof define == 'function' && define.amd
	? define
	: function (factory) { typeof exports === 'object'
		? (module.exports = factory())
		: (this.when      = factory());
	}
	// Boilerplate for AMD, Node, and browser global
);
(function() {
  'use strict';

//var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
//XMLHttpRequest.prototype.overrideMimeType = function() {};
//var when = require('./when.js');

  this.IO = {
    loadAsync: function(url) {
      var deferred = when.defer();
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.addEventListener('load', function() {
        if (xhr.status == 200) {
          deferred.resolve(xhr.responseText);
        } else {
          deferred.reject();
        }
      });
      xhr.addEventListener('abort', function(e) {
        return when.reject(e);
      });
      xhr.open('GET', url, true);
      xhr.send('');
      return deferred.promise;
    },

    loadSync: function(url) {
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType('text/plain');
      xhr.open('GET', url, false);
      xhr.send('');
      if (xhr.status == 200) {
        return xhr.responseText;
      } else {
        return false;
      }
    }
  }

}).call(this);
(function() {
  'use strict';

  var L20n = {
    getContext: function L20n_getContext(id) {
      return new Context(id);
    },
  };

  function Source(url, text) {
    this.text = text;
    this.ast = null;
    this.url = url;
  }

  function Resource(id, ctx, parser) {
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
    this.injectResource = injectResource;
    this.addResource = addResource;
    this.parse = parse;

    var _resources_parsed = [];
    var _imports_positions = [];

    function inlineResource(res, pos) {
      // is this the Context's _resource?
      if (self.source === null) {
        self.ast.body = self.ast.body.concat(res.source.ast.body);
      } else {
        Array.prototype.splice.apply(self.ast.body,
                                     [pos, 1].concat(res.source.ast.body));
      }
    }

    function merge() {
      for (var i = 0, res; res = self.resources[i]; i++) {
        var pos = _imports_positions[i];
        // source is false (sync) or undefined (async) if the source file fails 
        // to download
        if (res.source) {
          inlineResource(res, pos);
        }
      }
    }

    function parse(async, nesting) {
      this.ast = this.source.ast = parser.parse(this.source.text);
      var imports = this.source.ast.body.filter(function(elem, i) {
        if (elem.type == 'ImportStatement') {
          _imports_positions.push(i);
          return true;
        }
        return false;
      });
      imports.forEach(function(imp) {
        addResource(imp.uri.content, async, nesting + 1); 
      });
    }

    function injectResource(id, text) {
      var res = new Resource(id, ctx, parser);
      var source = new Source(id, text);
      res.source = source;
      source.ast = parser.parse(source.text);
      this.resources.push(res);
      _imports_positions.push(0);
    }

    function relativeToSelf(url) {
      var dirname = self.source.url.split('/').slice(0, -1).join('/');
      if (url[0] == '/') {
        return url;
      } else if (dirname) {
        // strip the trailing slash if present
        if (dirname[dirname.length - 1] == '/') {
          dirname = dirname.slice(0, dirname.length - 1);
        }
        return dirname + '/' + url;
      } else {
        return './' + url;
      }
    }

    function loadSourceAsync(uri, attempt) {
      var loaded = when.defer();
      var url = resolveURI(uri, ctx.settings.locales[0], ctx.settings.schemes[attempt]);
      if (self.source) {
        url = relativeToSelf(url);
      }
      //url = L20n.env.getURL(url, true);
      IO.loadAsync(url).then(
        function loadResource_success(text) {
          var source = new Source(url, text);
          loaded.resolve(source);
        },
        function loadResource_failure() {
          if (ctx.settings.schemes.length >= attempt+1) {
            loadSourceAsync(uri, attempt+1).then(
              function(source) {
                return loaded.resolve(source);
              },
              function() {
                return loaded.resolve();
              }
            );
          } else {
            return loaded.resolve();
          }
        }
      );
      return loaded.promise;
    }

    function loadSourceSync(uri, attempt) {
      var url = resolveURI(uri, ctx.settings.locales[0], ctx.settings.schemes[attempt]);
      if (self.source) {
        url = relativeToSelf(url);
      }
      //url = L20n.env.getURL(url, false);
      var text = null;
      if (ctx.settings.schemes.length >= attempt+1 ||
          (ctx.settings.schemes.length === 0 && attempt === 0)) {
        text = IO.loadSync(url);
        if (text) {
          var source = new Source(url, text);
          return source;
        } else {
          return loadSourceSync(uri, attempt+1);
        }
      }
      return false;
    }

    function addResource(uri, async, nesting) {
      if (nesting > 7) {
        return false;
      }
      var res = new Resource(uri, ctx, parser);
      self.resources.push(res);
      if (async) {
        var parsed = when.defer();
        _resources_parsed.push(parsed);
        loadSourceAsync(uri, 0).then(
            function(source) {
              if (source) {
                res.source = source;
                res.parse(true, nesting);
              }
            }
          ).then(
            function() {
              parsed.resolve(res);
            }
          );
      } else {
        res.source = loadSourceSync(uri, 0);
        res.parse(false, nesting);
      }
    }

    function build() {
      var merged = when.defer();
      when.all(_resources_parsed).then(
        function() {
          var imports_built = [];
          self.resources.forEach(function(res) {
            imports_built.push(res.build());
          });
          when.all(imports_built).then(
            function() {
              merge();
              self.isReady = true;
              return merged.resolve();
            }
          );
        });
      return merged.promise;
    }

  }

  function Context(id, parentContext) {

    this.ContextError = ContextError;
    this.data = {};
    this.isFrozen = null;
    this.isReady = null;

    this.injectResource = injectResource;
    this.addResource = addResource;
    this.freeze = freeze;

    this.get = get;
    this.getEntity = getEntity;
    this.getAttribute = getAttribute;
    this.getMany = getMany;
    this.getEntities = null;

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    var _isFrozen = false;
    var _emitter = new L20n.EventEmitter();
    var _parser = new L20n.Parser(L20n.EventEmitter);
    var _compiler = new L20n.Compiler(L20n.EventEmitter, L20n.Parser);
    var _resource = new Resource(null, this, _parser);
    var _entries = {};
    var _ctxdata = {};
    var _globals = {};
    var _listeners = [];
    var _subContext = null;
    var _settings = {
      'locales': [],
      'schemes': [],
      'timeout': 500,
    };

    _parser.addEventListener('error', echo);
    _compiler.addEventListener('error', echo);

    function get(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity) {
        emit('Missing entity', id);
        return getFromSubContext(id, data);
      }
      var args = getArgs(data);
      try {
        return entity.toString(args);
      } catch (e) {
        emit('Entity could not be resolved', id);
        return getFromSubContext(id, data, e.source);
      }
    }

    function getFromSubContext(id, data, fallback) {
      var sc = getSubContext();
      var val = null;
      if (sc) {
        val = sc.get(id, data);
      } else {
        emit('No more locale fallbacks', id);
      }
      if (parentContext || val !== null) {
        return val;
      }
      return fallback ? fallback : id;
    }

    function getArgs(data) {
      var args = Object.create(_ctxdata);
      if (data) {
        for (var i in data) {
          args[i] = data[i];
        }
      }
      return args;
    }

    function resolveMany(ids, data) {
      var values = {};
      for (var i in ids) {
        values[ids[i]] = get(ids[i], data);
      }
      return values;
    }

    function getMany(ids, data) {
      var deferred = when.defer();
      if (_resource.isReady) {
        var values = resolveMany(ids, data);
        deferred.resolve(values);
      } else {
        setTimeout(function() {
          deferred.reject();
        }, 500);
        self.addEventListener('ready', function() {
          var values = resolveMany(ids, data);
          deferred.resolve(values);
        });
      }
      return deferred.promise;
    }

    function getAttribute(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
      if (!entity || entity.local) {
        throw "No such entity: " + id;
      }
      var attribute = entity.attributes[attr]
      if (!attribute || attribute.local) {
        throw "No such attribute: " + attr;
      }
      var args = getArgs(data);
      return attribute.toString(args);
    }

    function getEntity(id, data) {
      if (!_resource.isReady) {
        throw "Error: context not ready";
      }
      var entity = _entries[id];
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
      return {
        value: entity.toString(args),
        attributes: attributes
      };
    }

    function injectResource(id, text) {
      _resource.injectResource(id, text);
      return this;
    }

    function addResource(uri, async) {
      if (async === undefined) {
        async = true;
      }
      _resource.addResource(uri, async, 0);
      return this;
    }

    function freeze() {
      _isFrozen = true;
      _resource.build().then(
        function freeze_success() {
          _entries = _compiler.compile(_resource.ast);
          _emitter.emit('ready');
        }
      );
      return this;
    }

    function getSubContext() {
      if (_settings.locales.length < 2) {
        return null;
      }
      if (_subContext === null) {
        _subContext = new Context(null, self);
        _subContext.settings.locales = _settings.locales.slice(1);
        _subContext.addEventListener('error', echo);
        if (_settings.schemes.length) {
          _subContext.settings.schemes = _settings.schemes;
        }
        for (var i in _resource.resources) {
          if (_resource.resources[i].id === null) {
            _subContext.injectResource(null, _resource.resources[i].source.text);
          } else {
            _subContext.addResource(_resource.resources[i].id, false);
          }
        }
        _subContext.freeze();
      }
      return _subContext;
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

    function emit(msg, id) {
      _emitter.emit('error', new ContextError(msg, id, _settings.locales[0]));
    }

    this.__defineSetter__('data', function(data) {
      _ctxdata = data;
    });

    this.__defineGetter__('data', function() {
      return _ctxdata;
    });

    Object.defineProperty(this, 'settings', {
      value: Object.create(Object.prototype, {
        locales: {
          get: function() { return _settings.locales },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Locales must be a list";
            }
            if (val.length == 0) {
              throw "Locales list must not be empty";
            }
            if (_settings.locales.length > 0) {
              throw "Can't overwrite locales";
            }
            _settings.locales = val;
            Object.freeze(_settings.locales);
          },
          configurable: false,
          enumerable: true,
        },
        schemes: {
          get: function() { return _settings.schemes },
          set: function(val) {
            if (!Array.isArray(val)) {
              throw "Schemes must be a list";
            }
            if (val.length == 0) {
              throw "Scheme list must not be empty";
            }
            if (_settings.schemes.length > 0) {
              throw "Can't overwrite schemes";
            }
            _settings.schemes = val;
            Object.freeze(_settings.schemes);
          },
          configurable: false,
          enumerable: true,
        },
        timeout: {
          get: function() { return _settings.timeout },
          set: function(val) {
            if (typeof(val) !== 'number') {
              throw "Timeout must be a number";
            }
            _settings.timeout = val;
          },
          configurable: false,
          enumerable: true,
        },
      }),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  };
  
  function _expandUrn(urn, vars) {
    return urn.replace(/(\{\{\s*(\w+)\s*\}\})/g,
        function(match, p1, p2, offset, string) {
          if (vars.hasOwnProperty(p2)) {
            return vars[p2];
          } else {
            throw "Cannot use the undefined variable: "+p2;
          }
          return p1;
        });
  }

  function resolveURI(uri, locale, scheme) {
    if (!/^l10n:/.test(uri)) {
      return uri;
    }
    var match = uri.match(/^l10n:(?:([^:]+):)?([^:]+)/);
    var res, app;
    if (match === null) {
      throw "Malformed resource scheme: " + uri;
    }
    if (match[2] && match[2][0] == '/' && match[2][1] == '/') {
      res = match[0].substring(5);
      app = '';
    } else {
      res = match[2];
      app = match[1];
    }
    var vars = {
      'app': app,
      'resource': res
    };
    if (locale) {
      vars['locale'] = locale;
    }
    if (!scheme) {
      if (app) {
        throw "You need to define schemes to use with app uris";
      }
      return _expandUrn(res, vars);
    }
    return _expandUrn(scheme, vars);
  }

  /* ContextError class */

  function ContextError(message, id, locale) {
    this.name = 'ContextError';
    this.id = id;
    this.locale = locale;
    this.message = message + ', locale: '+locale+', id: '+id;
  }
  ContextError.prototype = Object.create(Error.prototype);
  ContextError.prototype.constructor = ContextError;

  this.L20n = L20n;

}).call(this);
(function() {
  'use strict';

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

  if (typeof exports !== 'undefined') {
    exports.EventEmitter = EventEmitter;
  } else if (this.L20n) {
    this.L20n.EventEmitter = EventEmitter;
  } else {
    this.L20nEventEmitter = EventEmitter;
  }
}).call(this);
(function() {
  'use strict';

  function Parser(Emitter) {

    /* Public */

    this.parse = parse;
    this.parseString = parseString;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;

    this.Error = ParserError;

    /* Private */

    var _source, _index, _length, _emitter;

    /* Depending on if we have emitter choose prop getLOL method */
    var getLOL;
    if (Emitter) {
      _emitter = new Emitter();
      getLOL = getLOLWithRecover;
    } else {
      getLOL = getLOLPlain;
    }

    function getComment() {
      _index += 2;
      var start = _index;
      var end = _source.indexOf('*/', start);
      if (end === -1) {
        throw error('Comment without closing tag');
      }
      _index = end + 2;
      return {
        type: 'Comment',
        content: _source.slice(start, end)
      };
    }

    function getAttributes() {
      var attrs = [];
      var attr, ws1, ch;
 
      while (true) {
        attr = getKVPWithIndex();
        attr.local = attr.key.name.charAt(0) === '_';
        attrs.push(attr);
        ws1 = getRequiredWS();
        ch = _source.charAt(_index);
        if (ch === '>') {
          break;
        } else if (!ws1) {
          throw error('Expected ">"');
        }
      }
      return attrs;
    }

    function getKVP(type) {
      var key = getIdentifier();
      getWS();
      if (_source.charAt(_index) !== ':') {
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: type,
        key: key,
        value: getValue()
      };
    }

    function getKVPWithIndex(type) {
      var key = getIdentifier();
      var index = [];

      if (_source.charAt(_index) === '[') {
        ++_index;
        getWS();
        index = getItemList(getExpression, ']');
      }
      getWS();
      if (_source.charAt(_index) !== ':') {
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: type,
        key: key,
        value: getValue(),
        index: index
      };
    }


    function getArray() {
      ++_index;
      return {
        type: 'Array',
        content: getItemListSoftTrailComma(getValue, ']')
      };
    }

    function getHash() {
      ++_index;
      getWS();
      if (_source.charAt(_index) === '}') {
        ++_index;
        return {
          type: 'Hash',
          content: []
        };
      }

      var defItem, hi, comma, hash = [];
      while (true) {
        defItem = false;
        if (_source.charAt(_index) === '*') {
          ++_index;
          if (defItem) {
            throw error('Default item redefinition forbidden');
          }
          defItem = true;
        }
        hi = getKVP('HashItem');
        hi['default'] = defItem;
        hash.push(hi);
        getWS();

        comma = _source.charAt(_index) === ',';
        if (comma) {
          ++_index;
          getWS();
        }
        if (_source.charAt(_index) === '}') {
          ++_index;
          break;
        }
        if (!comma) {
          throw error('Expected "}"');
        }
      }
      return {
        type: 'Hash',
        content: hash
      };
    }

    function getString(opchar) {
      var len = opchar.length;
      var start = _index + len;

      var close = _source.indexOf(opchar, start);
      // we look for a closing of the string here
      // and then we check if it's preceeded by '\'
      // 92 == '\'
      while (close !== -1 &&
             _source.charCodeAt(close - 1) === 92 &&
             _source.charCodeAt(close - 2) !== 92) {
        close = _source.indexOf(opchar, close + len);
      }
      if (close === -1) {
        throw error('Unclosed string literal');
      }
      var str = _source.slice(start, close);

      _index = close + len;
      return {
        type: 'String',
        content: str
      };
    }

    function getValue(optional, ch) {
      if (ch === undefined) {
        ch = _source.charAt(_index);
      }
      if (ch === "'" || ch === '"') {
        if (ch === _source.charAt(_index + 1) && ch === _source.charAt(_index + 2)) {
          return getString(ch + ch + ch);
        }
        return getString(ch);
      }
      if (ch === '{') {
        return getHash();
      }
      if (ch === '[') {
        return getArray();
      }
      if (!optional) {
        throw error('Unknown value type');
      }
      return null;
    }


    function getRequiredWS() {
      var pos = _index;
      var cc = _source.charCodeAt(pos);
      // space, \n, \t, \r
      while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
        cc = _source.charCodeAt(++_index);
      }
      return _index !== pos;
    }

    function getWS() {
      var cc = _source.charCodeAt(_index);
      // space, \n, \t, \r
      while (cc === 32 || cc === 10 || cc === 9 || cc === 13) {
        cc = _source.charCodeAt(++_index);
      }
    }

    function getVariable() {
      ++_index;
      return {
        type: 'VariableExpression',
        id: getIdentifier()
      };
    }

    function getIdentifier() {
      var index = _index;
      var start = index;
      var source = _source;
      var cc = source.charCodeAt(start);

      // a-zA-Z_
      if ((cc < 97 || cc > 122) && (cc < 65 || cc > 90) && cc !== 95) {
        // "~"
        if (cc === 126) {
          _index += 1;
          return {
            type: 'ThisExpression'
          };
        } else {
          throw error('Identifier has to start with [a-zA-Z]');
        }
      }

      cc = source.charCodeAt(++index);
      while ((cc >= 95 && cc <= 122) || // a-z
             (cc >= 65 && cc <= 90) ||  // A-Z
             (cc >= 48 && cc <= 57) ||  // 0-9
             cc === 95) {               // _
        cc = source.charCodeAt(++index);
      }
      _index += index - start;
      return {
        type: 'Identifier',
        name: source.slice(start, index)
      };
    }

    function getImportStatement() {
      _index += 6;
      if (_source.charAt(_index) !== '(') {
        throw error('Expected "("');
      }
      ++_index;
      getWS();
      var uri = getString(_source.charAt(_index));
      getWS();
      if (_source.charAt(_index) !== ')') {
        throw error('Expected ")"');
      }
      ++_index;
      return {
        type: 'ImportStatement',
        uri: uri
      };
    }

    function getMacro(id) {
      if (id.name.charAt(0) === '_') {
        throw error('Macro ID cannot start with "_"');
      }
      ++_index;
      var idlist = getItemList(getVariable, ')');
      getRequiredWS();

      if (_source.charAt(_index) !== '{') {
        throw error('Expected "{"');
      }
      ++_index;
      getWS();
      var exp = getExpression();
      getWS();
      if (_source.charAt(_index) !== '}') {
        throw error('Expected "}"');
      }
      ++_index;
      getWS();
      if (_source.charCodeAt(_index) !== 62) {
        throw error('Expected ">"');
      }
      ++_index;
      return {
        type: 'Macro',
        id: id,
        args: idlist,
        expression: exp,
      };
    }

    function getEntity(id, index) {
      if (!getRequiredWS()) {
        throw error('Expected white space');
      }

      var ch = _source.charAt(_index);
      var value = getValue(true, ch);
      var attrs = null;
      if (value === null) {
        if (ch !== '>') {
          attrs = getAttributes();
        } else {
          throw error('Expected ">"');
        }
      } else {
        var ws1 = getRequiredWS();
        if (_source.charAt(_index) !== '>') {
          if (!ws1) {
            throw error('Expected ">"');
          }
          attrs = getAttributes();
        }
      }
      getWS();

      // skip '>'
      ++_index;
      return {
        type: 'Entity',
        id: id,
        value: value,
        index: index,
        attrs: attrs,
        local: (id.name.charCodeAt(0) === 95) // _
      };
    }

    function getEntry() {
      var cc = _source.charCodeAt(_index);

      // 60 == '<'
      if (cc === 60) {
        ++_index;
        var id = getIdentifier();
        cc = _source.charCodeAt(_index);
        // 40 == '('
        if (cc === 40) {
          return getMacro(id);
        }
        // 91 == '['
        if (cc === 91) {
          ++_index;
          return getEntity(id,
                           getItemList(getExpression, ']'));
        }
        return getEntity(id, []);
      }
      // 47, 42 == '/*'
      if (_source.charCodeAt(_index) === 47 &&
                 _source.charCodeAt(_index + 1) === 42) {
        return getComment();
      }
      if (_source.slice(_index, _index + 6) === 'import') {
        return getImportStatement();
      }
      throw error('Invalid entry');
    }

    function getComplexString() {
      /*
       * This is a very complex function, sorry for that
       *
       * It basically parses a string looking for:
       *   - expression openings: {{
       *   - escape chars: \
       * 
       * And if it finds any it deals with them.
       * The result is quite fast, except for getExpression which as
       * of writing does a poor job at nesting many functions in order
       * to get to the most common type - Identifier.
       *
       * We can fast path that, we can rewrite expression engine to minimize
       * function nesting or we can wait for engines to become faster.
       *
       * For now, it's fast enough :)
       */
      var nxt;                    // next char in backslash case
      var body;                   // body of a complex string
      var bstart = _index;        // buffer start index
      var complex = false;

      // unescape \\ \' \" \{{
      var pos = _source.indexOf('\\');
      while (pos !== -1) {
        nxt = _source.charAt(pos + 1);
        if (nxt == '"' ||
            nxt == "'" ||
            nxt == '\\') {
          _source = _source.substr(0, pos) + _source.substr(pos + 1);
        }
        pos = _source.indexOf('\\', pos + 1);
      }

      // parse expressions
      pos = _source.indexOf('{{');
      while (pos !== -1) {
        // except if the expression is prefixed with \
        // in that case skip it
        if (_source.charCodeAt(pos - 1) === 92) {
          _source = _source.substr(0, pos - 1) + _source.substr(pos);
          pos = _source.indexOf('{{', pos + 2);
          continue;
        }
        if (!complex) {
          body = [];
          complex = true;
        }
        if (bstart < pos) {
          body.push({
            type: 'String',
            content: _source.slice(bstart, pos)
          });
        }
        _index = pos + 2;
        getWS();
        body.push(getExpression());
        getWS();
        if (_source.charCodeAt(_index) !== 125 &&
            _source.charCodeAt(_index+1) !== 125) {
          throw error('Expected "}}"');
        }
        pos = _index + 2;
        bstart = pos;
        pos = _source.indexOf('{{', pos);
      }

      // if complexstring is just one string, return it instead
      if (!complex) {
        return {
          type: 'String',
          content: _source
        };
      }

      // if there's leftover string we pick it
      if (bstart < _length) {
        body.push({
          type: 'String',
          content: _source.slice(bstart)
        });
      }
      return {
        type: 'ComplexString',
        content: body
      };
    }

    function getLOLWithRecover() {
      var entries = [];

      getWS();
      while (_index < _length) {
        try {
          entries.push(getEntry());
        } catch (e) {
          if (e instanceof ParserError) {
            _emitter.emit('error', e);
            entries.push(recover());
          } else {
            throw e;
          }
        }
        if (_index < _length) {
          getWS();
        }
      }

      return {
        type: 'LOL',
        body: entries
      };
    }

    function getLOLPlain() {
      var entries = [];

      getWS();
      while (_index < _length) {
        entries.push(getEntry());
        if (_index < _length) {
          getWS();
        }
      }

      return {
        type: 'LOL',
        body: entries
      };
    }

    /* Public API functions */

    function parseString(string) {
      _source = string;
      _index = 0;
      _length = _source.length;
      return getComplexString();
    }

    function parse(string) {
      _source = string;
      _index = 0;
      _length = _source.length;

      return getLOL();
    }

    function addEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.removeEventListener(type, listener);
    }

    /* Expressions */

    function getExpression() {
      return getConditionalExpression();
    }

    function getPrefixExpression(token, cl, op, nxt) {
      var exp = nxt();
      var t, ch;
      while (true) {
        t = '';
        getWS();
        ch = _source.charAt(_index);
        if (token[0].indexOf(ch) === -1) {
          break;
        }
        t += ch;
        ++_index;
        if (token.length > 1) {
          ch = _source.charAt(_index);
          if (token[1] == ch) {
            ++_index;
            t += ch;
          } else if (token[2]) {
            --_index;
            return exp;
          }
        }
        getWS();
        exp = {
          type: cl,
          operator: {
            type: op,
            token: t
          },
          left: exp,
          right: nxt()
        };
      }
      return exp;
    }

    function getPostfixExpression(token, cl, op, nxt) {
      var cc = _source.charCodeAt(_index);
      if (token.indexOf(cc) === -1) {
        return nxt();
      }
      ++_index;
      getWS();
      return {
        type: cl,
        operator: {
          type: op,
          token: String.fromCharCode(cc)
        },
        argument: getPostfixExpression(token, cl, op, nxt)
      };
    }

    function getConditionalExpression() {
      var exp = getOrExpression();
      getWS();
      if (_source.charCodeAt(_index) !== 63) { // ?
        return exp;
      }
      ++_index;
      getWS();
      var consequent = getExpression();
      getWS();
      if (_source.charCodeAt(_index) !== 58) { // :
        throw error('Expected ":"');
      }
      ++_index;
      getWS();
      return {
        type: 'ConditionalExpression',
        test: exp,
        consequent: consequent,
        alternate: getExpression()
      };
    }

    function getOrExpression() {
      return getPrefixExpression([['|'], '|', true],
                                 'LogicalExpression',
                                 'LogicalOperator',
                                 getAndExpression);
    }

    function getAndExpression() {
      return getPrefixExpression([['&'], '&', true],
                                 'LogicalExpression',
                                 'Logicalperator',
                                 getEqualityExpression);
    }

    function getEqualityExpression() {
      return getPrefixExpression([['='], '=', true],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getRelationalExpression);
    }

    function getRelationalExpression() {
      return getPrefixExpression([['<', '>'], '=', false],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getAdditiveExpression);
    }

    function getAdditiveExpression() {
      return getPrefixExpression([['+', '-']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getModuloExpression);
    }

    function getModuloExpression() {
      return getPrefixExpression([['%']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getMultiplicativeExpression);
    }

    function getMultiplicativeExpression() {
      return getPrefixExpression([['*']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getDividiveExpression);
    }

    function getDividiveExpression() {
      return getPrefixExpression([['/']],
                                 'BinaryExpression',
                                 'BinaryOperator',
                                 getUnaryExpression);
    }

    function getUnaryExpression() {
      return getPostfixExpression([43, 45, 33], // + - !
                                  'UnaryExpression',
                                  'UnaryOperator',
                                  getMemberExpression);
    }

    function getCallExpression(callee) {
      getWS();
      return {
        type: 'CallExpression',
        callee: callee,
        arguments: getItemList(getExpression, ')')
      };
    }

    function getAttributeExpression(idref, computed) {
      if (idref.type !== 'ParenthesisExpression' &&
          idref.type !== 'CallExpression' &&
          idref.type !== 'Identifier' &&
          idref.type !== 'ThisExpression') {
        throw error('AttributeExpression must have Identifier, This, Call or Parenthesis as left node');
      }
      var exp;
      if (computed) {
        getWS();
        exp = getExpression();
        getWS();
        if (_source.charAt(_index) !== ']') {
          throw error('Expected "]"');
        }
        ++_index;
        return {
          type: 'AttributeExpression',
          expression: idref,
          attribute: exp,
          computed: true
        };
      }
      exp = getIdentifier();
      return {
        type: 'AttributeExpression',
        expression: idref,
        attribute: exp,
        computed: false
      };
    }

    function getPropertyExpression(idref, computed) {
      var exp;
      if (computed) {
        getWS();
        exp = getExpression();
        getWS();
        if (_source.charAt(_index) !== ']') {
          throw error('Expected "]"');
        }
        ++_index;
        return {
          type: 'PropertyExpression',
          expression: idref,
          property: exp,
          computed: true
        };
      }
      exp = getIdentifier();
      return {
        type: 'PropertyExpression',
        expression: idref,
        property: exp,
        computed: false
      };
    }

    function getMemberExpression() {
      var exp = getParenthesisExpression();
      var cc;

      // 46: '.'
      // 40: '('
      // 91: '['
      while (true) {
        cc = _source.charCodeAt(_index);
        if (cc === 46) {
          ++_index;
          var cc2 = _source.charCodeAt(_index);
          if (cc2 === 46 || cc2 == 91) {
            ++_index;
            exp = getAttributeExpression(exp, cc2 === 91);
          } else {
            exp = getPropertyExpression(exp, false);
          }
        } else if (cc === 91) {
          ++_index;
          exp = getPropertyExpression(exp, true);
        } else if (cc === 40) {
          ++_index;
          exp = getCallExpression(exp);
        } else {
          break;
        }
      }
      return exp;
    }

    function getParenthesisExpression() {
      // 40 == (
      if (_source.charCodeAt(_index) === 40) {
        ++_index;
        getWS();
        var pexp = {
          type: 'ParenthesisExpression',
          expression: getExpression()
        };
        getWS();
        if (_source.charCodeAt(_index) !== 41) {
          throw error('Expected ")"');
        }
        ++_index;
        return pexp;
      }
      return getPrimaryExpression();
    }

    function getPrimaryExpression() {
      var pos = _index;
      var cc = _source.charCodeAt(pos);
      // number
      while (cc > 47 && cc < 58) {
        cc = _source.charCodeAt(++pos);
      }
      if (pos > _index) {
        var start = _index;
        _index = pos;
        return {
          type: 'Number',
          value: parseInt(_source.slice(start, pos), 10)
        };
      }

      // value: '"{[
      if (cc === 39 || cc === 34 || cc === 123 || cc === 91) {
        return getValue();
      }

      // variable: $
      if (cc === 36) {
        return getVariable();
      }

      // globals: @
      if (cc === 64) {
        ++_index;
        return {
          type: 'GlobalsExpression',
          id: getIdentifier()
        };
      }
      return getIdentifier();
    }

    /* helper functions */

    function getItemList(callback, closeChar) {
      var ch;
      getWS();
      if (_source.charAt(_index) === closeChar) {
        ++_index;
        return [];
      }

      var items = [];

      while (true) {
        items.push(callback());
        getWS();
        ch = _source.charAt(_index);
        if (ch === ',') {
          ++_index;
          getWS();
        } else if (ch === closeChar) {
          ++_index;
          break;
        } else {
          throw error('Expected "," or "' + closeChar + '"');
        }
      }
      return items;
    }

    function getItemListSoftTrailComma(callback, closeChar) {
      getWS();
      if (_source.charAt(_index) === closeChar) {
        ++_index;
        return [];
      }

      var items = [];
      var comma;

      while (true) {
        items.push(callback());
        getWS();

        comma = _source.charAt(_index) === ',';

        if (comma) {
          ++_index;
          getWS();
        }
        if (_source.charAt(_index) === closeChar) {
          ++_index;
          break;
        }
        if (!comma) {
          throw error('Expected "' + closeChar + '"');
        }
      }
      return items;
    }

    function error(message, pos) {
      if (pos === undefined) {
        pos = _index;
      }
      var start = _source.lastIndexOf('<', pos - 1);
      var lastClose = _source.lastIndexOf('>', pos - 1);
      start = lastClose > start ? lastClose + 1 : start;
      var context = _source.slice(start, pos + 10);

      var msg = message + ' at pos ' + pos + ': "' + context + '"';
      return new ParserError(msg, pos, context);
    }

    // This code is being called whenever we
    // hit ParserError.
    //
    // The strategy here is to find the closest entry opening
    // and skip forward to it.
    //
    // It may happen that the entry opening is in fact part of expression,
    // but this should just trigger another ParserError on the next char
    // and we'll have to scan for entry opening again until we're successful
    // or we run out of entry openings in the code.
    function recover() {
      var opening = _source.indexOf('<', _index);
      var junk;
      if (opening === -1) {
        junk = {
          'type': 'JunkEntry',
          'content': _source.slice(_index)
        };
        _index = _length;
        return junk;
      }
      junk = {
        'type': 'JunkEntry',
        'content': _source.slice(_index, opening)
      };
      _index = opening;
      return junk;
    }
  }

  /* ParserError class */

  function ParserError(message, pos, context) {
    this.name = 'ParserError';
    this.message = message;
    this.pos = pos;
    this.context = context;
  }
  ParserError.prototype = Object.create(Error.prototype);
  ParserError.prototype.constructor = ParserError;

  /* Expose the Parser constructor */

  if (typeof exports !== 'undefined') {
    exports.Parser = Parser;
  } else if (this.L20n) {
    this.L20n.Parser = Parser;
  } else {
    this.L20nParser = Parser;
  }
}).call(this);
// This is L20n's on-the-fly compiler.  It takes the AST produced by the parser 
// and uses it to create a set of JavaScript objects and functions representing 
// entities and macros and other expressions.
//
// The module defines a `Compiler` singleton with a single method: `compile`.
// The result of the compilation is stored on the `entries` object passed as 
// the second argument to the `compile` function.  The third argument is 
// `globals`, an object whose properties provide information about the runtime 
// environment, e.g., the current hour, operating system etc.
//
// Main concepts
// -------------
//
// **Entities** and **attributes** are objects which are publicly available.  
// Their `toString` method is designed to be used by the L20n context to get 
// a string value of the entity, given the context data passed to the method.
//
// All other symbols defined by the grammar are implemented as expression 
// functions.  The naming convention is:
//
//   - capitalized first letters denote **expressions constructors**, e.g.
//   `PropertyExpression`.
//   - camel-case denotes **expression functions** returned by the 
//   constructors, e.g. `propertyExpression`.
//
// ### Constructors
//
// The constructor is called for every node in the AST.  It stores the 
// components of the expression which are constant and do not depend on the 
// calling context (an example of the latter would be the data passed by the 
// developer to the `toString` method).
// 
// ### Expression functions
//
// The constructor, when called, returns an expression function, which, in 
// turn, is called every time the expression needs to be evaluated.  The 
// evaluation call is context-dependend.  Every expression function takes two 
// mandatory arguments and one optional one:
//
// - `locals`, which stores the information about the currently evaluated 
// entity (`locals.__this__`).  It also stores the arguments passed to macros.
// - `ctxdata`, which is an object with data passed to the context by the 
// developer.  The developer can define data on the context, or pass it on 
// a per-call basis.
// - `key` (optional), which is a number or a string passed to an 
// `ArrayLiteral` or a `HashLiteral` expression denoting the member of the 
// array or the hash to return.  The member will be another expression function 
// which can then be evaluated further.
//
//
// Bubbling up the new _current_ entity
// ------------------------------------
//
// Every expression function returns an array [`newLocals`, `evaluatedValue`].
// The reason for this, and in particular for returning `newLocals`, is 
// important for understanding how the compiler works.
//
// In most of the cases. `newLocals` will be the same as the original `locals` 
// passed to the expression function during the evaluation call.  In some 
// cases, however, `newLocals.__this__` will reference a different entity than 
// `locals.__this__` did.  On runtime, as the compiler traverses the AST and 
// goes deeper into individual branches, when it hits an `identifier` and 
// evaluates it to an entity, it needs to **bubble up** this find back to the 
// top expressions in the chain.  This is so that the evaluation of the 
// top-most expressions in the branch (root being at the very top of the tree) 
// takes into account the new value of `__this__`.
//
// To illustrate this point, consider the following example.
//
// Two entities, `brandName` and `about` are defined as such:
// 
//     <brandName {
//       short: "Firefox",
//       long: "Mozilla {{ ~ }}"
//     }>
//     <about "About {{ brandName.long }}">
//
// Notice two `complexString`s: `about` references `brandName.long`, and 
// `brandName.long` references its own entity via `~`.  This `~` (meaning, the 
// current entity) must always reference `brandName`, even when called from 
// `about`.
//
// The AST for the `about` entity looks like this:
//
//     [Entity]
//       .id[Identifier]
//         .name[unicode "about"]
//       .index
//       .value[ComplexString]                      <1>
//         .content
//           [String]                               <2>
//             .content[unicode "About "]
//           [PropertyExpression]                   <3>
//             .expression[Identifier]              <4>
//               .name[unicode "brandName"]
//             .property[Identifier]
//               .name[unicode "long"]
//             .computed[bool=False]
//       .attrs
//       .local[bool=False]
//
// During the compilation the compiler will walk the AST top-down to the 
// deepest terminal leaves and will use expression constructors to create 
// expression functions for the components.  For instance, for `about`'s value, 
// the compiler will call `ComplexString()` to create an expression function 
// `complexString` <1> which will be assigned to the entity's value. The 
// `ComplexString` construtor, before it returns the `complexString` <1>, will 
// in turn call other expression constructors to create `content`: 
// a `stringLiteral` and a `propertyExpression`.  The `PropertyExpression` 
// contructor will do the same, etc...
//
// When `entity.toString(ctxdata)` is called by a third-party code, we need to 
// resolve the whole `complexString` <1> to return a single string value.  This 
// is what **resolving** means and it involves some recursion.  On the other 
// hand, **evaluating** means _to call the expression once and use what it 
// returns_.
// 
// `toString` sets `locals.__this__` to the current entity, `about` and tells 
// the `complexString` <1> to _resolve_ itself.
//
// In order to resolve the `complexString` <1>, we start by resolving its first 
// member <2> to a string.  As we resolve deeper down, we bubble down `locals` 
// set by `toString`.  The first member of `content` turns out to simply be 
// a string that reads `About `.
//
// On to the second member, the propertyExpression <3>.  We bubble down 
// `locals` again and proceed to evaluate the `expression` field, which is an 
// `identifier`.  Note that we don't _resolve_ it to a string; we _evaluate_ it 
// to something that can be further used in other expressions, in this case, an 
// **entity** called `brandName`.
//
// Had we _resolved_ the `propertyExpression`, it would have resolve to 
// a string, and it would have been impossible to access the `long` member.  
// This leads us to an important concept:  the compiler _resolves_ expressions 
// when it expects a primitive value (a string, a number, a bool).  On the 
// other hand, it _evaluates_ expressions (calls them only once) when it needs 
// to work with them further, e.g. in order to access a member of the hash.
//
// This also explains why in the above example, once the compiler hits the 
// `brandName` identifier and changes the value of `locals.__this__` to the 
// `brandName` entity, this value doesn't bubble up all the way up to the 
// `about` entity.  All components of any `complexString` are _resolved_ by 
// the compiler until a primitive value is returned.  This logic lives in the 
// `_resolve` function.

//
// Inline comments
// ---------------
//
// Isolate the code by using an immediately-invoked function expression.
// Invoke it via `(function(){ ... }).call(this)` so that inside of the IIFE, 
// `this` references the global object.
(function() {
  'use strict';

  function Compiler(Emitter, Parser) {

    // Public

    this.compile = compile;
    this.setGlobals = setGlobals;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.reset= reset;

    this.Error = CompilerError;
    this.CompilationError = CompilationError;
    this.RuntimeError = RuntimeError;
    this.ValueError = ValueError;
    this.IndexError = IndexError;

    // Private

    var _emitter = Emitter ? new Emitter() : null;
    var _parser = Parser ? new Parser() : null;
    var _env = {};
    var _globals;

    // Public API functions

    function compile(ast) {
      _env = {};
      var types = {
        Entity: Entity,
        Macro: Macro,
      };
      for (var i = 0, entry; entry = ast.body[i]; i++) {
        var constructor = types[entry.type];
        if (constructor) {
          try {
            _env[entry.id.name] = new constructor(entry);
          } catch (e) {
            // rethrow non-compiler errors;
            requireCompilerError(e);
            // or, just ignore the error;  it's been already emitted
          }
        }
      }
      return _env;
    }

    function setGlobals(globals) {
      _globals = globals;
      return true;
    }

    function addEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.addEventListener(type, listener);
    }

    function removeEventListener(type, listener) {
      if (!_emitter) {
        throw Error("Emitter not available");
      }
      return _emitter.removeEventListener(type, listener);
    }

    // reset the state of a compiler instance; used in tests
    function reset() {
      _env = {};
      _globals = {};
      return this;
    }

    // utils

    function emit(ctor, message, entry, source) {
      var e = new ctor(message, entry, source);
      if (_emitter) {
        _emitter.emit('error', e);
      }
      return e;
    }


    // The Entity object.
    function Entity(node) {
      this.id = node.id.name;
      this.local = node.local || false;
      this.index = [];
      this.attributes = {};
      var i;
      for (i = 0; i < node.index.length; i++) {
        this.index.push(Expression(node.index[i], this));
      }
      for (i = 0; i < node.attrs.length; i++) {
        var attr = node.attrs[i];
        this.attributes[attr.key.name] = new Attribute(attr, this);
      }
      this.value = Expression(node.value, this, this.index);
    }
    // Entities are wrappers around their value expression.  _Yielding_ from 
    // the entity is identical to _evaluating_ its value with the appropriate 
    // value of `locals.__this__`.  See `PropertyExpression` for an example 
    // usage.
    Entity.prototype._yield = function E_yield(ctxdata, key) {
      var locals = {
        __this__: this,
      };
      return this.value(locals, ctxdata, key);
    };
    // Calling `entity._resolve` will _resolve_ its value to a primitive value.  
    // See `ComplexString` for an example usage.
    Entity.prototype._resolve = function E_resolve(ctxdata) {
      var locals = {
        __this__: this,
      };
      return _resolve(this.value, locals, ctxdata);
    };
    // `toString` is the only method that is supposed to be used by the L20n's 
    // context.
    Entity.prototype.toString = function toString(ctxdata) {
      try {
        return this._resolve(ctxdata);
      } catch (e) {
        requireCompilerError(e);
        // `ValueErrors` are not emitted in `StringLiteral` where they are 
        // created, because if the string in question is being evaluated in an 
        // index, we'll emit an `IndexError` instead.  To avoid duplication, 
        // the `ValueErrors` will only be emitted if it actually made it to 
        // here.  See `HashLiteral` for an example of why it wouldn't make it.
        if (e instanceof ValueError && _emitter) {
          _emitter.emit('error', e);
        }
        throw e;
      }
    };

    function Attribute(node, entity) {
      this.key = node.key.name;
      this.local = node.local || false;
      this.value = Expression(node.value, entity, entity.index);
      this.entity = entity;
    }
    Attribute.prototype._yield = function A_yield(ctxdata, key) {
      var locals = {
        __this__: this.entity,
      };
      return this.value(locals, ctxdata, key);
    };
    Attribute.prototype._resolve = function A_resolve(ctxdata) {
      var locals = {
        __this__: this.entity,
      };
      return _resolve(this.value, locals, ctxdata);
    };
    Attribute.prototype.toString = function toString(ctxdata) {
      return this._resolve(ctxdata);
    };

    function Macro(node) {
      this.id = node.id.name;
      this.local = node.local || false;
      this.expression = Expression(node.expression, this);
      this.args = node.args;
    }
    Macro.prototype._call = function M_call(ctxdata, args) {
      var locals = {
        __this__: this,
      };
      for (var i = 0; i < this.args.length; i++) {
        locals[this.args[i].id.name] = args[i];
      }
      return this.expression(locals, ctxdata);
    }


    var EXPRESSION_TYPES = {
      // Primary expressions.
      'Identifier': Identifier,
      'ThisExpression': ThisExpression,
      'VariableExpression': VariableExpression,
      'GlobalsExpression': GlobalsExpression,

      // Value expressions.
      'Number': NumberLiteral,
      'String': StringLiteral,
      'Array': ArrayLiteral,
      'Hash': HashLiteral,
      'HashItem': Expression,
      'ComplexString': ComplexString,

      // Logical expressions.
      'UnaryExpression': UnaryExpression,
      'BinaryExpression': BinaryExpression,
      'LogicalExpression': LogicalExpression,
      'ConditionalExpression': ConditionalExpression,

      // Member expressions.
      'CallExpression': CallExpression,
      'PropertyExpression': PropertyExpression,
      'AttributeExpression': AttributeExpression,
      'ParenthesisExpression': ParenthesisExpression,
    };

    // The 'dispatcher' expression constructor.  Other expression constructors 
    // call this to create expression functions for their components.  For 
    // instance, `ConditionalExpression` calls `Expression` to create expression 
    // functions for its `test`, `consequent` and `alternate` symbols.
    function Expression(node, entry, index) {
      // An entity can have no value.  It will be resolved to `null`.
      if (!node) {
        return null;
      }
      if (!EXPRESSION_TYPES[node.type]) {
        throw emit('CompilationError', 'Unknown expression type' + node.type);
      }
      if (index) {
        index = index.slice();
      }
      return EXPRESSION_TYPES[node.type](node, entry, index);
    }

    function _resolve(expr, locals, ctxdata, index) {
      // Bail out early if it's a primitive value or `null`.  This is exactly 
      // what we want.
      if (!expr || 
          typeof expr === 'string' || 
          typeof expr === 'boolean' || 
          typeof expr === 'number') {
        return expr;
      }
      // Check if `expr` knows how to resolve itself (if it's an Entity or an 
      // Attribute).
      if (expr._resolve) {
        return expr._resolve(ctxdata);
      }
      var current = expr(locals, ctxdata);
      locals = current[0], current = current[1];
      return _resolve(current, locals, ctxdata);
    }

    function Identifier(node, entry) {
      var name = node.name;
      return function identifier(locals, ctxdata) {
        if (!_env.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown entry: ' + name,
                                 entry);
        }
        locals.__this__ = _env[name];
        return [locals, _env[name]];
      };
    }
    function ThisExpression(node, entry) {
      return function thisExpression(locals, ctxdata) {
        return [locals, locals.__this__];
      };
    }
    function VariableExpression(node, entry) {
      var name = node.id.name;
      return function variableExpression(locals, ctxdata) {
        if (locals.hasOwnProperty(name)) {
          return locals[name];
        }
        if (!ctxdata || !ctxdata.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown variable: ' + name,
                                 entry);
        }
        return [locals, ctxdata[name]];
      };
    }
    function GlobalsExpression(node, entry) {
      var name = node.id.name;
      return function globalsExpression(locals, ctxdata) {
        if (!_globals) {
          throw new RuntimeError('Globals missing (tried @' + name + ').',
                                 entry);
        }
        if (!_globals.hasOwnProperty(name)) {
          throw new RuntimeError('Reference to an unknown global: ' + name,
                                 entry);
        }
        return [locals, _globals[name]];
      };
    }
    function NumberLiteral(node, entry) {
      return function numberLiteral(locals, ctxdata) {
        return [locals, node.value];
      };
    }
    function StringLiteral(node, entry) {
      var parsed, complex;
      return function stringLiteral(locals, ctxdata) {
        if (!complex) {
          parsed = _parser.parseString(node.content);
          if (parsed.type == 'String') {
            return [locals, parsed.content];
          }
          complex = Expression(parsed, entry);
        }
        try {
          return [locals, _resolve(complex, locals, ctxdata)];
        } catch (e) {
          requireCompilerError(e);
          // only throw, don't emit yet.  If the `ValueError` makes it to 
          // `toString()` it will be emitted there.  It might, however, be 
          // cought by `ArrayLiteral` or `HashLiteral` and changed into 
          // a `IndexError`.  See those Expressions for more docs.
          throw new ValueError(e.message, entry, node.content);
        }
      };
    }
    function ArrayLiteral(node, entry, index) {
      var content = [];
      var defaultIndex = index.length ? index.shift() : null;
      for (var i = 0; i < node.content.length; i++) {
        content.push(Expression(node.content[i], entry));
      }
      return function arrayLiteral(locals, ctxdata, prop) {
        var keysToTry = [prop, defaultIndex];
        var keysTried = [];
        for (var i = 0; i < keysToTry.length; i++) {
          try {
            // only defaultIndex needs to be resolved
            var key = keysToTry[i] = _resolve(keysToTry[i], locals, ctxdata);
          } catch (e) {
            requireCompilerError(e);
            // See `HashLiteral` for docs about this
            throw emit(IndexError, e.message, entry);
          }
          if (key) {
            keysTried.push(key);
          }
          if (content[key] !== undefined) {
            return [locals, content[key]];
          }
        }

        throw emit(IndexError,
                   keysTried.length ? 
                     'Array lookup out of range (tried ' + keysTried.join(', ') + ').' :
                     'Array lookup out of range.',
                   entry);
      };
    }
    function HashLiteral(node, entry, index) {
      var content = [];
      var defaultKey = null;
      var defaultIndex = index.length ? index.shift() : null;
      for (var i = 0; i < node.content.length; i++) {
        var elem = node.content[i];
        // use `elem.value` to skip `HashItem` and create the value right away
        content[elem.key.name] = Expression(elem.value, entry, index);
        if (elem.default) {
          defaultKey = elem.key.name;
        }
      }
      return function hashLiteral(locals, ctxdata, prop) {
        var keysToTry = [prop, defaultIndex, defaultKey];
        var keysTried = [];
        for (var i = 0; i < keysToTry.length; i++) {
          try {
            // only defaultIndex needs to be resolved
            var key = keysToTry[i] = _resolve(keysToTry[i], locals, ctxdata);
          } catch (e) {
            requireCompilerError(e);

            // Throw and emit an IndexError so that ValueErrors from the index 
            // don't make their way to the context.  The context only cares 
            // about ValueErrors thrown by the value of the entity it has 
            // requested, not entities used in the index.
            //
            // To illustrate this point with an example, consider the following 
            // two strings, where `foo` is a missing entity.
            //
            //     <prompt1["remove"] {
            //       remove: "Remove {{ foo }}?",
            //       keep: "Keep {{ foo }}?"
            //     }>
            //
            // `prompt1` will throw a `ValueError`.  The context can use it to 
            // display the source of the entity, i.e. `Remove {{ foo }}?`.  The 
            // index resolved properly, so at least we know that we're showing 
            // the right variant of the entity.
            //
            //     <prompt2["{{ foo }}"] {
            //       remove: "Remove file?",
            //       keep: "Keep file?"
            //     }>
            //
            // On the other hand, `prompt2` will throw an `IndexError`.  This 
            // is a more serious scenatio for the context.  We should not 
            // assume that we know which variant to show to the user.  In fact, 
            // in the above (much contrived, but still) example, showing the 
            // incorrect variant will likely lead to data loss.  The context 
            // should be more strict in this case and should not try to recover 
            // from this error too hard.
            throw emit(IndexError, e.message, entry);
          }
          if (key) {
            keysTried.push(key);
          }
          if (content.hasOwnProperty(key)) {
            return [locals, content[key]];
          }
        }

        throw emit(IndexError,
                   keysTried.length ? 
                     'Hash key lookup failed (tried ' + keysTried.join(', ') + ').' :
                     'Hash key lookup failed.',
                   entry);
      };
    }
    function ComplexString(node, entry) {
      var content = [];
      for (var i = 0; i < node.content.length; i++) {
        content.push(Expression(node.content[i], entry));
      }
      // Every complexString needs to have its own `dirty` flag whose state 
      // persists across multiple calls to the given complexString.  On the other 
      // hand, `dirty` must not be shared by all complexStrings.  Hence the need 
      // to define `dirty` as a variable available in the closure.  Note that the 
      // anonymous function is a self-invoked one and it returns the closure 
      // immediately.
      return function() {
        var dirty = false;
        return function complexString(locals, ctxdata) {
          if (dirty) {
            throw new RuntimeError("Cyclic reference detected", entry);
          }
          dirty = true;
          var parts = [];
          try {
            for (var i = 0; i < content.length; i++) {
              parts.push(_resolve(content[i], locals, ctxdata));
            }
          } finally {
            dirty = false;
          }
          return [locals, parts.join('')];
        }
      }();
    }

    function UnaryOperator(token, entry) {
      if (token == '-') return function negativeOperator(argument) {
        return -argument;
      };
      if (token == '+') return function positiveOperator(argument) {
        return +argument;
      };
      if (token == '!') return function notOperator(argument) {
        return !argument;
      };
      throw emit(CompilationError, "Unknown token: " + token, entry);
    }
    function BinaryOperator(token, entry) {
      if (token == '==') return function equalOperator(left, right) {
        return left == right;
      };
      if (token == '!=') return function notEqualOperator(left, right) {
        return left != right;
      };
      if (token == '<') return function lessThanOperator(left, right) {
        return left < right;
      };
      if (token == '<=') return function lessThanEqualOperator(left, right) {
        return left <= right;
      };
      if (token == '>') return function greaterThanOperator(left, right) {
        return left > right;
      };
      if (token == '>=') return function greaterThanEqualOperator(left, right) {
        return left >= right;
      };
      if (token == '+') return function addOperator(left, right) {
        return left + right;
      };
      if (token == '-') return function substractOperator(left, right) {
        return left - right;
      };
      if (token == '*') return function multiplyOperator(left, right) {
        return left * right;
      };
      if (token == '/') return function devideOperator(left, right) {
        // simple shape guard in order to test things like <foo[1/0] ...>
        if (right == 0) {
          throw new RuntimeError('Division by zero not allowed.', entry);
        }
        return left / right;
      };
      if (token == '%') return function moduloOperator(left, right) {
        return left % right;
      };
      throw emit(CompilationError, "Unknown token: " + token, entry);
    }
    function LogicalOperator(token, entry) {
      if (token == '&&') return function andOperator(left, right) {
        return left && right;
      };
      if (token == '||') return function orOperator(left, right) {
        return left || right;
      };
      throw emit(CompilationError, "Unknown token: " + token, entry);
    }
    function UnaryExpression(node, entry) {
      var operator = UnaryOperator(node.operator.token, entry);
      var argument = Expression(node.argument, entry);
      return function unaryExpression(locals, ctxdata) {
        return [locals, operator(_resolve(argument, locals, ctxdata))];
      };
    }
    function BinaryExpression(node, entry) {
      var left = Expression(node.left, entry);
      var operator = BinaryOperator(node.operator.token, entry);
      var right = Expression(node.right, entry);
      return function binaryExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata), 
          _resolve(right, locals, ctxdata)
        )];
      };
    }
    function LogicalExpression(node, entry) {
      var left = Expression(node.left, entry);
      var operator = LogicalOperator(node.operator.token, entry);
      var right = Expression(node.right, entry);
      return function logicalExpression(locals, ctxdata) {
        return [locals, operator(
          _resolve(left, locals, ctxdata), 
          _resolve(right, locals, ctxdata)
        )];
      }
    }
    function ConditionalExpression(node, entry) {
      var test = Expression(node.test, entry);
      var consequent = Expression(node.consequent, entry);
      var alternate = Expression(node.alternate, entry);
      return function conditionalExpression(locals, ctxdata) {
        if (_resolve(test, locals, ctxdata)) {
          return consequent(locals, ctxdata);
        }
        return alternate(locals, ctxdata);
      };
    }

    function CallExpression(node, entry) {
      var callee = Expression(node.callee, entry);
      var args = [];
      for (var i = 0; i < node.arguments.length; i++) {
        args.push(Expression(node.arguments[i], entry));
      }
      return function callExpression(locals, ctxdata) {
        var evaluated_args = [];
        for (var i = 0; i < args.length; i++) {
          evaluated_args.push(args[i](locals, ctxdata));
        }
        // callee is an expression pointing to a macro, e.g. an identifier
        var macro = callee(locals, ctxdata);
        locals = macro[0], macro = macro[1];
        if (!macro._call) {
          throw new RuntimeError('Expected a macro, got a non-callable.',
                                 entry);
        }
        // rely entirely on the platform implementation to detect recursion
        return macro._call(ctxdata, evaluated_args);
      };
    }
    function PropertyExpression(node, entry) {
      var expression = Expression(node.expression, entry);
      var property = node.computed ?
        Expression(node.property, entry) :
        node.property.name;
      return function propertyExpression(locals, ctxdata) {
        var prop = _resolve(property, locals, ctxdata);
        var parent = expression(locals, ctxdata);
        locals = parent[0], parent = parent[1];
        // If `parent` is an Entity or an Attribute, evaluate its value via the 
        // `_yield` method.  This will ensure the correct value of 
        // `locals.__this__`.
        if (parent._yield) {
          return parent._yield(ctxdata, prop);
        }
        // If `parent` is an object passed by the developer to the context 
        // (i.e., `expression` was a `VariableExpression`), simply return the 
        // member of the object corresponding to `prop`.  We don't really care 
        // about `locals` here.
        if (typeof parent !== 'function') {
          if (!parent.hasOwnProperty(prop)) {
            throw new RuntimeError(prop + 
                                   ' is not defined in the context data',
                                   entry);
          }
          return [null, parent[prop]];
        }
        return parent(locals, ctxdata, prop);
      }
    }
    function AttributeExpression(node, entry) {
      // XXX looks similar to PropertyExpression, but it's actually closer to 
      // Identifier
      var expression = Expression(node.expression, entry);
      var attribute = node.computed ?
        Expression(node.attribute, entry) :
        node.attribute.name;
      return function attributeExpression(locals, ctxdata) {
        var attr = _resolve(attribute, locals, ctxdata);
        var entity = expression(locals, ctxdata);
        locals = entity[0], entity = entity[1];
        // XXX what if it's not an entity?
        return [locals, entity.attributes[attr]];
      }
    }
    function ParenthesisExpression(node, entry) {
      return Expression(node.expression, entry);
    }

  }

  // Errors

  // `CompilerError` is a general class of errors emitted by the Compiler.
  function CompilerError(message, entry) {
    this.name = 'CompilerError';
    this.message = message;
    this.entry = entry.id;
  }
  CompilerError.prototype = Object.create(Error.prototype);
  CompilerError.prototype.constructor = CompilerError;

  // `CompilationError` extends `CompilerError`.  It's a class of errors 
  // which happen during compilation of the AST.
  function CompilationError(message, entry) {
    CompilerError.call(this, message, entry);
    this.name = 'CompilationError';
  }
  CompilationError.prototype = Object.create(CompilerError.prototype);
  CompilationError.prototype.constructor = CompilationError;

  // `RuntimeError` extends `CompilerError`.  It's a class of errors which 
  // happen during the evaluation of entries, i.e. when you call 
  // `entity.toString()`.
  function RuntimeError(message, entry) {
    CompilerError.call(this, message, entry);
    this.name = 'RuntimeError';
  };
  RuntimeError.prototype = Object.create(CompilerError.prototype);
  RuntimeError.prototype.constructor = RuntimeError;;

  // `ValueError` extends `RuntimeError`.  It's a class of errors which 
  // happen during the composition of a ComplexString value.  It's easier to 
  // recover from than an `IndexError` because at least we know that we're 
  // showing the correct member of the hash/array.
  function ValueError(message, entry, source) {
    RuntimeError.call(this, message, entry);
    this.name = 'ValueError';
    this.source = source;
  }
  ValueError.prototype = Object.create(RuntimeError.prototype);
  ValueError.prototype.constructor = ValueError;;

  // `IndexError` extends `RuntimeError`.  It's a class of errors which 
  // happen during the lookup of a hash/array member.  It's harder to recover 
  // from than `ValueError` because we en dup not knowing which variant of the 
  // entity value to show and in case the meanings are divergent, the 
  // consequences for the user can be serious.
  function IndexError(message, entry) {
    RuntimeError.call(this, message, entry);
    this.name = 'IndexError';
  };
  IndexError.prototype = Object.create(RuntimeError.prototype);
  IndexError.prototype.constructor = IndexError;;

  function requireCompilerError(e) {
    if (!(e instanceof CompilerError)) {
      throw e;
    }
  }


  // Expose the Compiler constructor

  // Depending on the environment the script is run in, define `Compiler` as 
  // the exports object which can be `required` as a module, or as a member of 
  // the L20n object defined on the global object in the browser, i.e. 
  // `window`.

  if (typeof exports !== 'undefined') {
    exports.Compiler = Compiler;
  } else if (this.L20n) {
    this.L20n.Compiler = Compiler;
  } else {
    this.L20nCompiler = Compiler;
  }
}).call(this);
(function() {
  'use strict';

  var data = {
    'defaultLocale': 'en-US',
    'systemLocales': ['en-US']
  }

  /* I18n API TC39 6.2.2 */
  function isStructurallyValidLanguageTag(locale) {
    return true;
  }


  /* I18n API TC39 6.2.3 */
  function canonicalizeLanguageTag(locale) {
    return locale;
  }

  /* I18n API TC39 6.2.4 */
  function defaultLocale() {
    return data.defaultLocale;
  }

  /* I18n API TC39 9.2.1 */
  function canonicalizeLocaleList(locales) {
    if (locales === undefined) {
      return [];
    }
    
    var seen = [];
    
    if (typeof(locales) == 'string') {
      locales = new Array(locales);
    }

    var len = locales.length;
    var k = 0;

    while (k < len) {
      var Pk = k.toString();
      var kPresent = locales.hasOwnProperty(Pk);
      if (kPresent) {
        var kValue = locales[Pk];

        if (typeof(kValue) !== 'string' &&
            typeof(kValue) !== 'object') {
          throw new TypeError();
        }
        
        var tag = kValue.toString();
        if (!isStructurallyValidLanguageTag(tag)) {
          throw new RangeError();
        }
        var tag = canonicalizeLanguageTag(tag);
        if (seen.indexOf(tag) === -1) {
          seen.push(tag);
        }
      }
      k += 1;
    }
    return seen;
  }

  /* I18n API TC39 9.2.2 */
  function bestAvailableLocale(availableLocales, locale) {
    var candidate = locale;
    while (1) {
      if (availableLocales.indexOf(candidate) !== -1) {
        return candidate;
      }

      var pos = candidate.lastIndexOf('-');

      if (pos === -1) {
        return undefined;
      }

      if (pos >= 2 && candidate[pos-2] == '-') {
        pos -= 2;
      }
      candidate = candidate.substr(0, pos)
    }
  }

  /* I18n API TC39 9.2.3 */
  function lookupMatcher(availableLocales, requestedLocales) {
    var i = 0;
    var len = requestedLocales.length;
    var availableLocale = undefined;

    while (i < len && availableLocale === undefined) {
      var locale = requestedLocales[i];
      var noExtensionsLocale = locale;
      var availableLocale = bestAvailableLocale(availableLocales,
                                                noExtensionsLocale);
      i += 1;
    }
    
    var result = {};
    
    if (availableLocale !== undefined) {
      result.locale = availableLocale;
      if (locale !== noExtensionsLocale) {
        throw "NotImplemented";
      }
    } else {
      result.locale = defaultLocale();
    }
    return result;
  }

  /* I18n API TC39 9.2.4 */
  var bestFitMatcher = lookupMatcher;

  /* I18n API TC39 9.2.5 */
  function resolveLocale(availableLocales,
                         requestedLocales,
                         options,
                         relevantExtensionKeys,
                         localeData) {

    var matcher = options.localeMatcher;
    if (matcher == 'lookup') {
      var r = lookupMatcher(availableLocales, requestedLocales);
    } else {
      var r = bestFitMatcher(availableLocales, requestedLocales);
    }
    var foundLocale = r.locale;

    if (r.hasOwnProperty('extension')) {
      throw "NotImplemented";
    }

    var result = {};
    result.dataLocale = foundLocale;

    var supportedExtension = "-u";

    var i = 0;
    var len = 0;

    if (relevantExtensionKeys !== undefined) {
      len = relevantExtensionKeys.length;
    }
    
    while (i < len) {
      var key = relevantExtensionKeys[i.toString()];
      var foundLocaleData = localeData(foundLocale);
      var keyLocaleData = foundLocaleData[foundLocale];
      var value = keyLocaleData[0];
      var supportedExtensionAddition = "";
      if (extensionSubtags !== undefined) {
        throw "NotImplemented";
      }

      if (options.hasOwnProperty('key')) {
        var optionsValue = options.key;
        if (keyLocaleData.indexOf(optionsValue) !== -1) {
          if (optionsValue !== value) {
            value = optionsValue;
            supportedExtensionAddition = "";
          }
        }
        result.key = value;
        supportedExtension += supportedExtensionAddition;
        i += 1;
      }
    }

    if (supportedExtension.length > 2) {
      var preExtension = foundLocale.substr(0, extensionIndex);
      var postExtension = foundLocale.substr(extensionIndex+1);
      var foundLocale = preExtension + supportedExtension + postExtension;
    }
    result.locale = foundLocale;
    return result;
  }

  /**
   * availableLocales - The list of locales that the system offers
   *
   * returns the list of availableLocales sorted by user preferred locales
   **/
  function prioritizeLocales(availableLocales) {
    /**
     * For now we just take nav.language, but we'd prefer to get
     * a list of locales that the user can read sorted by user's preference
     **/
    var requestedLocales = [navigator.language || navigator.userLanguage];
    var options = {'localeMatcher': 'lookup'};
    var tag = resolveLocale(availableLocales,
                            requestedLocales, options);
    var pos = availableLocales.indexOf(tag.locale)

    if (pos === -1) {
      // not sure why resolveLocale can return a locale that is not available
      return availableLocales;
    }
    availableLocales.splice(pos, 1);
    availableLocales.unshift(tag.locale)
    return availableLocales;
  }

  var Intl;

  if (typeof exports !== 'undefined') {
    Intl = exports;
  } else if (this.L20n) {
    Intl = this.L20n.Intl = {};
  } else {
    Intl = this.L20nIntl = {};
  }

  Intl.prioritizeLocales = prioritizeLocales;
}).call(this);
(function(){
  var ctx = L20n.getContext();
  HTMLDocument.prototype.__defineGetter__('l10nCtx', function() {
    return ctx;
  });
})();

var headNode, ctx, links;

function bootstrap() {
  headNode = document.head;
  ctx = document.l10nCtx;
  links = headNode.getElementsByTagName('link')
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/manifest') {
      IO.loadAsync(links[i].getAttribute('href')).then(
        function(text) {
          var manifest = JSON.parse(text);
          var langList = L20n.Intl.prioritizeLocales(manifest.locales.supported);
          ctx.settings.locales = langList;
          ctx.settings.schemes = manifest.schemes;
          initializeDocumentContext();
        }
      );
      return;
    }
  }
  initializeDocumentContext();
}

bootstrap();

function initializeDocumentContext() {
  if (ctx.settings.locales.length === 0) {
    var metas = headNode.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('http-equiv') == 'Content-Language') {
        var locales = metas[i].getAttribute('content').split(',');
        for(i in locales) {
          locales[i] = locales[i].trim()
        }
        var langList = L20n.Intl.prioritizeLocales(locales);
        ctx.settings.locales = langList;
        break;
      }
    }
  }

  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute('type') == 'intl/l20n')
      ctx.addResource(links[i].getAttribute('href'))
  }


  var scriptNodes = headNode.getElementsByTagName('script')
  for (var i=0;i<scriptNodes.length;i++) {
    if (scriptNodes[i].getAttribute('type')=='intl/l20n-data') {
      var contextData = JSON.parse(scriptNodes[i].textContent);
      ctx.data = contextData;
    } else if (scriptNodes[i].getAttribute('type')=='intl/l20n') {
      ctx.injectResource(null, scriptNodes[i].textContent);
    }
  }
  
  ctx.addEventListener('ready', function() {
    var event = document.createEvent('Event');
    event.initEvent('LocalizationReady', false, false);
    document.dispatchEvent(event);
    if (document.body) {
      localizeDocument();
    } else {
      document.addEventListener('readystatechange', function() {
        if (document.readyState === 'interactive') {
          localizeDocument();
        }
      });
    }
  });

  ctx.addEventListener('error', function(e) {
    if (e.code & L20n.NOVALIDLOCALE_ERROR) {
      var event = document.createEvent('Event');
      event.initEvent('LocalizationFailed', false, false);
      document.dispatchEvent(event);
    }
  });

  ctx.freeze();

  function localizeDocument() {
    var nodes = document.querySelectorAll('[data-l10n-id]');
    for (var i = 0, node; node = nodes[i]; i++) {
      localizeNode(ctx, node);
    }
    fireLocalizedEvent();
  }


  HTMLElement.prototype.retranslate = function() {
    if (this.hasAttribute('data-l10n-id')) {
      localizeNode(ctx, this);
      return;
    }
    throw Exception("Node not localizable");
  }

  HTMLElement.prototype.__defineGetter__('l10nData', function() {
    return this.nodeData || (this.nodeData = {});
  });

  HTMLDocument.prototype.__defineGetter__('l10nData', function() {
    return ctx.data || (ctx.data = {});
  });
}

function fireLocalizedEvent() {
  var event = document.createEvent('Event');
  event.initEvent('DocumentLocalized', false, false);
  document.dispatchEvent(event);
}

function localizeNode(ctx, node) {
  var l10nId = node.getAttribute('data-l10n-id');
  var args;

  if (node.hasAttribute('data-l10n-args')) {
    args = JSON.parse(node.getAttribute('data-l10n-args'));
  }
  try {
    var entity = ctx.getEntity(l10nId, args);
  } catch (e) {
    console.warn("Failed to localize node: "+l10nId);
    return false;
  }
  var l10nAttrs = null;
  if (node.hasAttribute('data-l10n-attrs')) {
    l10nAttrs = node.getAttribute('data-l10n-attrs').split(" ");
  }

  if (entity.attributes) {
    for (var j in entity.attributes) {
      if (!l10nAttrs || l10nAttrs.indexOf(j) !== -1)
        node.setAttribute(j, entity.attributes[j]);
    }
  }

  var l10nOverlay = node.hasAttribute('data-l10n-overlay');

  if (!l10nOverlay) {
    node.textContent = entity.value;
    return true;
  }
  var origNode = node.l20nOrigNode;
  if (!origNode) {
    origNode = node.cloneNode(true);
    node.l20nOrigNode = origNode;
  }
  node.innerHTML = entity.value;

  var children = node.getElementsByTagName('*');
  for (var i=0,child;child  = children[i]; i++) {
    var path = getPathTo(child, node);
    origChild = getElementByPath(path, origNode);
    if (!origChild) {
      continue;
    }

    for (var k=0, origAttr; origAttr = origChild.attributes[k]; k++) {
      if (!child.hasAttribute(origAttr.name)) {
        child.setAttribute(origAttr.nodeName, origAttr.value);
      }
    }
  }
  return true;
}

function getElementByPath(path, context) {
  var xpe = document.evaluate(path, context, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  return xpe.singleNodeValue;
}


function getPathTo(element, context) {
  const TYPE_ELEMENT = 1;

  if (element === context)
    return '.';

  var id = element.getAttribute('id');
  if (id)
    return '*[@id="' + id + '"]';

  var l10nPath = element.getAttribute('l10n-path');
  if (l10nPath)
    return l10nPath;

  var index = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0, sibling; sibling = siblings[i]; i++) {
    if (sibling === element) {
      var pathToParent = getPathTo(element.parentNode, context);
      return pathToParent + '/' + element.tagName + '[' + (index + 1) + ']';
    }
    if (sibling.nodeType === TYPE_ELEMENT && sibling.tagName === element.tagName)
      index++;
  }

  throw "Can't find the path to element " + element;
}
