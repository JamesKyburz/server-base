const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test('@setup middleware prevents request', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': (ctx) => {
      ctx.use((req, res, next) => res.error(new Error('no')))
    }
  }
  const url = await getUrl(fn)
  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.message, '500 - "no"', 'error message set')
  }
})

test('.use middleware prevents request', async (t) => {
  t.plan(1)
  const fn = (router, ctx) => {
    ctx.use((req, res, next) => res.error(new Error('no')))
  }
  const url = await getUrl(fn)
  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.message, '500 - "no"', 'error message set')
  }
})