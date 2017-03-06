const mime = require('mime')
const routes = require('http-hash')
const json = require('body/json')
const form = require('body/form')
const createLog = require('server-base-log')
const isGenerator = require('is-generator-function')

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
  const set = router.set.bind(router)

  router.set = (match, fn) => {
    if (isGenerator(fn)) {
      set(match, runGenerator(fn, context))
    } else {
      set(match, fn)
    }
  }

  router.set('/ping', ping)
  function ping (q, r) { r.end(name) }

  use([logRequest, mimeTypes])
  if (routeDefinitions) routeDefinitions.call(context, router, context)

  return defaultRoute

  function use (fn) {
    const fns = Array.isArray(fn) ? fn : [fn]
    context.middlewareFunctions.push.apply(context.middlewareFunctions, fns)
  }

  function applyMiddelware (q, r, done) {
    const fns = context.middlewareFunctions.slice()
    ;(function next () {
      const fn = (fns.shift() || done)
      if (isGenerator(fn)) {
        runGenerator(fn, context)(q, r, next)
      } else {
        fn.call(context, q, r, next)
      }
    })()
  }

  function defaultRoute (q, r) {
    requestHelpers(context, q, r)
    responseHelpers(context, q, r)
    applyMiddelware(q, r, function () {
      const match = router.get(q.url)
      if (match.handler) {
        return match.handler(q, r, match.params, match.splat)
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
    context.log.error('error %s %s', q.url, message)
    r.writeHead(statusCode || 500)
    r.write(message)
    return r.end()
  }

  function formBody (q, r, opt, cb) {
    const args = parseBodyArguments(opt, cb); opt = args.opt; cb = args.cb
    form(q, {}, (err, body) => {
      if (err) return context.errorReply(q, r, err)
      if (opt && opt.log) context.log.info('form request %s %j', q.url, body)
      try {
        cb(body)
      } catch (err) {
        context.errorReply(q, r, err)
      }
    })
  }

  function jsonBody (q, r, opt, cb) {
    const args = parseBodyArguments(opt, cb); opt = args.opt; cb = args.cb
    json(q, r, (err, payload) => {
      if (err) return context.errorReply(q, r, err)
      if (opt && opt.log) context.log.info('json request %s %j', q.url, payload)
      try {
        cb(payload)
      } catch (err) {
        context.errorReply(q, r, err)
      }
    })
  }

  function parseBodyArguments (opt, cb) {
    if (typeof opt === 'function') {
      cb = opt
      opt = {}
    }
    opt = Object.assign({ log: true }, opt)
    return { opt, cb }
  }
}

function requestHelpers (context, q, r) {
  ;['json', 'form'].forEach((type) => {
    q[type] = (cb) => {
      if (cb) return context[`${type}Body`](q, r, cb)
      return (cb) => context[`${type}Body`](q, r, (data) => cb(null, data))
    }
  })
}

function responseHelpers (context, q, r) {
  let errorCode
  let errorText
  r.notFound = context.notFound.bind(context, q, r)
  r.setNextErrorMessage((code, text) => {
    errorCode = code
    errorText = text
  })
  r.error = (err) => {
    context.errorReply(q, r, errorCode || 500, errorText || err)
  }

  Object.defineProperty(r, 'onErrorCode', {
    set (code) { errorCode = code },
    get () { return errorCode }
  })
}

function runGenerator (fn, context) {
  return function (q, r, params, splat) {
    const it = fn.apply(this, [q, r, params, splat])
    next(it.next())
    function next (result) {
      if (result.done) return
      if (Promise.resolve(result.value) === result.value) {
        result.value
          .then((value) => next(it.next(value)))
          .catch(r.error)
        return
      }
      if (typeof result.value === 'function') {
        result.value((err, value) => {
          if (err) return r.error(err)
          next(it.next(value))
        })
      } else {
        next(it.next(result.value))
      }
    }
  }
}
