const mime = require('mime')
const routes = require('http-hash')
const json = require('body/json')
const form = require('body/form')
const createLog = require('server-base-log')
const isGenerator = require('is-generator-function')
const runGenerator = require('run-duck-run')

const MIME_TYPES = JSON.parse(process.env.MIME_TYPES || '{}')
mime.define(MIME_TYPES)

mime.default_type = 'text/html'

module.exports = create

function create (name, routeDefinitions) {
  const context = {
    createLog: createLog,
    log: createLog(name),
    mime: mime,
    notFound: notFound,
    jsonBody: jsonBody,
    formBody: formBody,
    errorReply: errorReply,
    use: use,
    middlewareFunctions: []
  }

  const router = routes()

  router.set('/ping', ping)
  function ping (q, r) { r.end(name) }

  use([logRequest, mimeTypes])
  if (routeDefinitions) routeDefinitions.call(context, router, context)

  return defaultRoute

  function use (fn) {
    const fns = Array.isArray(fn) ? fn : [fn]
    context.middlewareFunctions.push.apply(context.middlewareFunctions, fns)
  }

  function applyMiddleware (q, r, done) {
    const fns = context.middlewareFunctions.slice()
    ;(function next () {
      const fn = (fns.shift() || done)
      if (isGenerator(fn)) {
        runGenerator(fn, (err) => {
          if (err) r.error(err)
        })(q, r, next)
      } else {
        fn.call(context, q, r, next)
      }
    })()
  }

  function defaultRoute (q, r) {
    requestHelpers(context, q, r)
    responseHelpers(context, q, r)
    applyMiddleware(q, r, function () {
      const match = router.get(q.url)
      if (match.handler) {
        const fn = typeof match.handler === 'function'
        ? match.handler
        : methodWrap(context, q.method, match.handler)
        const handler = isGenerator(fn) ? runGenerator(fn, (err) => {
          if (err) r.error(err)
        }) : fn
        return handler(q, r, match.params, match.splat)
      }
      context.notFound(q, r)
    })
  }

  function mimeTypes (q, r, next) {
    let contentType = context.mime.lookup(q.url)
    const charset = context.mime.charsets.lookup(contentType)
    if (charset) contentType += '; charset=' + charset
    r.setHeader('Content-Type', contentType)
    next()
  }

  function logRequest (q, r, next) {
    context.log.info(q.url)
    next()
  }

  function notFound (q, r) {
    context.log.error('not found %s', q.url)
    r.writeHead(404)
    r.end()
  }

  function errorReply (q, r, err, statusCode) {
    const message = err.message || err
    context.log.child({ req: q }).error(err)
    r.writeHead(statusCode || 500)
    r.write(message)
    return r.end()
  }

  function formBody (q, r, opt, cb) {
    const args = parseBodyArguments(opt, cb); opt = args.opt; cb = args.cb
    form(q, {}, (err, body) => {
      if (err) return r.error(err)
      if (opt && opt.log) context.log.info('form request %s %j', q.url, body)
      try {
        cb(body)
      } catch (err) {
        r.error(err)
      }
    })
  }

  function jsonBody (q, r, opt, cb) {
    const args = parseBodyArguments(opt, cb); opt = args.opt; cb = args.cb
    json(q, r, (err, payload) => {
      if (err) return r.error(err)
      if (opt && opt.log) context.log.info('json request %s %j', q.url, payload)
      try {
        cb(payload)
      } catch (err) {
        r.error(err)
      }
    })
  }
}

function parseBodyArguments (opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  opt = Object.assign({ log: true }, opt)
  return { opt, cb }
}

function methodWrap (context, method, methods) {
  method = method.toLowerCase()
  return methods[method] ||
    ((q, r) => r.error(`method ${method} not allowed for ${q.url}`, 405))
}

function requestHelpers (context, q, r) {
  ;['json', 'form'].forEach((type) => {
    q[type] = (opt, cb) => {
      const args = parseBodyArguments(opt, cb); opt = args.opt; cb = args.cb
      if (typeof cb === 'function') return context[`${type}Body`](q, r, opt, cb)
      return (cb) => context[`${type}Body`](q, r, opt, (data) => cb(null, data))
    }
  })
}

function responseHelpers (context, q, r) {
  let errorCode
  let errorText
  r.notFound = context.notFound.bind(context, q, r)
  r.setNextErrorMessage = (err, code) => { errorText = err; errorCode = code }
  r.setNextErrorCode = (code) => { errorText = ''; errorCode = code }
  r.error = (err, code) => {
    context.errorReply(q, r, errorText || err, errorCode || code || 500)
  }
  r.json = (json) => r.end(JSON.stringify(json))
  r.text = r.end.bind(r)
}
