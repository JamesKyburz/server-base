const http = require('http')
const log = require('./log')
const dotenv = require('dotenv')
const router = require('./router')
dotenv.config()

const started = {}

module.exports = create

create.log = log
create.router = router

function create (name, routes) {
  if (typeof name === 'function' || typeof name === 'object' || !name) {
    routes = name
    name = require(`${process.cwd()}/package.json`).name
  }
  let server

  process.nextTick(() => {
    if (!server) start()
  })

  const methods = {
    start,
    listen: start,
    config: config()
  }

  const shutdown = port => () => {
    if (server) {
      server.close()
      server = null
      delete started[port]
    }
    process.exit(0)
  }

  return methods

  function start (port, cb) {
    port = port || process.env.PORT || 0
    server = started[port]
    if (!server) {
      server = http.createServer()
      server.listen(port, cb || running)
      started[port] = server
      process.once('SIGINT', shutdown(port))
      process.once('SIGTERM', shutdown(port))
    }
    addRoutes(port)
    return server
  }

  function addRoutes (port) {
    server.removeAllListeners('request')
    server.on('request', router(name, routes))
    server.on('close', () => {
      delete started[port]
      server = null
    })
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
    log(name + ':httpserver').info(
      'running on http://localhost:%s',
      server.address().port
    )
  }
}
