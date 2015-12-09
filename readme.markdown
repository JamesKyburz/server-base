# server base

base for micro services or simple servers

### DockerFile

```
from server-base
expose 1900
```

### package.json
```json
{
  "scripts": {
    "predocker:build": "docker build -t server-base git@github.com:JamesKyburz/server-base.git",
    "docker:build": "docker build -t awesome-server .",
    "docker:run": "docker run -d --restart=always -p 1900:1900 --name awesome-server awesome-server"
  }
}
```

### main.js
```
var service = require('server-base')
var routes = require('./routes')
var app = service('awesome-server', routes)
app.config.assert(['PORT'])
app.start()
```

### routes.js

```
module.exports = routes

function routes (router) {
  router.set('/hello', (q, r) => {
    r.end('world')
  })
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
