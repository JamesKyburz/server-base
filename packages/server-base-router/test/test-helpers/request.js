const http = require('http')
const formurlencoded = require('form-urlencoded').default

module.exports = (url, opt = {}) =>
  new Promise((resolve, reject) => {
    const rejectRequest = (res, body) => {
      const error = new Error(`${res.statusCode} - ${JSON.stringify(body)}`)
      error.statusCode = res.statusCode
      error.error = body
      reject(error)
    }
    const chunks = []
    const { method = 'GET', json = false } = opt
    if (method === 'GET') {
      http.get(url, res => {
        res.on('data', chunk => chunks.push(chunk))
        res.on('error', reject)
        res.on('end', () => {
          const data = chunks.map(x => x.toString()).join('')
          if (res.statusCode < 399) {
            if (opt.resolveWithFullResponse) {
              res.body = data
              resolve(res)
            } else {
              resolve(data)
            }
          } else {
            rejectRequest(res, data)
          }
        })
      })
    } else {
      const post = http.request(url, { method: 'POST' }, res => {
        res.on('data', chunk => chunks.push(chunk))
        res.on('error', reject)
        res.on('end', () => {
          const data = chunks.map(x => x.toString()).join('')
          const body =
            json && res.statusCode < 399 ? JSON.parse(data) : data
          if (res.statusCode < 399) {
            resolve(body)
          } else {
            rejectRequest(res, body)
          }
        })
      })
      if (opt.form) {
        post.write(formurlencoded(opt.form))
      } else {
        post.write(JSON.stringify(opt.body))
      }
      post.end()
    }
  })
