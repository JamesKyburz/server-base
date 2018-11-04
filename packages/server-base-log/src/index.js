const pino = require('pino')

let log

module.exports = createLog

function createLog (name, opt) {
  if (!log) {
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
    }, opt)

    if (process.env.LOG_PRETTY) {
      opt.prettyPrint = opt.prettyPrint || { translateTime: true }
      opt.prettier = require('pino-pretty')
    }

    log = pino(opt)
    log.on('error', reportError)
  }

  const child = log.child({ name })
  const methods = ['info', 'fatal', 'debug', 'error', 'trace', 'warn']
  methods.forEach((key) => { child[key] = child[key].bind(child) })

  return child
}

function reportError (err) {
  console.error("I couldn't log: ", err)
}
