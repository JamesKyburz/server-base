const listen = require('test-listen-destroy')
const { test } = require('tap')
const router = require('../')
const request = require('./test-helpers/request')

const getUrl = (fn) => listen(router(fn))

test('router set /foo returns bar', async (t) => {
  t.plan(2)
  const fn = (router, ctx) => {
    t.equal(typeof ctx.use, 'function', 'context set')
    router.set('/foo', {
      get (req, res) {
        res.text('bar')
      }
    })
  }
  const url = await getUrl(fn)
  const res = await request(url + '/foo')
  t.same(res, 'bar', '/foo returns bar')
})
