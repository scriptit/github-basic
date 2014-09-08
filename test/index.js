'use strict';

var assert = require('assert')
var Promise = require('promise')
var connect = require('../')

var client = connect({
  version: 3,
  cache: 'memory',
  auth: '90993e4e47b0fdd1f51f4c67b17368c62a3d6097'
});

it('can make simple api requests', function (done) {
  this.timeout(5000)
  client.get('/users/:user/gists', {user: 'ForbesLindesay'}, function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    res.forEach(function (gist) {
      assert(typeof gist.url === 'string')
      assert(typeof gist.public === 'boolean')
    })
    done()
  })
})
it('can have a `host` option passed in', function (done) {
  this.timeout(5000)
  client.headBuffer('https://github.com/ForbesLindesay/github-basic', done)
})
it('can make streaming requests', function (done) {
  this.timeout(20000)
  client.getStream('/repos/:owner/:repo/subscribers', {
    owner: 'visionmedia',
    repo: 'jade',
    per_page: 100
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 20)
    done()
  })
})
it('can make streaming requests for commits', function (done) {
  this.timeout(20000)
  client.getStream('/repos/:owner/:repo/commits', {
    owner: 'ForbesLindesay',
    repo: 'browserify-middleware',
    per_page: 100
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 140)
    done()
  })
})
it('can make streaming requests with just one page', function (done) {
  this.timeout(20000)
  client.getStream('/repos/:owner/:repo/subscribers', {
    owner: 'ForbesLindesay',
    repo: 'github-basic',
    per_page: 100
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    done()
  })
})
