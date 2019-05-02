const listen = require('test-listen-destroy')
const { test } = require('tap')
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

test('@setup middleware gets context and router', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': (ctx, router) => {
      ctx.use((req, res, next) => {
        if (router.get(req.url).handler) return next()
        res.text('default')
      })
    }
  }
  const url = await getUrl(fn)
  const body = await request(url)
  t.deepEqual(body, 'default', '@setup handler returned default response')
})

test('@setup middleware async function', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': async (ctx, router) => {
      ctx.use((req, res, next) => res.text('ok'))
    }
  }
  const url = await getUrl(fn)
  const body = await request(url)
  t.deepEqual(body, 'ok', 'ok response')
})

test('@setup middleware generator function', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': function * (ctx, router) {
      ctx.use((req, res, next) => res.text('ok'))
    }
  }
  const url = await getUrl(fn)
  const body = await request(url)
  t.deepEqual(body, 'ok', 'ok response')
})

test('failing @setup middleware async function', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': async (ctx, router) => {
      return Promise.reject(new Error('oh no'))
    }
  }
  const exit = process.exit
  process.exit = () => {
    process.exit = exit
    t.ok('process.exit(1) called after crash')
  }
  const url = await getUrl(fn)
  await request(url).catch(f => f)
})

test('failing @setup middleware generator function', async (t) => {
  t.plan(1)
  const fn = {
    '@setup': function * (ctx, router) {
      yield (cb) => cb(new Error('oh no'))
    }
  }
  const exit = process.exit
  process.exit = () => {
    process.exit = exit
    t.ok('process.exit(1) called after crash')
  }
  const url = await getUrl(fn)
  await request(url).catch(f => f)
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

test('middleware can be a async function', async (t) => {
  t.plan(1)
  const fn = (router, ctx) => {
    ctx.use(async (req, res, next) => res.text('ok'))
  }
  const url = await getUrl(fn)
  const body = await request(url)
  t.deepEqual(body, 'ok', 'ok response')
})

test('middleware can be a generator', async (t) => {
  t.plan(1)
  const fn = (router, ctx) => {
    ctx.use(function * (req, res, next) { res.text('ok') })
  }
  const url = await getUrl(fn)
  const body = await request(url)
  t.deepEqual(body, 'ok', 'ok response')
})

test('ctx.use can take an array', async (t) => {
  t.plan(2)
  const fn = {
    '@setup': (ctx) => {
      ctx.use([
        (req, res, next) => { res.setHeader('x-custom', 'yes'); next() },
        (req, res, next) => res.text('ok')
      ])
    }
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.js', { resolveWithFullResponse: true })
  t.deepEqual(res.headers['x-custom'], 'yes', 'middleware header set')
  t.deepEqual(res.body, 'ok', 'ok response')
})

test('middleware calling next with error doesn\'t continue', async (t) => {
  t.plan(1)
  const fn = (router, ctx) => {
    ctx.use([
      (req, res, next) => {
        next(new Error('failed'))
      },
      (req, res) => res.end('ok')
    ])
  }
  const url = await getUrl(fn)
  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.message, '500 - "failed"', 'error message set')
  }
})
