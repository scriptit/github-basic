'use strict'

var Promise = require('promise');
var barrage = require('barrage');
var Client = require('./lib/helpers.js');

module.exports = connect;
function connect(options) {
  if (options.sync === true) {
    var client = new Client(options, require('sync-request'), function wrap(fn) {
      return fn.call(this);
    }, function when(value, fn) {
      return fn.call(this, value);
    }, function all(values) {
      return values;
    });
    client.getStream = function (path, query) {
      throw new Error('.getStream is only supported by async GitHub clients.');
    };
    return client;
  } else {
    var client = new Client(options, require('then-request'), function wrap(fn) {
      try {
        return fn.call(this);
      } catch (ex) {
        return Promise.reject(ex);
      }
    }, function when(promise, cb, eb) {
      return Promise.resolve(promise).then(cb.bind(this), eb && eb.bind(this));
    }, function all(promises) {
      return Promise.all(promises);
    });

    // support node style callbacks as the last argument
    Object.keys(Client.prototype).forEach(function (key) {
      client[key] = function () {
        if (typeof arguments[arguments.length - 1] === 'function') {
          var args = [];
          for (var i = 0; i < arguments.length - 1; i++) {
            args.push(arguments[i]);
          }
          return Client.prototype[key].apply(client, args).nodeify(arguments[arguments.length - 1]);
        } else {
          return Client.prototype[key].apply(client, arguments);
        }
      };
    });

    client.getStream = function (path, query) {
      var next = this.requestJson.bind(this, 'get', path, query);
      var running = false;
      var source = new barrage.Readable({objectMode: true})
      source._read = function () {
        if (running) return;
        running = true;
        next().then(function (res) {
          next = res.getNext;
          var cont = true;
          for (var i = 0; i < res.length; i++) {
            cont = source.push(res[i]);
          }
          if (typeof next !== 'function') {
            return source.push(null);
          }
          running = false;
          if (cont) source._read();
        }).done(null, function (err) {
          source.emit('error', err);
          source.push(null);
          running = true;
        });
      }
      return source;
    };

    return client;
  }
}
