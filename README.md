# github-basic

Basic https interface to GitHub.  Intended so it's easy to code using [the official documentation](https://developer.github.com/).  It also includes helpers for streaming paged results, and doing all the necessary actions to automatically submit pull requests.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/github-basic/master.svg)](https://travis-ci.org/ForbesLindesay/github-basic)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/github-basic.svg)](https://gemnasium.com/ForbesLindesay/github-basic)
[![NPM version](https://img.shields.io/npm/v/github-basic.svg)](http://badge.fury.io/js/github-basic)

## Installation

    npm install github-basic

## API

### github(options)

```js
var github = require('github-basic');
var client = github({version: 3});
```

Create a new GitHub client with a set of options:

 - version: (required) you should set this to the version number of the API you want to make requests against (e.g. `{version: 3}`)
 - auth: (default: null) `'<my oauth token>'` or `{username: 'my user', password: 'my password'}` to authenticate your requests
 - cache: (default: null) proivde a caching mechanism for "get" requests. Can be `'memory'`, `'file'` or a [custom cache](https://github.com/ForbesLindesay/http-basic#implementing-a-cache)
 - sync: (default: false) set this to true and you will get a fully synchronous GitHub client, just use the results of functions directly, no need for promises or callbacks.

### client.method(path, query[, callback])

 - client.get(path, query[, callback])
 - client.head(path, query[, callback])
 - client.delete(path, query[, callback])
 - client.post(path, query[, callback])
 - client.patch(path, query[, callback])
 - client.put(path, query[, callback])

Make an API request and parse the response as JSON.  For `get`, `head` and `delete` requests, the query will be added as a query string to the end of the url.  For other methods, it will be used as a body.  You can optionally specify that parts of the query should instead be used as part of the url by adding `:qs-name` segments to the url.  e.g.

```js
client.get('/users/:user/gists', {user: 'ForbesLindesay'});
```

If the request is part of a paged request, you can use `res.getNext()`, `res.getPrev()`, `res.getLast()` and `res.getFirst()` to request other pages.  Note that not all of these methods will always exist (e.g. ther eis no `res.getNext()` if you already have the last page).

### client.methodBuffer(path, query[, callback])

 - client.getBuffer(path, query[, callback])
 - client.headBuffer(path, query[, callback])
 - client.deleteBuffer(path, query[, callback])
 - client.postBuffer(path, query[, callback])
 - client.patchBuffer(path, query[, callback])
 - client.putBuffer(path, query[, callback])

Make an API request and return the response as a `Buffer`.  For `get`, `head` and `delete` requests, the query will be added as a query string to the end of the url.  For other methods, it will be used as a body.  You can optionally specify that parts of the query should instead be used as part of the url by adding `:qs-name` segments to the url.  e.g.

```js
client.getBuffer('/users/:user/gists', {user: 'ForbesLindesay'});
```

### client.exists(user, repo[, callback])

Returns `true` if `:user/:repo` exists, and `false` if requesting the repo url returns an error.

### client.fork(user, repo, options[, callback])

Forks the repo `github.com/:user/:repo` to the authenticated user and waits until the fork operation completes.  To fork to an organization, just pass an `organization` string in the `options` object.

**N.B.** forking will currently appear successful even if the target repo already exists.

### client.branch(user, repo, from, to[, callback])

Creates a new branch in `github.com/:user/:repo` using `from` as the source branch and `to` as the new branch name.

### client.commit(user, repo, commit, options[, callback])

Commits a set of changes to `github.com/:user/:repo`.  It only supports updating text files.

**commit:**

An object with:

property | type                | default      | description
---------|---------------------|--------------|----------------------------
branch   | `String`            | `'master'`   | The branch to commit to
message  | `String`            | **required** | The commit message
updates  | `Array<FileUpdate>` | **required** | The actual changes to make

**FileUpdate:**

An object with:

property | type     | default      | description
---------|----------|--------------|----------------------------
path     | `String` | **required** | The file path within the repo (e.g. `test/index.js`)
content  | `String` | **required** | The new content of the file
mode     | `String` | `'100644'`   | The mode to commit the file with (you probably don't want to change this)
type     | `String` | `'blob'`     | The type of entry to create (you probably don't want to change this)

**options:**

An (optonal) object with:

property | type      | default      | description
---------|-----------|--------------|----------------------------
force    | `Boolean` | `false`      | Will force push the change if set to `true`.  You almost certainly don't want to do this.


### client.pull(from, to, message [, callback])

Creates a pull request from `from` to `to`.

**from:**

An object with:

property | type     | default      | description
---------|----------|--------------|----------------------------
user     | `String` | **required** | The source user
repo     | `String` | **required** | The source repository
branch   | `String` | `'master'`   | The source branch

**to:**

An object with:

property | type     | default      | description
---------|----------|--------------|----------------------------
user     | `String` | **required** | The destination user
repo     | `String` | **required** | The destination repository
branch   | `String` | `'master'`   | The destination branch

**message:**

Either:

property | type     | default      | description
---------|----------|--------------|----------------------------
title    | `String` | **required** | The title of the pull request
body     | `String` | `''`         | The body of the pull request

or:

property | type     | default      | description
---------|----------|--------------|----------------------------
issue    | `Number` | **required** | An issue number to convert into a pull request



### client.getStream(path, query)

**Only works in async mode (default)**

Sometimes the easiest way to handle GitHub's paginated results is to treat them as a stream.  This method isn't (currently) clever enough to do streaming JSON parsing of the response, but it will keep requesting more pages as needed and it works properly with back pressure so as to not request more pages than are needed:

```js
var github = require('github-basic')
var Stringifier = require('newline-json').Stringifier

var client = github({version: 3})

//stream all of ForbesLindesay's repos
client.getStream('/users/:user/repos', {user: 'ForbesLindesay'})
  .pipe(new Stringifier())
  .pipe(process.stdout)
```

## Usage

```js
var github = require('github-basic')
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
```

## License

  MIT
