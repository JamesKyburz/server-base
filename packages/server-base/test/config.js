process.chdir(__dirname)
const { test } = require('tap')
const base = require('..')

test('config loads environment variables', t => {
  t.plan(1)
  t.equals(process.env.PORT, '7000')
})
