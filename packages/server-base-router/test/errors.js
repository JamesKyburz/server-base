const listen = require('test-listen-destroy')
const { test } = require('tap')
const router = require('../')
const request = require('request-promise')

const getUrl = fn => listen(router(fn))

test('setNextErrorMessage', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async get (req, res) {
        res.setNextErrorMessage('invalid request :(', 400)
        res.error(new Error('failed'), 500)
      }
    }
  }
  const url = await getUrl(fn)

  try {
    await request(url)
  } catch (res) {
    t.equal(res.statusCode, 400, '400 status code')
    t.equal(res.error, 'invalid request :(', 'error message')
  }
})

test('setNextErrorCode', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async get (req, res) {
        res.setNextErrorCode(420)
        res.error(new Error('failed'), 500)
      }
    }
  }
  const url = await getUrl(fn)

  try {
    await request(url)
  } catch (res) {
    t.equal(res.statusCode, 420, '420 status code')
    t.equal(res.error, 'failed', 'error message')
  }
})

test('limit for json', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async post (req, res) {
        await req.json({ limit: '1kb', log: false })
      }
    }
  }
  const url = await getUrl(fn)

  try {
    await request(url, {
      method: 'POST',
      body: { echo: '*'.repeat(1024) },
      json: true
    })
  } catch (res) {
    t.equal(res.statusCode, 413, '413 status code')
    t.equal(res.error, 'request entity too large', 'too large error')
  }
})

test('limit for form', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async post (req, res) {
        await req.form({ limit: '1kb', log: false })
      }
    }
  }
  const url = await getUrl(fn)

  try {
    await request(url, {
      method: 'POST',
      form: { foo: '*'.repeat(1024) }
    })
  } catch (res) {
    t.equal(res.statusCode, 413, '413 status code')
    t.equal(res.error, 'request entity too large', 'too large error')
  }
})

test('test handled error in generator', async t => {
  t.plan(1)
  const fn = {
    '/*': {
      * get (req, res) {
        try {
          yield Promise.reject(new Error('error'))
        } catch (e) {}
        res.end('ok')
      }
    }
  }
  const url = await getUrl(fn)

  const res = await request(url + '/')
  t.deepEqual(res, 'ok', '/ returned ok')
})

test('internal system errors, handle async error in generator', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      * get (req, res) {
        yield Promise.reject(new Error('secret stacktrace'))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system errors, handle async error in generator when setNextErrorMessage is set', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      * get (req, res) {
        res.setNextErrorMessage('override error', 400)
        yield Promise.reject(new Error('secret stacktrace'))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 400, '400 status code')
    t.equal(res.error, 'override error')
  }
})

test('internal system errors, handle async error in async function', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async get (req, res) {
        await Promise.reject(new Error('secret stacktrace'))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system errors, handle async error in async function when setNextErrorMessage is set', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async get (req, res) {
        res.setNextErrorMessage('override error', 400)
        await Promise.reject(new Error('secret stacktrace'))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 400, '400 status code')
    t.equal(res.error, 'override error')
  }
})

test('internal system errors, handle sync error in async function', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      async get (req, res) {
        const n = null
        n()
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system errors, handle sync error in generator function', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      * get (req, res) {
        const n = null
        n()
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system errors, handle sync error in a sync function', async t => {
  t.plan(2)
  const fn = {
    '/*': {
      get (req, res) {
        const n = null
        n()
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system error preserves statusCode for promises', async t => {
  t.plan(2)
  class CustomError extends Error {
    constructor (code) {
      super('secret stacktrace')
      this.statusCode = code
      Error.captureStackTrace(this, CustomError)
    }
  }
  const fn = {
    '/*': {
      async get (req, res) {
        return Promise.reject(new CustomError(404))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 404, '404 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system error preserves statusCode for generators', async t => {
  t.plan(2)
  class CustomError extends Error {
    constructor (code) {
      super('secret stacktrace')
      this.statusCode = code
      Error.captureStackTrace(this, CustomError)
    }
  }
  const fn = {
    '/*': {
      * get (req, res) {
        yield Promise.reject(new CustomError(404))
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 404, '404 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('internal system error preserves statusCode for synchronous code', async t => {
  t.plan(2)
  class CustomError extends Error {
    constructor (code) {
      super('secret stacktrace')
      this.statusCode = code
      Error.captureStackTrace(this, CustomError)
    }
  }
  const fn = {
    '/*': {
      get (req, res) {
        throw new CustomError(404)
      }
    }
  }
  try {
    const url = await getUrl(fn)
    await request(url + '/')
  } catch (res) {
    t.equal(res.statusCode, 404, '404 status code')
    t.equal(res.error, 'Internal system error')
  }
})
