# server base pino logger

simple wrapper for [pino](https://npm.im/pino) used by [server-base](https://npm.im/server-base)

[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![build status](https://api.travis-ci.org/JamesKyburz/server-base-log.svg)](https://travis-ci.org/JamesKyburz/server-base-log)
[![downloads](https://img.shields.io/npm/dm/server-base-log.svg)](https://npmjs.org/package/server-base-log)

# usage

```javascript
const log = require('server-base-log')(__filename, { optional pino options })

log.info('ok')
```

`info, fatal, debug, error, trace and warn` are bound to correct this for convenience.

# log options

All options are passed to `pino`

`opt.pretty` options are passed to `pino.pretty` constructor

default log options are 
```
  safe: true,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    q: pino.stdSerializers.req,
    r: pino.stdSerializers.res
  }
````

# http request logging

Both `log.info({ q, r })` and `log.info({ req, res })` work.

# env
setting `process.env.LOG_PRETTY` uses `pino.pretty`

setting `process.env.LOG_LEVEL` overrides the default log level which is `debug`

# install

With [npm](https://npmjs.org) do:

```
npm install server-base-log
```

# license

[Apache License, Version 2.0](LICENSE)
