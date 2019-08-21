const mime = require('mime')
const path = require('path')
const routes = require('http-hash')
const body = require('raw-body')
const createLog = require('server-base-log')
const runGenerator = require('run-duck-run')
const fs = require('fs')
const querystring = require('querystring')

const json = createBodyParser(JSON.parse)
const form = createBodyParser(data => querystring.parse(data.toString()))

if (process.env.MIME_TYPES) {
  mime.define(JSON.parse(process.env.MIME_TYPES), { force: true })
}

if (process.env.MIME_TYPES_PATH) {
  for (const line of fs
    .readFileSync(process.env.MIME_TYPES_PATH, 'ascii')
    .split(/[\r\n]+/)) {
    const fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/)
    const [key, types] = [fields.shift(), fields]
    if (key) mime.define({ [key]: types })
  }
}

mime.default_type = process.env.MIME_DEFAULT || 'text/html'

module.exports = create

function create (name, routeDefinitions) {
  if (typeof name === 'function' || typeof name === 'object' || !name) {
    routeDefinitions = name
    name = require(`${process.cwd()}/package.json`).name
  }

  let internalErrorMessage = 'Internal system error'

  const context = {
    createLog,
    log: createLog(name),
    mime,
    notFound,
    jsonBody,
    formBody,
    errorReply,
    use,
    middlewareFunctions: [],
    setInternalErrorMessage (message) {
      internalErrorMessage = message
    }
  }

  const router = routes()

  router.set('/ping', ping)
  function ping (req, res) {
    res.end(name)
  }

  use([logRequest, mimeTypes])

  if (routeDefinitions) {
    if (typeof routeDefinitions === 'object') {
      for (const key of Object.keys(routeDefinitions)) {
        if (key === '@setup') {
          callSetup(routeDefinitions[key])
        } else {
          router.set(key, routeDefinitions[key])
        }
      }
    } else {
      routeDefinitions.call(context, router, context)
    }
  }

  return defaultRoute

  function use (fn) {
    const fns = Array.isArray(fn) ? fn : [fn]
    context.middlewareFunctions.push.apply(context.middlewareFunctions, fns)
  }

  function applyMiddleware (req, res, done) {
    const fns = context.middlewareFunctions.slice()
    const next = err => {
      if (err) return res.error(err)
      const fn = fns.shift() || done
      callRoute(fn, req, res, next)
    }
    next()
  }

  function callGenerator (iterator, onError) {
    runGenerator(iterator, err => {
      if (err) onError(err)
    })()
  }

  function callSetup (fn) {
    const bail = err => {
      context.log.error(err)
      process.nextTick(() => process.exit(1))
    }
    const result = fn.call(context, context, router)
    if (result && result.catch) result.catch(bail)
    if (result && result.next) callGenerator(result, bail)
  }

  function callRoute (fn, ...args) {
    const res = args[1]
    const error = err => {
      context.log.error(err)
      res.error(internalErrorMessage, err.statusCode)
    }
    try {
      const result = fn.apply(context, args)
      if (result && result.catch) result.catch(error)
      if (result && result.next) callGenerator(result, error)
    } catch (err) {
      error(err)
    }
  }

  function defaultRoute (req, res) {
    requestHelpers(context, req, res)
    responseHelpers(context, req, res)
    applyMiddleware(req, res, matchRoute)
  }

  function matchRoute (req, res) {
    const match = router.get(req.url)
    if (match.handler) {
      const fn =
        typeof match.handler === 'function'
          ? match.handler
          : methodWrap(context, req.method, match.handler)
      return callRoute(fn, req, res, match.params, match.splat)
    }
    context.notFound(req, res)
  }

  function mimeTypes (req, res, next) {
    const strippedUrl = req.url.split(/\/?\?/)[0]
    let contentType =
      context.mime.getType(path.extname(strippedUrl)) || context.mime.default_type
    if (contentType === 'text/plain' || contentType === 'text/html') {
      contentType += '; charset=utf-8'
    }
    res.setHeader('Content-Type', contentType)
    next()
  }

  function logRequest (req, res, next) {
    context.log.info(req.url)
    next()
  }

  function notFound (req, res) {
    context.log.error('not found %s', req.url)
    res.writeHead(404)
    res.end()
  }

  function errorReply (req, res, err, statusCode) {
    const message = err.message || err
    context.log.child({ req }).error(err)
    res.writeHead(statusCode || 500)
    res.write(message)
    return res.end()
  }

  function formBody (req, res, opt, cb) {
    const args = parseBodyArguments(opt, cb)
    opt = args.opt
    cb = args.cb

    form(req, { limit: opt.limit }, (err, body) => {
      if (err) return res.error(err)
      if (opt && opt.log) context.log.info('form request %s %j', req.url, body)
      try {
        cb(body)
      } catch (err) {
        res.error(err)
      }
    })
  }

  function jsonBody (req, res, opt, cb) {
    const args = parseBodyArguments(opt, cb)
    opt = args.opt
    cb = args.cb
    json(req, { limit: opt.limit }, (err, payload) => {
      if (err) return res.error(err)
      if (opt && opt.log) {
        context.log.info('json request %s %j', req.url, payload)
      }
      try {
        cb(payload)
      } catch (err) {
        res.error(err)
      }
    })
  }
}

function parseBodyArguments (opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  return { opt: { log: true, ...opt }, cb }
}

function methodWrap (context, method, methods) {
  method = method.toLowerCase()
  return (
    methods[method] ||
    ((req, res) =>
      res.error(`method ${method} not allowed for ${req.url}`, 405))
  )
}

function requestHelpers (context, req, res) {
  for (const type of ['json', 'form']) {
    req[type] = (opt, cb) => {
      const args = parseBodyArguments(opt, cb)
      opt = args.opt
      cb = args.cb
      if (typeof cb === 'function') {
        return context[`${type}Body`](req, res, opt, cb)
      }
      return new Promise(resolve => {
        context[`${type}Body`](req, res, opt, data => resolve(data))
      })
    }
  }
}

function responseHelpers (context, req, res) {
  let errorCode
  let errorText
  res.notFound = () => context.notFound(req, res)
  res.setNextErrorMessage = (err, code) => {
    errorText = err
    errorCode = code
  }
  res.setNextErrorCode = code => {
    errorText = ''
    errorCode = code
  }
  res.error = (err, code) => {
    if (errorText && err) context.log.child({ req }).error(err)
    const replyCode =
      errorCode || code || (err && err.statusCode ? err.statusCode : 500)
    const replyText = errorText || err
    context.errorReply(req, res, replyText, replyCode)
  }
  res.json = json => res.end(JSON.stringify(json))
  res.text = res.end.bind(res)
}

function createBodyParser (parse) {
  return (q, opt, cb) => {
    body(q, opt, (err, data) => {
      if (err) return cb(err)
      try {
        cb(null, parse(data))
      } catch (err) {
        cb(err)
      }
    })
  }
}
