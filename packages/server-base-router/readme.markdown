# server base router

The router used by [server-base](https://npm.im/server-base)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

# usage

```javascript
const http = require('http')

const router = require('server-base-router')('lol', (routes, context) => {
  routes.set('/health.txt', (q, r) => r.end('ok'))
  routes.set('/dynamic-content-type.*', (q, r) => r.end('yes'))
})

server.listen(1234)
```

routes are defined using the [http-hash](https://npm.im/http-hash) module

named parameters and wildcards can be used.

```javascript
routes.set('/url/:name', (request, response, params, splat) => {
  // params.name
})

routes.set('/get/.*', (request, response, params, splat) => {
  // splat would contain everything after /get/
})
```

# router(routes, context)

routes is an instance of [http-hash](https://npm.im/http-hash)

context exposes the helper functions

# helper functions

```javascript
  var context = {
    createLog: createLog,
    log: createLog(name),
    mime: mime,
    notFound: notFound,
    jsonBody: jsonBody,
    formBody: formBody,
    errorReply: errorReply,
    use: use,
    middlewareFunctions: []
  }
```

All of them can be overriden

`createLog` is [server-base-log](https://npm.im/server-base-log) module

`log` is an instance of [server-base-log](https://npm.im/server-base-log) using name provided

`mime` is [mime](https://npm.im/mime) module

`notFound` built in function setting 404

`jsonBody` handle application/json data
```javascript
context.jsonBody(q, r, (json) => {
  // json object
  // if invalid data is sent errorReply is called
})
```

`formBody` handle application/x-www-form-urlencoded data
```javascript
context.formBody(q, r, (form) => {
  // form object
  // if invalid data is sent errorReply is called
})
```

`errorReply` built in helper function for responding with errors

`use` add middleware function or array of functions
```javascript
context.use((q, r, next) => {
  next()
})
```


# mime types / content-type

The url extensions is used to determine the mime type

# env

setting `process.env.MIME_TYPES` defines extra types using the [mime](https://npm.im/mime)

# install

With [npm](https://npmjs.org) do:

```
npm install server-base-router
```

# license

MIT
