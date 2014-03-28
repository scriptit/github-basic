'use strict'

var assert = require('assert')
var url = require('url')
var STATUS_CODES = require('http').STATUS_CODES
var protocols = { http: require('http'), https: require('https') }
var ports = { http: 80, https: 443 }
var querystring = require('querystring')

var Promise = require('promise')
var barrage = require('barrage')
var parseLinks = require('parse-links')

exports = (module.exports = request)
exports.buffer = buffer
exports.json = json
exports.stream = stream

/**
 * ## github(method, path, query, options, callback)
 *
 * Make a request to one of the github APIs.  Handles redirects transparently and makes errors into proper error objects
 *
 * Usage:
 *
 * ```js
 * var github = require('github-basic')
 *
 * //get all 'ForbesLindesay's gists in the last year
 *
 * var since = new Date()
 * since.setUTCFullYear(since.getUTCFullYear() - 1)
 *
 * // using callbacks
 *
 * github('GET', '/users/:user/gists', {user: 'ForbesLindesay', since: since}, function (err, res) {
 *   if (err) throw err;
 *   res.body.pipe(process.stdout)
 * })
 *
 * // or
 *
 * github('GET', '/users/ForbesLindesay/gists', {since: since}, function (err, res) {
 *   if (err) throw err;
 *   res.body.pipe(process.stdout)
 * })
 *
 * // using promises
 *
 * github('GET', '/users/:user/gists', {user: 'ForbesLindesay', since: since})
 *   .done(function (res) {
 *    res.body.pipe(process.stdout)
 *   })
 *
 * //or
 *
 * github('GET', '/users/ForbesLindesay/gists', {since: since})
 *   .done(function (res) {
 *    res.body.pipe(process.stdout)
 *   })
 * ```
 *
 * Options:
 *
 *  - auth: (default: null) `{type:'oauth',token:'<my oauth token>'}` or `{type:'basic',username:'my user',password:'my password'}`
 *  - timeout: (default: 2 minutes) timeout in ms or string parsed by `ms` like `'30 minutes'`
 *  - protocol: (default: `https`) can be `http` or `https`
 *  - host: (default: `api.github.com`) can be `api.github.com`, `github.com` or `gist.github.com`
 *  - headers: (default: `{}`) override default headers in the request
 *
 * Result:
 *
 * A standard response object with a readable stream as the `.body` property. (N.B. don't stream `res`, stream `res.body`)
 *
 * @param {String} method   Can be `head`, `get`, `delete`, `post`, `patch` or `put`
 * @param {String} path     Path from the docs, e.g. `/gists/public` or `/users/:user/gists`
 * @param {Object} query    Query options, e.g. `{since: new Date(2000, 0, 1)}` or `{user: 'ForbesLindesay'}`
 * @param {Object} options  All the other options
 * @param {Function} callback If ommitted, a promise is returned
 * @returns {Promise|undefined}
 */
function request(method, path, query, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  return new Promise(function (resolve, reject) {
    options = JSON.parse(JSON.stringify(options || {})) //this is a good enough clone
    var protocol = options.protocol == undefined ? 'https' : options.protocol
    var host = options.host == undefined ? 'api.github.com' : options.host
    assert(['http', 'https'].indexOf(protocol) != -1, 'The only supported protocols are `http` and `https`')
    method = method.toLowerCase()
    assert(['head', 'get', 'delete', 'post', 'patch', 'put'].indexOf(method) != -1, 'method must be `head`, `get`, `delete`, `post`, `patch` or `put`')
    assert(query === null || typeof query === 'object', 'query must be an object or `null`')

    query = JSON.parse(JSON.stringify(query))//clone and stringify dates
    path = path.replace(/\:([^\/\.]+)/g, function (_, key) {
      var res = query[key]
      delete query[key]
      return res
    })

    var errPath = path

    var hasBody = query !== null && ('head|get|delete'.indexOf(method) === -1)

    var headers = {
        'host': host,
        'user-agent': 'ForbesLindesay/github-basic',
        'content-length': '0'
    }

    var body
    if (hasBody) {
      body = JSON.stringify(query) + '\n'
      headers['content-length'] = Buffer.byteLength(body, 'utf8')
      headers['content-type'] = 'application/json; charset=utf-8'
    } else if (query !== null) {
      body = querystring.stringify(query)
      if (body.length) path += '?' + body
    }

    if (options.auth) {
      switch (options.auth.type) {
        case 'oauth':
          path += (path.indexOf('?') === -1 ? '?' : '&') + 'access_token=' + encodeURIComponent(options.auth.token)
          break
        case 'basic':
          headers.authorization = 'Basic ' + new Buffer(options.auth.username + ':' + options.auth.password, 'ascii').toString('base64')
          break
        default:
          throw new Error('Auth type of `' + options.auth.type + '` is not recognised.')
          break
      }
    }

    if (options.headers) {
      Object.keys(options.headers)
        .forEach(function (key) {
          headers[key] = options.headers[key]
        })
    }

    var req = protocols[protocol].request({
      scheme: protocol,
      host: host,
      port: ports[protocol],
      path: path,
      method: method,
      agent: false,
      headers: headers
    }, function (res) {
      res.body = barrage(res)
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        var location = url.parse(res.headers.location)
        options.protocol = location.protocol.substring(0, location.protocol.length - 1);
        options.host = location.host
        return resolve(request(method, location.pathname, query, options))
      }
      if (res.statusCode >= 400) {
        return res.body.buffer('utf8')
          .then(function (body) {
            try {
              body = JSON.parse(body)
              var err = new Error(method.toUpperCase() + ': ' + errPath + ' returned ' + body.message)
              err.name = STATUS_CODES[res.statusCode].replace(/ /g, '')
              err.statusCode = (err.code = res.statusCode)
              err.res = res
              res.body = body
              return err
            } catch (ex) {
              var err = new Error(method.toUpperCase() + ': ' + errPath + ' returned:\n' + body.toString())
              err.name = STATUS_CODES[res.statusCode].replace(/ /g, '')
              err.statusCode = (err.code = res.statusCode)
              err.res = res
              res.body = body
              return err
            }
          })
          .done(reject, reject)
      }
      resolve(res)
    })

    if (options.timeout) {
      req.setTimeout(options.timeout)
    }

    req.on('error', function(e) {
      reject(e)
    })

    /*
    Need to properly account for http://nodejs.org/api/http.html#http_response_settimeout_msecs_callback

    If no 'timeout' listener is added to the request, the response, or the server, then sockets are destroyed when they time out.

    req.on('timeout', function() {
      reject(new error.GatewayTimeout())
    })
    */

    // write data to request body
    if (hasBody) {
      req.write(body)
    }
    req.end()
  }).nodeify(callback)
}

/**
 * ## github.buffer(method, path, query, options, callback)
 *
 * Same as `github(method, path, query, options, callback)` except `res.body` is a string containing the buffered response
 */
function buffer(method, path, query, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  return request(method, path, query, options)
    .then(function (res) {
      return res.body.buffer('utf8')
        .then(function (body) {
          res.body = body
          return res
        })
    })
    .nodeify(callback)
}
/**
 * ## github.json(method, path, query, options, callback)
 *
 * Same as `github(method, path, query, options, callback)` except `res.body` is a JSON object containing the parsed response
 */
function json(method, path, query, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  return buffer(method, path, query, options)
    .then(function (res) {
      res.body = JSON.parse(res.body)
      return res
    })
    .nodeify(callback)
}

/**
 * ## github.stream(method, path, query, options)
 *
 * Returns a stream of results from a paginated end point
 */
function stream(path, query, options) {
  query = query || {}
  options = options || {}
  var pageSize = options.pageSize || 100
  var nextLink = null
  var running = false
  function getNextUrl(nextLink) {
    var nextUrl
    if (nextLink) {
      nextUrl = url.parse(nextLink)
    } else {
      var q = JSON.parse(JSON.stringify(query))
      q.per_page = pageSize
      nextUrl = url.parse(url.format({ pathname: path, query: q }))
    }
    return nextUrl
  }
  var source = new barrage.Readable({objectMode: true})
  source._read = function () {
    if (running) return
    running = true
    var apiUrl = getNextUrl(nextLink)
    json('get', apiUrl.pathname, querystring.parse(apiUrl.query), options)
      .then(function (res) {
        var last = true
          , parsedLinks
        if (res.headers.link) {
          parsedLinks = parseLinks(res.headers.link)
          nextLink = parsedLinks.next
          last = !nextLink
        }
        res = res.body
        if (res.length === 0) {
          return source.push(null)
        }
        var cont = true
        for (var i = 0; i < res.length; i++) {
          cont = source.push(res[i])
        }
        if (last) {
          return source.push(null)
        }
        running = false
        if (cont) source._read()
      })
      .done(null, function (err) {
        source.emit('error', err)
        source.push(null)
        running = true
      })
  }
  return source
}
