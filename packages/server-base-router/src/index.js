const mime = require('mime')
const routes = require('http-hash')
const json = require('body/json')
const form = require('body/form')
const createLog = require('server-base-log')
const isGenerator = require('is-generator-function')
const runGenerator = require('run-duck-run')

const MIME_TYPES = JSON.parse(process.env.MIME_TYPES || '{}')
mime.define(MIME_TYPES)

if (process.env.MIME_TYPES_PATH) mime.load(process.env.MIME_TYPES_PATH)

mime.default_type = process.env.MIME_DEFAULT || 'text/html'

module.exports = create

function create (name, routeDefinitions) {
  if (typeof name === 'function' || typeof name === 'object') {
    routeDefinitions = name
    name = require(`${process.cwd()}/package.json`).name
  }

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

  if (routeDefinitions) {
    if (typeof routeDefinitions === 'object') {
      Object.keys(routeDefinitions).forEach((key) => {
        if (key === '@setup') {
          routeDefinitions[key](context)
        } else {
          router.set(key, routeDefinitions[key])
        }
      })
    } else {
      routeDefinitions.call(context, router, context)
    }
  }

  return defaultRoute

  function use (fn) {
    const fns = Array.isArray(fn) ? fn : [fn]
    context.middlewareFunctions.push.apply(context.middlewareFunctions, fns)
  }

  function applyMiddleware (q, r, done) {
    const fns = context.middlewareFunctions.slice()
    ;(function next () {
      const fn = (fns.shift() || done)
      callRoute(fn)(q, r, next)
    })()
  }

  function callRoute (fn) {
    return function () {
      const r = arguments[1]
      const handler = isGenerator(fn) ? runGenerator(fn, (err) => {
        if (err) r.error(err)
      }) : fn
      const result = handler.apply(context, arguments)
      if (result && result.catch) result.catch(r.error)
    }
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
        return callRoute(fn)(q, r, match.params, match.splat)
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

    form(q, { limit: opt.limit }, (err, body) => {
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
    json(q, r, { limit: opt.limit }, (err, payload) => {
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
      return new Promise((resolve) => {
        context[`${type}Body`](q, r, opt, (data) => resolve(data))
      })
    }
  })
}

function responseHelpers (context, q, r) {
  let errorCode
  let errorText
  r.notFound = () => context.notFound(q, r)
  r.setNextErrorMessage = (err, code) => { errorText = err; errorCode = code }
  r.setNextErrorCode = (code) => { errorText = ''; errorCode = code }
  r.error = (err, code) => {
    code = code || err.statusCode
    if (errorText) context.log.child({ req: q }).error(err)
    context.errorReply(q, r, errorText || err, errorCode || code || 500)
  }
  r.json = (json) => r.end(JSON.stringify(json))
  r.text = r.end.bind(r)
}
