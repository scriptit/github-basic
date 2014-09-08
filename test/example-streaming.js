var github = require('../')
var Stringifier = require('newline-json').Stringifier

var client = github({version: 3})

//stream all of ForbesLindesay's repos
client.getStream('/users/:user/repos', {user: 'ForbesLindesay'})
  .pipe(new Stringifier())
  .pipe(process.stdout)
