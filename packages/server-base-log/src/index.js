const pino = require('pino')

module.exports = createLog

function createLog (name, opt) {
  const level = process.env.LOG_LEVEL || 'debug'

  opt = Object.assign({}, {
    safe: true,
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      q: pino.stdSerializers.req,
      r: pino.stdSerializers.res
    },
    level: level
  }, opt, { name })

  const pretty = process.env.LOG_PRETTY
    ? pino.pretty(opt.pretty)
    : undefined

  if (pretty) {
    pretty.pipe(process.stdout)
    pretty.on('error', reportError)
  }

  const log = pino(opt, pretty)
  log.on('error', reportError)

  const logMethods = ['info', 'fatal', 'debug', 'error', 'trace', 'warn']
  logMethods.forEach((key) => { log[key] = log[key].bind(log) })

  return log
}

function reportError (err) {
  console.error("I couldn't log: ", err)
}
