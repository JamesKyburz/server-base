const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const request = require('request-promise')

const getUrl = (fn) => listen(router(fn))

test(':id', async(t) => {
  t.plan(1)
  const fn = {
    '/test/:id': (req, res, params) => res.text(params.id)
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test/12')
  t.deepEqual(res, '12', 'parameter id correct')
})

test(':name/:id', async(t) => {
  t.plan(1)
  const fn = {
    '/test/:name/:id': (req, res, params) => res.text(params.name + params.id)
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test/john/1')
  t.deepEqual(res, 'john1', 'parameters correct')
})

test('* splat', async (t) => {
  t.plan(1)
  const fn = {
    '/get/:id/*': (req, res, params, splat) => res.text(splat)
  }
  const url = await getUrl(fn)
  const res = await request(url + '/get/x/john/12')
  t.deepEqual(res, 'john/12', 'parameters correct')
})

test('ping', async (t) => {
  t.plan(1)
  const fn = {}
  const url = await getUrl(fn)
  const res = await request(url + '/ping')
  t.deepEqual(res, 'test-server-base-router', 'ping')
})
