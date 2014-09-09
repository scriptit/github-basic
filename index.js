'use strict'

var Promise = require('promise');
var Client = require('./lib/helpers.js');

module.exports = connect;
function connect(options) {
  if (options.sync === true) {
    throw new Error('Synchronous client not implemented yet.');
  }
  return new Client(options, require('then-request'), function (fn) {
    try {
      return fn();
    } catch (ex) {
      return Promise.reject(ex);
    }
  }, function (promise, fn) {
    return Promise.resolve(promise).then(fn);
  });
}
