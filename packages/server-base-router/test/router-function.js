const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test('router set /foo returns bar', async (t) => {
  t.plan(2)
  const fn = (router, ctx) => {
    t.is(typeof ctx.use, 'function', 'context set')
    router.set('/foo', {
      get (req, res) {
        res.text('bar')
      }
    })
  }
  const url = await getUrl(fn)
  const res = await request(url + '/foo')
  t.deepEqual(res, 'bar', '/foo returns bar')
})
