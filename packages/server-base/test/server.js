const { test } = require('tap')
const base = require('..')
const http = require('http')

process.env.LOG_LEVEL = 'error'

const get = port =>
  new Promise((resolve, reject) => {
    let data = Buffer.from('')
    http.get(`http://localhost:${port}`, res => {
      res.on('data', chunk => {
        data = Buffer.concat([data, chunk])
      })
      res.on('end', () => resolve(data))
    })
  })

test('test single route', async t => {
  t.plan(1)
  const fn = {
    '/': {
      get (req, res) {
        res.end('hi')
      }
    }
  }
  const server = base(fn).start()
  const response = await get(server.address().port)
  t.same(response, Buffer.from('hi'))
  await new Promise((resolve, reject) => {
    server.once('close', resolve)
    server.close()
  })
})

test('test two servers', async t => {
  t.plan(2)
  const fn1 = {
    '/': {
      get (req, res) {
        res.end('one')
      }
    }
  }
  const fn2 = {
    '/': {
      get (req, res) {
        res.end('two')
      }
    }
  }
  const server1 = base(fn1).start(1234)
  const server2 = base(fn2).start(1235)
  const one = await get(1234)
  const two = await get(1235)
  t.same(one, Buffer.from('one'))
  t.same(two, Buffer.from('two'))
  await new Promise((resolve, reject) => {
    server1.once('close', resolve)
    server1.close()
  })
  await new Promise((resolve, reject) => {
    server2.once('close', resolve)
    server2.close()
  })
})

test('test redefining routes', async t => {
  t.plan(1)
  const fn = {
    '/': {
      get (req, res) {
        res.end('hello')
      }
    }
  }
  base(f => f).start()
  const server = base(fn).start()
  const response = await get(server.address().port)
  t.same(response, Buffer.from('hello'))
  await new Promise((resolve, reject) => {
    server.once('close', resolve)
    server.close()
  })
})

test('test SIGINT shutdown signal', async t => {
  const fn = {
    '/': {
      get (req, res) {
        res.end('hi')
      }
    }
  }
  const server = base(fn).start(1256)
  const response = await get(server.address().port)
  t.same(response, Buffer.from('hi'))
  await new Promise((resolve, reject) => {
    server.once('close', resolve)
    let running = true
    process.exit = () => {
      if (running) t.end()
      running = false
    }
    process.kill(process.pid, 'SIGINT')
  })
})

test('test SIGTERM shutdown signal', async t => {
  const fn = {
    '/': {
      get (req, res) {
        res.end('hi')
      }
    }
  }
  const server = base(fn).start(1256)
  const response = await get(server.address().port)
  t.same(response, Buffer.from('hi'))
  await new Promise((resolve, reject) => {
    server.once('close', resolve)
    let running = true
    process.exit = () => {
      if (running) t.end()
      running = false
    }
    process.kill(process.pid, 'SIGTERM')
  })
})
