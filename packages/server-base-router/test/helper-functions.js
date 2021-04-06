const listen = require('test-listen-destroy')
const { test } = require('tap')
const router = require('../')
const request = require('./test-helpers/request')

const getUrl = (fn) => listen(router(fn))

test('context functions', async (t) => {
  const fn = {
    '/*': (req, res) => {
      const requestMethods = [
        'json',
        'form'
      ]
      requestMethods.forEach((name) => {
        t.equal(typeof req[name], 'function', `req.${name} is defined`)
      })
      const responseMethods = [
        'text',
        'json',
        'error',
        'setNextErrorMessage',
        'setNextErrorCode'
      ]
      responseMethods.forEach((name) => {
        t.equal(typeof res[name], 'function', `res.${name} is defined`)
      })
      t.end()
      res.end()
    }
  }
  await request((await getUrl(fn)))
})
