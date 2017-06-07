# server base

base for micro services or simple servers

[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://github.com/feross/standard)
[![build status](https://api.travis-ci.org/JamesKyburz/server-base.svg)](https://travis-ci.org/JamesKyburz/server-base)
[![downloads](https://img.shields.io/npm/dm/server-base.svg)](https://npmjs.org/package/server-base)

### usage

```
const service = require('server-base')
service(({
  '/hello': (req, res) => res.end('world')
})
.start(5000)
```

### router

See [server-base-router](https://github.com/JamesKyburz/server-base/tree/master/packages/server-base-router) for details.

See [server-base-router-tests](https://github.com/JamesKyburz/server-base/tree/master/packages/server-base-router/test) for details.

### logger

See [server-base-log](https://github.com/JamesKyburz/server-base/tree/master/packages/server-base-log) for details.

### .env

If a .env file exists it will load the values into process.env using [dotenv](https://npm.im/dotenv).

```dosini
PORT=1900
```

# install

With [npm](https://npmjs.org) do:

```
npm install server-base
```

# license

MIT
