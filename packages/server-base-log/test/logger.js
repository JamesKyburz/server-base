const { test } = require('tap')
const { fork } = require('child_process')
const createLog = require('..')

const logMethods = ['info', 'fatal', 'debug', 'error', 'trace', 'warn']
const log = createLog('test')

if (process.env.FORK) {
  for (const method of logMethods) {
    log[method](`t.equal is a ${method} message`)
  }
  const req = {
    method: 'PUT'
  }
  const res = {
    statusCode: 200
  }
  log.child({ res }).info('response!')
  log.child({ r: res }).info('response!')
  log.child({ req }).info('request!')
  log.child({ q: req }).info('response!')
} else {
  test('standard log functions', t => {
    for (const method of [...logMethods, 'child']) {
      t.equal(typeof log[method], 'function')
    }
    for (const method of logMethods) {
      t.equal(typeof log.child(method)[method], 'function')
    }
    t.end()
  })

  test('all', async t => {
    const ps = fork(__filename, {
      env: { FORK: 1, LOG_LEVEL: 'trace' },
      stdio: 'pipe'
    })
    const captured = await captureStdout(ps)
    const assertions = logMethods.map(
      method => new RegExp(`t.equal is a ${method} message`)
    )
    for (const assertion of assertions) {
      t.ok(assertion.test(captured))
    }
    t.end()
  })

  test('default debug level', async t => {
    const ps = fork(__filename, {
      env: { FORK: 1 },
      stdio: 'pipe'
    })
    const captured = await captureStdout(ps)
    t.ok(!/t.equal is a trace message/.test(captured))
    t.end()
  })

  test('default pretty output has datetime', async t => {
    const ps = fork(__filename, {
      env: { FORK: 1, LOG_PRETTY: 1 },
      stdio: 'pipe'
    })
    const captured = await captureStdout(ps)
    t.ok(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/.test(captured))
    t.end()
  })

  test('default serializers', async t => {
    const ps = fork(__filename, {
      env: { FORK: 1, LOG_PRETTY: 1 },
      stdio: 'pipe'
    })
    const captured = await captureStdout(ps)
    t.ok(/res: \{\n\s*"statusCode":\s*200\s*\}/.test(captured))
    t.ok(/r: \{\n\s*"statusCode":\s*200\s*\}/.test(captured))
    t.ok(/q: \{\n\s*"method":\s*"PUT"\s*\}/.test(captured))
    t.ok(/req: \{\n\s*"method":\s*"PUT"\s*\}/.test(captured))
    t.end()
  })
}

async function captureStdout (ps) {
  return new Promise((resolve, reject) => {
    let captured = ''
    ps.stdout.on('data', data => {
      captured += data
    })
    ps.on('exit', () => {
      resolve(captured)
    })
  })
}
