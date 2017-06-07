const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test('setNextErrorMessage', async (t) => {
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

test('setNextErrorCode', async (t) => {
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

test('limit for json', async (t) => {
  t.plan(2)
  const fn = {
    '/*': {
      async post (req, res) {
        await req.json({ limit: '1kb', log: false })
        res.end()
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

test('limit for form', async (t) => {
  t.plan(2)
  const fn = {
    '/*': {
      async post (req, res) {
        await req.form({ limit: '1kb', log: false })
        res.end()
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
