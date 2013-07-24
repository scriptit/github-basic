# github-basic

Basic https interface to GitHub

[![Build Status](https://travis-ci.org/ForbesLindesay/github-basic.png?branch=master)](https://travis-ci.org/ForbesLindesay/github-basic)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/github-basic.png)](https://gemnasium.com/ForbesLindesay/github-basic)
[![NPM version](https://badge.fury.io/js/github-basic.png)](http://badge.fury.io/js/github-basic)

## Installation

    npm install github-basic

## API

## github(method, path, query, options, callback)

Make a request to one of the github APIs.  Handles redirects transparently and makes errors into proper error objects

### Usage

```js
var github = require('github-basic')

//get all 'ForbesLindesay's gists in the last year

var since = new Date()
since.setUTCFullYear(since.getUTCFullYear() - 1)

// using callbacks

github('GET', '/users/:user/gists', {user: 'ForbesLindesay', since: since}, function (err, res) {
  if (err) throw err;
  res.body.pipe(process.stdout)
})

// or

github('GET', '/users/ForbesLindesay/gists', {since: since}, function (err, res) {
  if (err) throw err;
  res.body.pipe(process.stdout)
})

// using promises

github('GET', '/users/:user/gists', {user: 'ForbesLindesay', since: since})
  .done(function (res) {
   res.body.pipe(process.stdout)
  })

//or

github('GET', '/users/ForbesLindesay/gists', {since: since})
  .done(function (res) {
   res.body.pipe(process.stdout)
  })
```

### Parameters

- @param {String} method:     Can be `head`, `get`, `delete`, `post`, `patch` or `put`
- @param {String} path:       Path from the docs, e.g. `/gists/public` or `/users/:user/gists`
- @param {Object} query:      Query options, e.g. `{since: new Date(2000, 0, 1)}` or `{user: 'ForbesLindesay'}`
- @param {Object} options:    All the other options
- @param {Function} callback: If ommitted, a promise is returned

### Options

 - auth: (default: null) `{type:'oauth',token:'<my oauth token>'}` or `{type:'basic',username:'my user',password:'my password'}`
 - timeout: (default: 2 minutes) timeout in ms or string parsed by `ms` like `'30 minutes'`
 - protocol: (default: `https`) can be `http` or `https`
 - host: (default: `api.github.com`) can be `api.github.com`, `github.com` or `gist.github.com`
 - headers: (default: `{}`) override default headers in the request

### Result

A standard response object with a readable stream as the `.body` property. (N.B. don't stream `res`, stream `res.body`)

## github.buffer(method, path, query, options, callback)

Same as `github(method, path, query, options, callback)` except `res.body` is a string containing the buffered response

## github.json(method, path, query, options, callback)

Same as `github(method, path, query, options, callback)` except `res.body` is a JSON object containing the parsed response

## License

  MIT