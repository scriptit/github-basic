var assert = require('assert')
var github = require('../')

it('can make simple api requests', function (done) {
  this.timeout(5000)
  github.json('get', '/users/:user/gists', {user: 'ForbesLindesay'}, function (err, res) {
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
  github.buffer('head', '/ForbesLindesay/github-basic', null, {host: 'github.com'}, function (err, res) {
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
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 150)
    done()
  })
})
it('can make streaming requests for commits', function (done) {
  this.timeout(40000)
  github.stream('/repos/:owner/:repo/commits', {
    owner: 'visionmedia',
    repo: 'jade'
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    assert(res.length > 150)
    console.dir(res)
    done()
  })
})
it('can make streaming requests with just one page', function (done) {
  this.timeout(20000)
  github.stream('/repos/:owner/:repo/subscribers', {
    owner: 'ForbesLindesay',
    repo: 'github-basic'
  }).buffer(function (err, res) {
    if (err) return done(err)
    assert(Array.isArray(res))
    done()
  })
})