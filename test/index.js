'use strict';

var assert = require('assert')
var Promise = require('promise')
var github = require('../')

var options = {
  cache: true,
  auth: {
    type: 'oauth',
    token: '90993e4e47b0fdd1f51f4c67b17368c62a3d6097'
  }
}

it('can make simple api requests', function (done) {
  this.timeout(5000)
  github.json('get', '/users/:user/gists', {user: 'ForbesLindesay'}, options, function (err, res) {
    if (err) return done(err)
    assert(res.statusCode === 200)
    assert(Array.isArray(res.body))
    res.body.forEach(function (gist) {
      assert(typeof gist.url === 'string')
      assert(typeof gist.public === 'boolean')
    })
    done()
  })
})
it('can have a `host` option passed in', function (done) {
  this.timeout(5000)
  github.buffer('head', 'https://github.com/ForbesLindesay/github-basic', null, options, function (err, res) {
    if (err) return done(err)
    assert(res.statusCode === 200)
    done()
  })
})
it('can make streaming requests', function (done) {
  this.timeout(20000)
  github.stream('/repos/:owner/:repo/subscribers', {
    owner: 'visionmedia',
    repo: 'jade'
  }, options).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 150)
    done()
  })
})
it('can make streaming requests for commits', function (done) {
  this.timeout(20000)
  github.stream('/repos/:owner/:repo/commits', {
    owner: 'ForbesLindesay',
    repo: 'browserify-middleware'
  }, options).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 140)
    done()
  })
})
it('can make streaming requests with just one page', function (done) {
  this.timeout(20000)
  github.stream('/repos/:owner/:repo/subscribers', {
    owner: 'ForbesLindesay',
    repo: 'github-basic'
  }, options).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    done()
  })
})

it('caches results', function (done) {
  this.timeout(10000);
  function doRequest() {
    return github.json('get', '/repos/:owner/:repo/git/refs/:ref', {
      owner: 'ForbesLindesay',
      repo: 'github-basic',
      ref: 'heads/master'
    }, options).then(function (res) {
      return res
    })
  }
  function doManyRequests(n) {
    if (n === 0) return Promise.resolve([])
    return doRequest().then(function (res) {
      return doManyRequests(n - 1).then(function (rest) {
        rest.unshift(res)
        return rest
      })
    })
  }
  doManyRequests(5).then(function (results) {
    results.forEach(function (res) {
      assert.deepEqual(results[0], res)
    })
  }).nodeify(done)
})