const pino = require('pino')

let log

module.exports = createLog

function createLog (name, opt = {}) {
  if (!log) {
    const level = process.env.LOG_LEVEL || 'debug'

    log = pino({
      ...opt,
      serializers: pino.stdSerializers,
      level,
      ...(process.env.LOG_PRETTY && {
        prettyPrint: opt.prettyPrint || { translateTime: true },
        prettier: require('pino-pretty')
      })
    })
    log.on('error', reportError)
  }

  const child = log.child({ name })
  const methods = ['info', 'fatal', 'debug', 'error', 'trace', 'warn']
  for (const method of methods) child[method] = child[method].bind(child)
  return child
}

function reportError (err) {
  console.error("I couldn't log: ", err)
}
