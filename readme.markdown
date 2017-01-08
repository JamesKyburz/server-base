# server base

base for micro services or simple servers

### usage

```
var service = require('server-base')
var name = require('./package.json').name
service(name, (router, context) => {
  router.set('/hello', (q, r) => r.end('world'))
})
.start(1234)
```

Calling start with no arguments requires process.env.PORT to be set.

### router

See [server-base-router](https://npm.im/server-base-router) for details.

### logger

See [server-base-log](https://npm.im/server-base-log) for details.

### Docker

Docker images hosted at https://hub.docker.com/r/jameskyburz/server-base/

See [server-base-docker](https://github.com/JamesKyburz/server-base-docker) repository.

### .env

If a .env file exists it will load the values into process.env using [dotenv](https://npm.im/dotenv).

```dosini
PORT=1900
```

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

# install

With [npm](https://npmjs.org) do:

```
npm install server-base
```

# license

MIT
