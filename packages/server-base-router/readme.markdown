# server base router

The router used by [server-base](https://npm.im/server-base)

[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![build status](https://api.travis-ci.org/JamesKyburz/server-base.svg)](https://travis-ci.org/JamesKyburz/server-base)
[![downloads](https://img.shields.io/npm/dm/server-base-router.svg)](https://npmjs.org/package/server-base-router)

# usage

```javascript
const http = require('http')
const router = require('server-base/router')
const routes = router({
  '@setup': (ctx) => { /* see below for context methods */ },
  '/url/:name': (req, res, params) => res.text(params.name),
  '/get/.*': {
    get (req, res, params, splat) {
      res.json([params, splat])
    }
  },
  '/echo-gen': {
    * post (req, res) {
      const json = yield req.json()
      res.json(json)
    }
  },
  '/echo-sync': {
    async post (req, res) {
      const json = await req.json()
      res.json(json)
    }
  }
})
const server = http.createServer(routes)
server.listen(1234)
```

# routes are defined using [http-hash](https://npm.im/http-hash)

# mime types / content-type using [mime](https://npm.im/mime)

The url extensions is used to determine the mime type used in the response.

# process.env.MIME_TYPES (string)

Defines extra types using [mime](https://npm.im/mime)

# process.env.MIME_TYPES_PATH

Defines extra types using [mime](https://npm.im/mime)

## `@setup context` methods

`createLog` is [server-base-log](https://npm.im/server-base-log) module for service

`log` is an instance of [server-base-log](https://npm.im/server-base-log) using name provided

`mime` is [mime](https://npm.im/mime) module

`use` add middleware function or array of functions
```javascript
context.use((q, r, next) => {
  next()
})
```

# request helper methods

`req.json` handle application/json data
```javascript
const json = await req.json()
```

`req.form` handle application/x-www-form-urlencoded data
```javascript
const form = await req.form()
```

# response helper methods

`res.notFound` built in function setting 404

`res.error(error)` built in helper function for responding with errors

`res.setNextErrorMessage(err, code)` set next error returned to user

`res.setNextErrorCode(code)` set next error code returned to user

# install

With [npm](https://npmjs.org) do:

```
npm install server-base-router
```

# license

MIT
