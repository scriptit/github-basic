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