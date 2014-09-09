'use strict';

var assert = require('assert');
var Promise = require('promise');
var Client = require('./client.js');

module.exports = Client;

function delay(timeout) {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
}
function poll(condition, options) {
  options = options || {}
  return condition().then(function (done) {
    if (done) {
      return done
    } else if (options.timeout && options.start && Date.now() - options.start > ms(options.timeout.toString())) {
      var err = new Error('operation timed out')
      err.code = 'TIMEOUT'
      throw err
    } else {
      return delay(typeof options.delay === 'function' ? options.delay(options.attempt || 1) : options.delay || 0).then(function () {
        return poll(condition, {
          attempt: (options.attempt || 1) + 1,
          delay: options.delay,
          timeout: options.timeout,
          start: options.start || Date.now()
        })
      })
    }
  })
}

Client.prototype.exists = function (owner, repo, callback) {
  return this.head('/repos/:owner/:repo', {owner: owner, repo: repo}).then(function () {
    return true;
  }, function (err) {
    return false;
  }).nodeify(callback);
};
Client.prototype.fork = function (owner, repo, options, callback) {
  if (typeof options === 'function' && typeof callback === 'undefined') callback = options, options = null;
  options = options || {}
  var query = {owner: owner, repo: repo}
  if (options.organization) {
    query.organization = options.organization
  }
  return this.post('/repos/:owner/:repo/forks', query).then(function (res) {
    return poll(this.exists.bind(this, res.owner.login, repo), {
      timeout: options.timeout || '5 minutes',
      delay: function (attempt) { return (attempt * 5) * 1000 }
    }).then(function () {
      return res;
    });
  }.bind(this)).nodeify(callback);
};
Client.prototype.branch = function (user, repo, from, to, callback) {
  return this.get('/repos/:owner/:repo/git/refs/:ref', {owner: user, repo: repo, ref: 'heads/' + from}).then(function (res) {
    return this.post('/repos/:owner/:repo/git/refs', {
      owner: user,
      repo: repo,
      ref: 'refs/heads/' + to,
      sha: res.object.sha
    })
  }.bind(this)).nodeify(callback)
}

//does many API requests (watch your rate limit)
Client.prototype.commit = function (user, repo, commit, options, callback) {
  if (typeof options === 'function' && typeof callback === 'undefined') callback = options, options = null;
  options = options || {};
  var branch = commit.branch || 'master';
  var message = commit.message;
  var updates = commit.updates;
  var shaLatestCommit, shaBaseTree, shaNewTree, shaNewCommit;

  return Promise.resolve(null).then(function () {

    //check for correct input
    assert(user && typeof user === 'string', '`user` must be a string')
    assert(repo && typeof repo === 'string', '`repo` must be a string')
    assert(branch && typeof branch === 'string', '`branch` must be a string')
    assert(message && typeof message === 'string', '`message` must be a string')

    updates = Promise.all(updates.map(function (file) {
      // {path: string, content: string|Buffer}
      assert(typeof file.path === 'string', '`file.path` must be a string')
      assert(typeof file.content === 'string' || Buffer.isBuffer(file.content), '`file.content` must be a string or a Buffer')
      var path = file.path.replace(/\\/g, '/').replace(/^\//, '')
      var mode = file.mode || '100644'
      var type = file.type || 'blob'
      return this.post('/repos/:owner/:repo/git/blobs', {
        owner: user,
        repo: repo,
        content: typeof file.content === 'string' ? file.content : file.content.toString('base64'),
        encoding: typeof file.content === 'string' ? 'utf-8' : 'base64'
      }).then(function (res) {
        return {
          path: path,
          mode: mode,
          type: type,
          sha: res.sha
        };
      });
    }.bind(this)));

    return this.get('/repos/:owner/:repo/git/refs/:ref', {owner: user, repo: repo, ref: 'heads/' + branch});
  }.bind(this)).then(function (res) {
    shaLatestCommit = res.object.sha;
    return this.get('/repos/:owner/:repo/git/commits/:sha', {owner: user, repo: repo, sha: shaLatestCommit});
  }.bind(this)).then(function (res) {
    shaBaseTree = res.tree.sha;
    return updates;
  }.bind(this)).then(function (updates) {
    return this.post('/repos/:owner/:repo/git/trees', {owner: user, repo: repo, tree: updates, base_tree: shaBaseTree})
  }.bind(this)).then(function (res) {
    shaNewTree = res.sha
    return this.post('/repos/:owner/:repo/git/commits', {owner: user, repo: repo, message: message, tree: shaNewTree, parents: [shaLatestCommit]});
  }.bind(this)).then(function (res) {
    shaNewCommit = res.sha
    return this.patch('/repos/:owner/:repo/git/refs/:ref', {owner: user, repo: repo, ref: 'heads/' + branch, sha: shaNewCommit, force: options.force || false});
  }.bind(this)).nodeify(callback)
};

Client.prototype.pull = function (from, to, msg, callback) {
  var query = {
    owner: to.user,
    repo: to.repo || from.repo,
    base: to.branch || 'master',
    head: from.user + ':' + (from.branch || 'master')
  };
  if (typeof msg.issue === 'number') {
    query.issue = msg.issue.toString()
  } else {
    query.title = msg.title
    query.body = msg.body || ''
  }
  return this.post('/repos/:owner/:repo/pulls', query).nodeify(callback)
}
