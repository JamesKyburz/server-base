const listen = require('test-listen-destroy')
const { test } = require('tap')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test('get /foo returns bar', async (t) => {
  t.plan(1)
  const fn = {
    '/foo': {
      async get (req, res) {
        res.text('bar')
      }
    }
  }
  const url = await getUrl(fn)
  const res = await request(url + '/foo')
  t.deepEqual(res, 'bar', '/foo returns bar')
})

test('post /echo json returns given payload', async (t) => {
  t.plan(1)
  const fn = {
    '/*': {
      async post (req, res) {
        const json = await req.json()
        res.json(json)
      }
    }
  }
  const url = await getUrl(fn)

  const body = await request(url, {
    method: 'POST',
    body: { echo: 'echo' },
    json: true
  })

  t.deepEqual(body, { echo: 'echo' }, 'json response')
})

test('post /echo form returns given payload', async (t) => {
  t.plan(1)
  const fn = {
    '/*': {
      async post (req, res) {
        const form = await req.form()
        res.json(form)
      }
    }
  }
  const url = await getUrl(fn)

  const body = await request(url, {
    method: 'POST',
    form: { echo: 'echo', i: '42' },
    json: true
  })

  t.deepEqual(body, { echo: 'echo', i: '42' }, 'form response')
})
