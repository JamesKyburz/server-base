const listen = require('test-listen-destroy')
const { test } = require('tap')
const router = require('../')
const request = require('./test-helpers/request')

const getUrl = fn => listen(router(fn))

test('get /foo captures error in 1 middleware function', async t => {
  t.plan(3)
  const fn = {
    '@setup': ctx => {
      ctx.onError([
        (req, res, error, next) => {
          t.equal(error.message, 'something went wrong')
          next()
        }
      ])
    },
    '/foo': {
      async get (req, res) {
        throw new TypeError('something went wrong')
      }
    }
  }
  try {
    const url = await getUrl(fn)
    const res = await request(url + '/foo')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('post /foo captures error in 1 middleware function', async t => {
  t.plan(3)
  const fn = {
    '@setup': ctx => {
      ctx.onError([
        (req, res, error, next) => {
          t.equal(error.message, 'something went wrong')
          next()
        }
      ])
    },
    '/foo': {
      async post (req, res) {
        await req.json()
        throw new TypeError('something went wrong')
      }
    }
  }
  try {
    const url = await getUrl(fn)
    const res = await request(url + '/foo', {
      method: 'POST',
      body: { crash: true },
      json: true
    })
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})

test('get with multiple error middleware functions', async t => {
  t.plan(5)
  const fn = {
    '@setup': ctx => {
      ctx.onError([
        (req, res, error, next) => {
          t.equal(error.message, 'something went wrong')
          next()
        },
        async (req, res, error, next) => {
          t.equal(error.message, 'something went wrong')
          next()
        },
        function * (req, res, error, next) {
          t.equal(error.message, 'something went wrong')
          next()
        }
      ])
    },
    '/foo': {
      async get (req, res) {
        throw new TypeError('something went wrong')
      }
    }
  }
  try {
    const url = await getUrl(fn)
    const res = await request(url + '/foo')
  } catch (res) {
    t.equal(res.statusCode, 500, '500 status code')
    t.equal(res.error, 'Internal system error')
  }
})
