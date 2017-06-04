const http = require('http')
const log = require('./log')
const dotenv = require('dotenv')
const router = require('./router')
dotenv.load()

const started = {}

module.exports = create

function create (name, routes) {
  if (typeof name === 'function') {
    routes = name
    name = require(`${process.cwd()}/package.json`).name
  }
  let server

  process.nextTick(() => {
    if (!server) start()
  })

  const methods = {
    start: start,
    config: config()
  }

  return methods

  function start (port) {
    port = port || process.env.PORT || 0
    server = started[port]
    if (!server) {
      server = http.createServer()
      server.listen(port, running)
      started[port] = server
    }
    addRoutes()
    return server
  }

  function addRoutes () {
    server.removeAllListeners('request')
    server.on('request', router(name, routes))
  }

  function config () {
    return {
      assert: assert
    }
  }

  function assert (keys) {
    keys.forEach(function (key) {
      if (typeof process.env[key] === 'undefined') {
        throw new Error(`process.env.${key} is missing`)
      }
    })
    return methods
  }

  function running () {
    log(name + ':httpserver').info('running on http://localhost:%s', server.address().port)
  }
}
