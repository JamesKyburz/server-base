process.chdir(__dirname)
const { test } = require('tap')
const base = require('..')

test('config loads environment variables', t => {
  t.plan(1)
  t.equals(process.env.PORT, '7000')
})

test('ok assertion of environment variables', t => {
  t.plan(1)
  base('test', f => f)
    .config.assert(['PORT'])
    .start()
    .close()

  t.pass()
})

test('bad assertion of environment variables', t => {
  t.plan(1)
  process.exit = f => f
  t.throws(f => {
    base('test', f => f)
      .config.assert(['FAIL'])
  })
  process.kill(process.pid, 'SIGTERM')
})
