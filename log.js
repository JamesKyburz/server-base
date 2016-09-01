var bunyan = require('bunyan')
var Pretty = require('bunyan-prettystream')

module.exports = createLog

function createLog (name) {
  var level = process.env.LOG_LEVEL || 'debug'
  var pretty = process.env.LOG_PRETTY ? new Pretty() : null

  var opt = {
    level: level,
    name: name,
    serializers: bunyan.stdSerializers
  }

  if (pretty) {
    opt.type = 'raw'
    opt.stream = pretty
    pretty.pipe(process.stdout)
  } else {
    opt.stream = process.stdout
  }

  var bunyanlog = bunyan.createLogger(opt)
  bunyanlog.on('error', (err, stream) => console.error("I couldn't log: ", err))

  return ['info', 'fatal', 'debug', 'error', 'trace', 'warn']
    .reduce((sum, key) => {
      sum[key] = bunyanlog[key].bind(bunyanlog)
      return sum
    }, {})
}
