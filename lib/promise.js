/**
 * @class A promise - value to be resolved in the future.
 * Implements the "Promises/A+" specification.
 */
(function() {
  'use strict';
var Promise = function() {
	this._state = 0; /* 0 = pending, 1 = fulfilled, 2 = rejected */
	this._value = null; /* fulfillment / rejection value */

	this._cb = {
		fulfilled: [],
		rejected: []
	}

	this._thenPromises = []; /* promises returned by then() */
}

Promise.all = function(list) {
  var pr = new Promise();
  var toResolve = list.length;
  if (toResolve == 0) {
    pr.fulfill();
    return pr;
  }
  function onResolve() {
    toResolve--;
    if (toResolve == 0) {
      pr.fulfill();
    }
  }
  for (var idx in list) {
    // XXX should there be a different callback for promises errorring out?
    // with two onResolve callbacks, all() is more like some().
    list[idx].then(onResolve, onResolve);
  }
  return pr;
}

/**
 * @param {function} onFulfilled To be called once this promise gets fulfilled
 * @param {function} onRejected To be called once this promise gets rejected
 * @returns {Promise}
 */
Promise.prototype.then = function(onFulfilled, onRejected) {
	this._cb.fulfilled.push(onFulfilled);
	this._cb.rejected.push(onRejected);

	var thenPromise = new Promise();

	this._thenPromises.push(thenPromise);

	if (this._state > 0) {
		setTimeout(this._processQueue.bind(this), 0);
	}

	/* 3.2.6. then must return a promise. */
	return thenPromise; 
}

/**
 * Fulfill this promise with a given value
 * @param {any} value
 */
Promise.prototype.fulfill = function(value) {
	if (this._state != 0) { return this; }

	this._state = 1;
	this._value = value;

	this._processQueue();

	return this;
}

/**
 * Reject this promise with a given value
 * @param {any} value
 */
Promise.prototype.reject = function(value) {
	if (this._state != 0) { return this; }

	this._state = 2;
	this._value = value;

	this._processQueue();

	return this;
}

Promise.prototype._processQueue = function() {
	while (this._thenPromises.length) {
		var onFulfilled = this._cb.fulfilled.shift();
		var onRejected = this._cb.rejected.shift();
		this._executeCallback(this._state == 1 ? onFulfilled : onRejected);
	}
}

Promise.prototype._executeCallback = function(cb) {
	var thenPromise = this._thenPromises.shift();

	if (typeof(cb) != "function") {
		if (this._state == 1) {
			/* 3.2.6.4. If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value. */
			thenPromise.fulfill(this._value);
		} else {
			/* 3.2.6.5. If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason. */
			thenPromise.reject(this._value);
		}
		return;
	}

	try {
		var returned = cb(this._value);

		if (returned && typeof(returned.then) == "function") {
			/* 3.2.6.3. If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise */
			var fulfillThenPromise = function(value) { thenPromise.fulfill(value); }
			var rejectThenPromise = function(value) { thenPromise.reject(value); }
			returned.then(fulfillThenPromise, rejectThenPromise);
		} else {
			/* 3.2.6.1. If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value. */ 
			thenPromise.fulfill(returned);
		}

	} catch (e) {

		/* 3.2.6.2. If either onFulfilled or onRejected throws an exception, promise2 must be rejected with the thrown exception as the reason. */
		thenPromise.reject(e); 

	}
}

this.L20n.Promise = Promise;
}).call(this);
