var github = require('../')
var client = github({version: 3})

//get all 'ForbesLindesay's gists in the last year

var since = new Date()
since.setUTCFullYear(since.getUTCFullYear() - 1)

// using callbacks

client.get('/users/:user/gists', {user: 'ForbesLindesay', since: since}, function (err, res) {
  if (err) throw err;
  console.dir(res)
})

// or

client.get('/users/ForbesLindesay/gists', {since: since}, function (err, res) {
  if (err) throw err;
  console.dir(res)
})

// using promises

client.get('/users/:user/gists', {user: 'ForbesLindesay', since: since}).done(function (res) {
  console.dir(res)
})

//or

client.get( '/users/ForbesLindesay/gists', {since: since}).done(function (res) {
  console.dir(res)
})

// getting raw github data

client.getBuffer('https://raw.githubusercontent.com/:owner/:repo/master/README.md', {
  owner: 'ForbesLindesay',
  repo: 'github-basic'
}).done(function (res) {
  process.stdout.write(res)
})
