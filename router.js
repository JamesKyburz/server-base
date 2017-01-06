var mime = require('mime')
var routes = require('http-hash')
var json = require('body/json')
var form = require('body/form')

var MIME_TYPES = JSON.parse(process.env.MIME_TYPES || '{}')
mime.define(MIME_TYPES)

mime.default_type = 'text/html'

module.exports = create

function create (name, createLog, routeDefinitions) {
  var middlewareFunctions = []
  var context = {
    createLog: createLog,
    log: createLog(name),
    mime: mime,
    notFound: notFound,
    jsonBody: jsonBody,
    formBody: formBody,
    errorReply: errorReply,
    use: use
  }

  var log = context.log

  var router = routes()

  router.set('/ping', ping)
  function ping (q, r) { r.end(name) }

  use([logRequest, mimeTypes])
  if (routeDefinitions) routeDefinitions.call(context, router, context)

  return defaultRoute

  function use (fn) {
    var fns = Array.isArray(fn) ? fn : [fn]
    middlewareFunctions.push.apply(middlewareFunctions, fns)
  }

  function applyMiddelware (q, r, done) {
    var fns = middlewareFunctions.slice()
    ;(function next () {
      (fns.shift() || done).call(context, q, r, next)
    })()
  }

  function defaultRoute (q, r) {
    applyMiddelware(q, r, function () {
      var match = router.get(q.url)
      if (match.handler) return match.handler(q, r, match.params, match.splat)
      notFound(q, r)
    })
  }

  function mimeTypes (q, r, next) {
    var contentType = mime.lookup(q.url)
    var charset = mime.charsets.lookup(contentType)
    if (charset) contentType += '; charset=' + charset
    r.setHeader('Content-Type', contentType)
    next()
  }

  function logRequest (q, r, next) {
    log.info(q.url)
    next()
  }

  function notFound (q, r) {
    log.error('not found %s', q.url)
    r.writeHead(404)
    r.end()
  }

  function errorReply (q, r, err, statusCode) {
    var message = err.message || err
    log.error('error %s %s', q.url, message)
    r.writeHead(statusCode || 500)
    r.write(message)
    return r.end()
  }

  function formBody (q, r, cb) {
    form(q, {}, (err, body) => {
      if (err) return errorReply(q, r, err)
      log.info('form request %s %j', q.url, body)
      try {
        cb(body)
      } catch (err) {
        errorReply(q, r, err)
      }
    })
  }

  function jsonBody (q, r, cb) {
    json(q, r, (err, payload) => {
      if (err) return errorReply(q, r, err)
      log.info('json request %s %j', q.url, payload)
      try {
        cb(payload)
      } catch (err) {
        errorReply(q, r, err)
      }
    })
  }
}
