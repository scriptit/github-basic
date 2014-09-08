# github-basic

Basic https interface to GitHub

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

### client.getStream(path, query)

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

Output:

```js
{"id":11285217,"name":"affair","full_name":"ForbesLindesay/affair","owner":{"login":"ForbesLindesay","id":1260646,"avatar_url":"https://secure.gravatar.com/avatar/eb3e104452d654350a5d1a65caa2e49e?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png","gravatar_id":"eb3e104452d654350a5d1a65caa2e49e","url":"https://api.github.com/users/ForbesLindesay","html_url":"https://github.com/ForbesLindesay","followers_url":"https://api.github.com/users/ForbesLindesay/followers","following_url":"https://api.github.com/users/ForbesLindesay/following{/other_user}","gists_url":"https://api.github.com/users/ForbesLindesay/gists{/gist_id}","starred_url":"https://api.github.com/users/ForbesLindesay/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/ForbesLindesay/subscriptions","organizations_url":"https://api.github.com/users/ForbesLindesay/orgs","repos_url":"https://api.github.com/users/ForbesLindesay/repos","events_url":"https://api.github.com/users/ForbesLindesay/events{/privacy}","received_events_url":"https://api.github.com/users/ForbesLindesay/received_events","type":"User"},"private":false,"html_url":"https://github.com/ForbesLindesay/affair","description":"Cheating on event emitters with mixins and special browser NodeElement handling","fork":false,"url":"https://api.github.com/repos/ForbesLindesay/affair","forks_url":"https://api.github.com/repos/ForbesLindesay/affair/forks","keys_url":"https://api.github.com/repos/ForbesLindesay/affair/keys{/key_id}","collaborators_url":"https://api.github.com/repos/ForbesLindesay/affair/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/ForbesLindesay/affair/teams","hooks_url":"https://api.github.com/repos/ForbesLindesay/affair/hooks","issue_events_url":"https://api.github.com/repos/ForbesLindesay/affair/issues/events{/number}","events_url":"https://api.github.com/repos/ForbesLindesay/affair/events","assignees_url":"https://api.github.com/repos/ForbesLindesay/affair/assignees{/user}","branches_url":"https://api.github.com/repos/ForbesLindesay/affair/branches{/branch}","tags_url":"https://api.github.com/repos/ForbesLindesay/affair/tags","blobs_url":"https://api.github.com/repos/ForbesLindesay/affair/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/ForbesLindesay/affair/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/ForbesLindesay/affair/git/refs{/sha}","trees_url":"https://api.github.com/repos/ForbesLindesay/affair/git/trees{/sha}","statuses_url":"https://api.github.com/repos/ForbesLindesay/affair/statuses/{sha}","languages_url":"https://api.github.com/repos/ForbesLindesay/affair/languages","stargazers_url":"https://api.github.com/repos/ForbesLindesay/affair/stargazers","contributors_url":"https://api.github.com/repos/ForbesLindesay/affair/contributors","subscribers_url":"https://api.github.com/repos/ForbesLindesay/affair/subscribers","subscription_url":"https://api.github.com/repos/ForbesLindesay/affair/subscription","commits_url":"https://api.github.com/repos/ForbesLindesay/affair/commits{/sha}","git_commits_url":"https://api.github.com/repos/ForbesLindesay/affair/git/commits{/sha}","comments_url":"https://api.github.com/repos/ForbesLindesay/affair/comments{/number}","issue_comment_url":"https://api.github.com/repos/ForbesLindesay/affair/issues/comments/{number}","contents_url":"https://api.github.com/repos/ForbesLindesay/affair/contents/{+path}","compare_url":"https://api.github.com/repos/ForbesLindesay/affair/compare/{base}...{head}","merges_url":"https://api.github.com/repos/ForbesLindesay/affair/merges","archive_url":"https://api.github.com/repos/ForbesLindesay/affair/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/ForbesLindesay/affair/downloads","issues_url":"https://api.github.com/repos/ForbesLindesay/affair/issues{/number}","pulls_url":"https://api.github.com/repos/ForbesLindesay/affair/pulls{/number}","milestones_url":"https://api.github.com/repos/ForbesLindesay/affair/milestones{/number}","notifications_url":"https://api.github.com/repos/ForbesLindesay/affair/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/ForbesLindesay/affair/labels{/name}","created_at":"2013-07-09T14:51:59Z","updated_at":"2013-07-22T20:56:07Z","pushed_at":"2013-07-22T20:56:06Z","git_url":"git://github.com/ForbesLindesay/affair.git","ssh_url":"git@github.com:ForbesLindesay/affair.git","clone_url":"https://github.com/ForbesLindesay/affair.git","svn_url":"https://github.com/ForbesLindesay/affair","homepage":null,"size":86,"watchers_count":0,"language":"JavaScript","has_issues":true,"has_downloads":true,"has_wiki":true,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"master_branch":"master","default_branch":"master","permissions":{"admin":false,"push":false,"pull":true}}
{"id":5729415,"name":"ajax","full_name":"ForbesLindesay/ajax","owner":{"login":"ForbesLindesay","id":1260646,"avatar_url":"https://secure.gravatar.com/avatar/eb3e104452d654350a5d1a65caa2e49e?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png","gravatar_id":"eb3e104452d654350a5d1a65caa2e49e","url":"https://api.github.com/users/ForbesLindesay","html_url":"https://github.com/ForbesLindesay","followers_url":"https://api.github.com/users/ForbesLindesay/followers","following_url":"https://api.github.com/users/ForbesLindesay/following{/other_user}","gists_url":"https://api.github.com/users/ForbesLindesay/gists{/gist_id}","starred_url":"https://api.github.com/users/ForbesLindesay/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/ForbesLindesay/subscriptions","organizations_url":"https://api.github.com/users/ForbesLindesay/orgs","repos_url":"https://api.github.com/users/ForbesLindesay/repos","events_url":"https://api.github.com/users/ForbesLindesay/events{/privacy}","received_events_url":"https://api.github.com/users/ForbesLindesay/received_events","type":"User"},"private":false,"html_url":"https://github.com/ForbesLindesay/ajax","description":"Standalone AJAX library inspired by jQuery/zepto","fork":false,"url":"https://api.github.com/repos/ForbesLindesay/ajax","forks_url":"https://api.github.com/repos/ForbesLindesay/ajax/forks","keys_url":"https://api.github.com/repos/ForbesLindesay/ajax/keys{/key_id}","collaborators_url":"https://api.github.com/repos/ForbesLindesay/ajax/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/ForbesLindesay/ajax/teams","hooks_url":"https://api.github.com/repos/ForbesLindesay/ajax/hooks","issue_events_url":"https://api.github.com/repos/ForbesLindesay/ajax/issues/events{/number}","events_url":"https://api.github.com/repos/ForbesLindesay/ajax/events","assignees_url":"https://api.github.com/repos/ForbesLindesay/ajax/assignees{/user}","branches_url":"https://api.github.com/repos/ForbesLindesay/ajax/branches{/branch}","tags_url":"https://api.github.com/repos/ForbesLindesay/ajax/tags","blobs_url":"https://api.github.com/repos/ForbesLindesay/ajax/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/ForbesLindesay/ajax/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/ForbesLindesay/ajax/git/refs{/sha}","trees_url":"https://api.github.com/repos/ForbesLindesay/ajax/git/trees{/sha}","statuses_url":"https://api.github.com/repos/ForbesLindesay/ajax/statuses/{sha}","languages_url":"https://api.github.com/repos/ForbesLindesay/ajax/languages","stargazers_url":"https://api.github.com/repos/ForbesLindesay/ajax/stargazers","contributors_url":"https://api.github.com/repos/ForbesLindesay/ajax/contributors","subscribers_url":"https://api.github.com/repos/ForbesLindesay/ajax/subscribers","subscription_url":"https://api.github.com/repos/ForbesLindesay/ajax/subscription","commits_url":"https://api.github.com/repos/ForbesLindesay/ajax/commits{/sha}","git_commits_url":"https://api.github.com/repos/ForbesLindesay/ajax/git/commits{/sha}","comments_url":"https://api.github.com/repos/ForbesLindesay/ajax/comments{/number}","issue_comment_url":"https://api.github.com/repos/ForbesLindesay/ajax/issues/comments/{number}","contents_url":"https://api.github.com/repos/ForbesLindesay/ajax/contents/{+path}","compare_url":"https://api.github.com/repos/ForbesLindesay/ajax/compare/{base}...{head}","merges_url":"https://api.github.com/repos/ForbesLindesay/ajax/merges","archive_url":"https://api.github.com/repos/ForbesLindesay/ajax/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/ForbesLindesay/ajax/downloads","issues_url":"https://api.github.com/repos/ForbesLindesay/ajax/issues{/number}","pulls_url":"https://api.github.com/repos/ForbesLindesay/ajax/pulls{/number}","milestones_url":"https://api.github.com/repos/ForbesLindesay/ajax/milestones{/number}","notifications_url":"https://api.github.com/repos/ForbesLindesay/ajax/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/ForbesLindesay/ajax/labels{/name}","created_at":"2012-09-08T15:19:29Z","updated_at":"2013-07-25T02:02:41Z","pushed_at":"2013-04-28T00:50:49Z","git_url":"git://github.com/ForbesLindesay/ajax.git","ssh_url":"git@github.com:ForbesLindesay/ajax.git","clone_url":"https://github.com/ForbesLindesay/ajax.git","svn_url":"https://github.com/ForbesLindesay/ajax","homepage":"https://component.jit.su/ForbesLindesay/ajax","size":168,"watchers_count":28,"language":"JavaScript","has_issues":true,"has_downloads":true,"has_wiki":true,"forks_count":6,"mirror_url":null,"open_issues_count":0,"forks":6,"open_issues":0,"watchers":28,"master_branch":"master","default_branch":"master","permissions":{"admin":false,"push":false,"pull":true}}
...
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
