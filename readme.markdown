# server base

base for micro services or simple servers

### DockerFile

```
from jameskyburz/server-base:lastest
expose 1900
```

### package.json
```json
{
  "scripts": {
    "docker:build": "docker build -t awesome-server .",
    "docker:run": "docker run -d --restart=always -p 1900:1900 --name awesome-server awesome-server"
  }
}
```

### index.js
```
var service = require('server-base')
var routes = require('./routes')
service('awesome-server', routes)
.config.assert(['PORT'])
.start()
```

### routes.js

```
module.exports = routes

function routes (router) {
  router.set('/hello', (q, r) => r.end('world'))
}
```

### .env
```
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
