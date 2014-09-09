'use strict';

var assert = require('assert')
var Promise = require('promise')
var connect = require('../')

var client = connect({
  version: 3,
  cache: 'memory',
  auth: '90993e4e47b0fdd1f51f4c67b17368c62a3d6097' // github-basic-js-test
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

describe('helpers', function () {
  describe('exists(user, repo)', function () {
    it('returns `true` if a repo exists', function (done) {
      client.exists('ForbesLindesay', 'pull-request', function (err, res) {
        if (err) return done(err);
        assert(res === true);
        done();
      });
    });
    it('returns `false` if a repo does not exist', function (done) {
      client.exists('ForbesLindesay', 'i-wont-ever-create-this', function (err, res) {
        if (err) return done(err);
        assert(res === false);
        done();
      });
    });
  });
  var branch  = (new Date()).toISOString().replace(/[^0-9a-zA-Z]+/g, '');
  describe('fork(user, repo, options)', function () {
    it('forks `user/repo` to the current user', function (done) {
      this.timeout(60000);
      client.fork('ForbesLindesay', 'pull-request-test', function (err, res) {
        if (err) return done(err);
        client.exists('github-basic-js-test', 'pull-request-test', function (err, res) {
          if (err) return done(err);
          assert(res === true);
          done();
        });
      });
    });
  });

  describe('branch(user, repo, form, to, options)', function () {
    it('creates a new branch `to` in `user/repo` based on `from`', function (done) {
      this.timeout(10000);
      client.branch('github-basic-js-test', 'pull-request-test', 'master', branch, function (err, res) {
        if (err) return done(err);
        client.head('/repos/github-basic-js-test/pull-request-test/git/refs/heads/:branch', {branch: branch}, done);
      });
    });
  });

  describe('commit(commit, options)', function () {
    it('commits an update to a branch', function (done) {
      this.timeout(15000)
      var commit = {
        branch: branch,
        message: 'test commit',
        updates: [{path: 'test-file.txt', content: 'lets-add-a-file wahooo'}]
      };
      client.commit('github-basic-js-test', 'pull-request-test', commit, function (err, res) {
        if (err) return done(err);
        client.head('https://github.com/github-basic-js-test/pull-request-test/blob/' + branch + '/test-file.txt', done);
      });
    });
  });

  describe('pull(from, to, message, options)', function () {
    it('creates a pull request', function (done) {
      this.timeout(15000)
      var from = {
        user: 'github-basic-js-test',
        repo: 'pull-request-test',
        branch: branch
      };
      var to = {
        user: 'github-basic-js-test',
        repo: 'pull-request-test',
        branch: 'master'
      };
      var message = {
        title: branch,
        body: 'A test pull request'
      };
      client.pull(from, to, message, function (err, res) {
        if (err) return done(err);
        ///repos/github-basic-js-test/pull-request-test/pulls/1
        client.head('/repos/github-basic-js-test/pull-request-test/pulls/' + res.number, done);
      });
    });
  });
});
