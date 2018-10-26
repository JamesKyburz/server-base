delete require.cache[require.resolve('../')]

require('events').EventEmitter.defaultMaxListeners = 100

process.env.MIME_TYPES = '{"custom/mime": ["x"]}'
process.env.MIME_TYPES_PATH = './mime.types'
process.env.MIME_DEFAULT = 'text/plain'

const listen = require('test-listen-destroy')
const test = require('tape')
const router = require('../')
const mime = require('mime')

const request = require('request-promise')

const getUrl = fn => listen(router(fn))

test('*.txt returns text/plain', async t => {
  t.plan(1)
  const fn = {
    '/test.txt': (req, res) => res.text('test')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.txt', {
    resolveWithFullResponse: true
  })
  t.deepEqual(
    res.headers['content-type'],
    'text/plain; charset=UTF-8',
    'correct content-type'
  )
})

test('*.js returns application/javascript', async t => {
  t.plan(1)
  const fn = {
    '/test.js': (req, res) => res.text('//')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.js', { resolveWithFullResponse: true })
  t.deepEqual(
    res.headers['content-type'],
    'application/javascript',
    'correct content-type'
  )
})

test('default mime type is text/plain', async t => {
  t.plan(1)
  const fn = {
    '/test.foo': (req, res) => res.text('//')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.foo', {
    resolveWithFullResponse: true
  })
  t.deepEqual(
    res.headers['content-type'],
    'text/plain; charset=UTF-8',
    'correct content-type'
  )
})

test('custom mime with env', async t => {
  t.plan(1)
  const fn = {
    '/test.x': (req, res) => res.text('//')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.x', { resolveWithFullResponse: true })
  t.deepEqual(
    res.headers['content-type'],
    'custom/mime',
    'correct content-type'
  )
})

test('overriding mime types', async t => {
  t.plan(1)
  const fn = {
    '@setup': ({ mime }) => {
      mime.define({ 'custom/mime2; charset=UTF-8': ['x'] }, { force: true })
    },
    '/test.x': (req, res) => res.text('//')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.x', { resolveWithFullResponse: true })
  t.deepEqual(
    res.headers['content-type'],
    'custom/mime2; charset=UTF-8',
    'correct content-type'
  )
})

test('load mime types file', async t => {
  t.plan(1)
  const fn = {
    '/test.didgeridoo': (req, res) => res.json({})
  }
  const url = await getUrl(fn)
  const res = await request(url + '/test.didgeridoo', {
    resolveWithFullResponse: true
  })
  t.deepEqual(
    res.headers['content-type'],
    'model/didgeridoo+json',
    'correct content-type'
  )
})

test('mime types lookup only uses extension', async t => {
  t.plan(1)
  const fn = {
    '@setup': ({ mime }) => {
      mime.define({ 'custom/mime2; charset=UTF-8': ['x'] }, { force: true })
    },
    '/application': (req, res) => res.text('')
  }
  const url = await getUrl(fn)
  const res = await request(url + '/application', {
    resolveWithFullResponse: true
  })
  let expectedMimetype = 'text/plain; charset=UTF-8'
  t.deepEqual(
    res.headers['content-type'],
    expectedMimetype,
    'content-type is set to default mime type'
  )
})
