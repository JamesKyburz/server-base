const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test('context functions', async (t) => {
  const fn = {
    '@setup': (ctx) => {
      const functions = [
        'createLog',
        'notFound',
        'jsonBody',
        'formBody',
        'errorReply',
        'use'
      ]
      functions.forEach((name) => {
        t.is(typeof ctx[name], 'function', `${name} is defined`)
      })
      t.is(typeof ctx.mime, 'object', 'mime is defined')
      t.is(typeof ctx.log, 'object', 'log is defined')
      const pinoMethods = ['info', 'fatal', 'debug', 'error', 'trace', 'warn', 'child']
      pinoMethods.forEach((name) => {
        t.is(typeof ctx.log[name], 'function', `log.${name} is defined`)
      })
      t.true(Array.isArray(ctx.middlewareFunctions), 'middlewareFunctions exposed')
    },
    '/*': (req, res) => {
      res.end()
      t.end()
    }
  }
  const url = await getUrl(fn)
  await request(url)
})
