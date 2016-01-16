var http = require('http')
var log = require('./log')
var dotenv = require('dotenv')
var router = require('./router')
dotenv.load({ silent: true })

module.exports = create

function create (name, routes) {
  var server

  var methods = {
    start: start,
    config: config()
  }

  return methods

  function start (port) {
    server = http.createServer(router(name, log, routes))
    server.listen(port || process.env.PORT, running)
    return server
  }

  function config () {
    return {
      assert: assert
    }
  }

  function assert (keys) {
    keys.forEach(function (key) {
      if (typeof process.env[key] === 'undefined') throw new Error('process.env.' + key + ' is missing')
    })
    return methods
  }

  function running () {
    log(name + ':httpserver').info('running on http://localhost:%s', server.address().port)
  }
}
