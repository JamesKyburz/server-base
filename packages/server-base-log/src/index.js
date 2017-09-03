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

    const pretty = process.env.LOG_PRETTY
      ? pino.pretty(opt.pretty)
      : undefined

    if (pretty) {
      pretty.pipe(process.stdout)
      pretty.on('error', reportError)
    }

    log = pino(opt, pretty)
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
